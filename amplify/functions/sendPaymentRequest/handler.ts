// amplify/functions/sendPaymentRequest/handler.ts
import type { AppSyncResolverHandler } from 'aws-lambda';
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
// --- Import Cognito Client ---
import { CognitoIdentityProviderClient, AdminGetUserCommand } from "@aws-sdk/client-cognito-identity-provider";
// --- End Import ---

const sesClient = new SESClient({});
// --- Initialize Cognito Client ---
const cognitoClient = new CognitoIdentityProviderClient({});
// --- End Init ---


// Define expected arguments structure
interface RequestPaymentArgs {
    input: {
        amount: number;
    }
}

// Define a basic type for Cognito identity passed by AppSync
interface AppSyncCognitoIdentity {
    claims?: { [key: string]: any; };
    sub?: string;
    username?: string; // Often the sub/GUID
    sourceIp?: string[];
    [key: string]: any;
}

// Return type must be string | null
export const handler: AppSyncResolverHandler<RequestPaymentArgs, string | null> = async (event) => {
    // Read environment variables INSIDE handler
    const FROM_EMAIL = process.env.FROM_EMAIL;
    const TO_EMAIL = "ross@aurumif.com";
    const USER_POOL_ID = process.env.USER_POOL_ID; // Read User Pool ID

    console.log('EVENT:', JSON.stringify(event, null, 2));

    if (!FROM_EMAIL || FROM_EMAIL === 'your-verified-sender-email@example.com') {
        console.error('FROM_EMAIL environment variable not set correctly.');
        return 'Error: Lambda configuration error (FROM_EMAIL).';
    }
    if (!USER_POOL_ID) {
        console.error('USER_POOL_ID environment variable not set correctly.');
        return 'Error: Lambda configuration error (USER_POOL_ID).';
    }

    // Extract Arguments
    const args = event.arguments;
    console.log('Arguments Received:', JSON.stringify(args));
    const requestedAmount = args?.input?.amount;
    console.log('Extracted requestedAmount:', requestedAmount);

    // Validate Amount
    if (typeof requestedAmount !== 'number' || requestedAmount <= 0) {
        console.error("Invalid amount type or value:", requestedAmount);
        return 'Error: Invalid payment amount provided.';
    }

    // --- User Identity Extraction Logic ---
    const identity = event.identity as AppSyncCognitoIdentity | null;
    console.log('Identity Object:', JSON.stringify(identity, null, 2));

    let userIdentifier: string = 'Unknown User'; // Default
    let resolvedEmail: string | null = null;

    const cognitoUsername = identity?.username; // Get the Cognito username (GUID/sub)

    if (cognitoUsername) {
        userIdentifier = cognitoUsername; // Use username as fallback identifier
        try {
            // Attempt to get full user details from Cognito using the username
            console.log(`Attempting AdminGetUser for username: ${cognitoUsername} in pool ${USER_POOL_ID}`);
            const getUserCommand = new AdminGetUserCommand({
                UserPoolId: USER_POOL_ID,
                Username: cognitoUsername,
            });
            const userData = await cognitoClient.send(getUserCommand);
            console.log("AdminGetUser Response:", userData);

            // Find the email attribute
            const emailAttribute = userData.UserAttributes?.find(attr => attr.Name === 'email');
            if (emailAttribute?.Value) {
                resolvedEmail = emailAttribute.Value;
                userIdentifier = resolvedEmail; // Prioritize email if found
                console.log(`Found email via AdminGetUser: ${resolvedEmail}`);
            } else {
                console.log("Email attribute not found via AdminGetUser.");
            }
        } catch (cognitoError: any) {
            // Log error but continue - we can still use the username/GUID
            console.error("Error calling AdminGetUser:", cognitoError);
            // Don't return an error to the user here, just proceed without the email
        }
    } else {
        console.warn("Could not resolve Cognito username from identity object.");
        // Try sub as last resort? Usually same as username.
         if (identity?.sub && typeof identity.sub === 'string') {
            userIdentifier = identity.sub;
        }
    }

    console.log('Resolved User Identifier for email:', userIdentifier);
    // --- END User Identity Extraction ---

    // Construct email body
    const emailSubject = `Payment Request Received`;
    const emailBody = `A payment request for £${requestedAmount.toFixed(2)} has been submitted by user: ${userIdentifier}.`;

    const sendEmailParams = {
        Source: FROM_EMAIL,
        Destination: { ToAddresses: [TO_EMAIL] },
        Message: { Subject: { Data: emailSubject }, Body: { Text: { Data: emailBody } } }
    };

    try {
        console.log(`Attempting to send email from ${FROM_EMAIL} to ${TO_EMAIL}`);
        // --- Ensure this line is UNCOMMENTED ---
        await sesClient.send(new SendEmailCommand(sendEmailParams));
        console.log("Email send command issued successfully.");

        return `Payment request for £${requestedAmount!.toFixed(2)} submitted successfully.`;

    } catch (error: any) {
        console.error("Error sending email via SES:", error);
        const errorMessage = error.message || 'Internal SES Error';
        return `Error: Failed to send email notification (${errorMessage}). Please contact support.`;
    }
};