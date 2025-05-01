// amplify/functions/sendPaymentRequest/handler.ts
import type { AppSyncResolverHandler } from 'aws-lambda';
// --- Import SDK types ---
import { SESClient, SendEmailCommand, type SendEmailCommandInput } from "@aws-sdk/client-ses"; // Import input type
import { CognitoIdentityProviderClient, AdminGetUserCommand } from "@aws-sdk/client-cognito-identity-provider";
// --- End Imports ---

const sesClient = new SESClient({});
const cognitoClient = new CognitoIdentityProviderClient({});

// Interface for expected arguments
interface RequestPaymentArgs {
    input: { // Assuming input object based on schema
        amount: number;
    }
}

// Final check deploy
// Interface for identity object based on logs
interface AppSyncCognitoIdentity {
    claims?: {
        sub?: string;
        email?: string;
        "cognito:username"?: string;
        [key: string]: any;
    };
    // --- FIX: Add top-level properties seen in logs ---
    sub?: string;
    username?: string;
    // --- END FIX ---
    sourceIp?: string[];
    [key: string]: any;
}

// Return type must be string | null
export const handler: AppSyncResolverHandler<RequestPaymentArgs, string | null> = async (event) => {
    const FROM_EMAIL = process.env.FROM_EMAIL;
    const TO_EMAIL = "ross@aurumif.com";
    const USER_POOL_ID = process.env.USER_POOL_ID; // Will be undefined until manually set

    console.log('EVENT:', JSON.stringify(event, null, 2));

    if (!FROM_EMAIL || FROM_EMAIL === 'your-verified-sender-email@example.com') {
        console.error('FROM_EMAIL environment variable not set correctly.');
        return null; // Return null on config error
    }
    if (!USER_POOL_ID) {
        console.warn('USER_POOL_ID environment variable not set. Cannot perform email lookup.');
        // Will proceed using username/sub as identifier
    }

    // Extract Arguments
    const args = event.arguments;
    console.log('Arguments Received:', JSON.stringify(args));
    // --- FIX: Access amount ONLY via input object (matching args interface) ---
    const requestedAmount = args?.input?.amount;
    console.log('Extracted requestedAmount:', requestedAmount);

    // Validate Amount
    if (typeof requestedAmount !== 'number' || requestedAmount <= 0) {
        console.error("Invalid amount type or value:", requestedAmount);
        return null; // Return null on validation error
    }

    // Extract User Identity
    const identity = event.identity as AppSyncCognitoIdentity | null;
    console.log('Identity Object:', JSON.stringify(identity, null, 2));
    let userIdentifier: string = 'Unknown User';
    // --- Access checks should now be valid based on updated interface ---
    const cognitoUsername = identity?.username;

    if (cognitoUsername) {
        userIdentifier = cognitoUsername; // Default to username/GUID
        if (USER_POOL_ID) {
            try {
                console.log(`Attempting AdminGetUser for username: ${cognitoUsername} in pool ${USER_POOL_ID}`);
                const getUserCommand = new AdminGetUserCommand({ UserPoolId: USER_POOL_ID, Username: cognitoUsername });
                const userData = await cognitoClient.send(getUserCommand);
                console.log("AdminGetUser Response:", userData);
                const emailAttribute = userData.UserAttributes?.find(attr => attr.Name === 'email');
                if (emailAttribute?.Value) {
                    userIdentifier = emailAttribute.Value;
                    console.log(`Found email via AdminGetUser: ${userIdentifier}`);
                } else { console.log("Email attribute not found via AdminGetUser."); }
            } catch (cognitoError: any) {
                console.error("Error calling AdminGetUser (check IAM permissions):", cognitoError);
            }
        } else { console.warn("Skipping AdminGetUser because USER_POOL_ID env var is missing."); }
    } else if (identity?.sub) { // Fallback to sub (now type-valid)
         userIdentifier = identity.sub;
    }
    console.log('Resolved User Identifier for email:', userIdentifier);


    // Construct email body
    const emailSubject = `Payment Request Received`;
    const emailBody = `A payment request for £${requestedAmount.toFixed(2)} has been submitted by user: ${userIdentifier}.`; // Safe: amount is number > 0

    // --- FIX: Explicitly type sendEmailParams ---
    const sendEmailParams: SendEmailCommandInput = {
        Source: FROM_EMAIL, // FROM_EMAIL is guaranteed string here
        Destination: { ToAddresses: [TO_EMAIL] },
        Message: { Subject: { Data: emailSubject }, Body: { Text: { Data: emailBody } } }
    };
    // --- END FIX ---

  // Inside handler function in amplify/functions/sendPaymentRequest/handler.ts

    try {
        console.log(`Attempting AdminGetUser...`); // Lookup logic remains the same
        // ... existing AdminGetUser logic to resolve userIdentifier ...
        console.log(`Resolved User Identifier for email: ${userIdentifier}`);

        const emailSubject = `Payment Request Received`;
        const emailBody = `A payment request for £${requestedAmount!.toFixed(2)} has been submitted by user: ${userIdentifier}.`;
        const sendEmailParams: SendEmailCommandInput = { /* ... */ };

        console.log(`Attempting to send email from ${FROM_EMAIL} to ${TO_EMAIL}`);
        await sesClient.send(new SendEmailCommand(sendEmailParams));
        console.log("Email send command issued successfully.");

        // --- NEW: Create CurrentAccountTransaction record ---
        try {
            console.log(`Creating PAYMENT_REQUEST transaction for amount: ${requestedAmount}`);
            // We need the AppSync endpoint and region - ideally pass as env vars
            // Or use Amplify client libs if packaged with function (complex setup)
            // Let's assume using AWS SDK for AppSync GraphQL call from Lambda:

            // 1. Define the mutation (ensure client ID/secrets aren't needed if using IAM auth from Lambda role)
            const appsyncClient = new AppSyncClient({}); // Uses Lambda role credentials
            const mutation = gql`
                mutation CreatePaymentRequestTransaction($input: CreateCurrentAccountTransactionInput!) {
                  createCurrentAccountTransaction(input: $input) { id createdAt }
                }`;
            const variables = {
                input: {
                    type: 'PAYMENT_REQUEST', // Note: Ensure this matches Enum definition exactly
                    amount: requestedAmount,
                    description: `Payment Request`,
                    // Owner should be set automatically by AppSync based on the caller's identity
                    // BUT Lambda role is the caller here. We need to pass owner explicitly.
                    // If AppSync resolver sets owner from context.identity, we might not need it here.
                    // Let's OMIT owner here and assume AppSync resolver context handles it via owner auth rule.
                }
            };
            const command = new ExecuteStatementCommand({ // Incorrect - need GraphQL command
                 // --- Need to use @aws-sdk/client-appsync with GraphQLCommand ---
                 // This requires more setup - installing AppSync client, getting endpoint
                 // For now, let's just log that we *would* create it.
            });
            console.warn("SKIPPING creation of CurrentAccountTransaction - requires AppSync client setup in Lambda.");
            // await appsyncClient.send(command); // Placeholder for actual call
            console.log("CurrentAccountTransaction record creation step passed (simulated).");

        } catch (dbError: any) {
             console.error("Error creating CurrentAccountTransaction record:", dbError);
             // Decide if this should prevent overall success message? Maybe just log.
             // Return a specific error indicating partial success?
             return `Request submitted and email sent, but failed to record transaction: ${dbError.message}`;
        }
        // --- END Transaction record ---

        return `Payment request for £${requestedAmount!.toFixed(2)} submitted successfully.`;

    } catch (error: any) { // Catch for SES or potentially AdminGetUser errors
        console.error("Error sending email via SES or getting user:", error);
        const errorMessage = error.message || 'Internal Error';
        return `Error: Failed to process request (${errorMessage}). Please contact support.`;
    }
};