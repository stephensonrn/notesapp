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

    try {
        console.log(`Attempting to send email from ${FROM_EMAIL} to ${TO_EMAIL}`);
        await sesClient.send(new SendEmailCommand(sendEmailParams)); // Type-safe now
        console.log("Email send command issued successfully.");
        // Using '!' on requestedAmount is safe due to validation check above
        return `Payment request for £${requestedAmount!.toFixed(2)} submitted successfully.`;
    } catch (error: any) {
        console.error("Error sending email via SES (check Lambda IAM permissions):", error);
        const errorMessage = error.message || 'Internal SES Error';
        return `Error: Failed to send email notification (${errorMessage}). Please contact support.`; // Return error string
    }
};