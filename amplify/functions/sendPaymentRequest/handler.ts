// amplify/functions/sendPaymentRequest/handler.ts
import type { AppSyncResolverHandler } from 'aws-lambda';
import { SESClient, SendEmailCommand, type SendEmailCommandInput } from "@aws-sdk/client-ses"; // Keep SendEmailCommandInput
import { CognitoIdentityProviderClient, AdminGetUserCommand } from "@aws-sdk/client-cognito-identity-provider";

const sesClient = new SESClient({});
const cognitoClient = new CognitoIdentityProviderClient({});

interface RequestPaymentArgs { input?: { amount: number; }; amount?: number; } // Keep arg definition
// Interface for identity object based on logs
interface AppSyncCognitoIdentity {
    claims?: {
        sub?: string;
        email?: string;
        "cognito:username"?: string;
        [key: string]: any; // Allows other claims we might not know about
    };
    // --- Ensure these top-level optional properties are present ---
    sub?: string;
    username?: string;
    // --- You might also see these based on logs ---
    issuer?: string;
    sourceIp?: string[];
    defaultAuthStrategy?: string;
    groups?: string[] | null;
    // --- Allow any other properties ---
    [key: string]: any;
}

export const handler: AppSyncResolverHandler<RequestPaymentArgs, string | null> = async (event) => {
    const FROM_EMAIL = process.env.FROM_EMAIL;
    const TO_EMAIL = "ross@aurumif.com";
    const USER_POOL_ID = process.env.USER_POOL_ID;

    console.log('EVENT:', JSON.stringify(event, null, 2));
    if (!FROM_EMAIL || FROM_EMAIL === 'your-verified-sender-email@example.com') { return 'Error: Lambda configuration error (FROM_EMAIL).'; }

    const args = event.arguments;
    const requestedAmount = args?.input?.amount ?? args?.amount;
    if (typeof requestedAmount !== 'number' || requestedAmount <= 0) { return 'Error: Invalid payment amount provided.'; }

    // User Identity Extraction Logic (remains the same)
    const identity = event.identity as AppSyncCognitoIdentity | null;
    let userIdentifier: string = 'Unknown User';
    const cognitoUsername = identity?.username;
    if (cognitoUsername && USER_POOL_ID) {
        try {
            const getUserCommand = new AdminGetUserCommand({ UserPoolId: USER_POOL_ID, Username: cognitoUsername });
            const userData = await cognitoClient.send(getUserCommand);
            const emailAttribute = userData.UserAttributes?.find(attr => attr.Name === 'email');
            userIdentifier = emailAttribute?.Value || cognitoUsername; // Use email or fallback to username
        } catch (cognitoError: any) { console.error("Error calling AdminGetUser:", cognitoError); userIdentifier = cognitoUsername; } // Use username on error
    } else if (cognitoUsername) { userIdentifier = cognitoUsername; console.warn("USER_POOL_ID not set, using username as identifier."); }
    else if (identity?.sub) { userIdentifier = identity.sub; }
    console.log('Resolved User Identifier for email:', userIdentifier);

    // Construct email body
    const emailSubject = `Payment Request Received`;
    const emailBody = `A payment request for £${requestedAmount.toFixed(2)} has been submitted by user: ${userIdentifier}.`;

    // --- FIX: Define sendEmailParams correctly ---
    const sendEmailParams: SendEmailCommandInput = {
        Source: FROM_EMAIL,
        Destination: { ToAddresses: [TO_EMAIL] },
        Message: { Subject: { Data: emailSubject }, Body: { Text: { Data: emailBody } } }
    };
    // --- END FIX ---

    try {
        console.log(`Attempting to send email from ${FROM_EMAIL} to ${TO_EMAIL}`);
        await sesClient.send(new SendEmailCommand(sendEmailParams)); // Ensure this is uncommented if desired
        console.log("Email send command issued successfully.");

        // --- REMOVED AppSync/GraphQL call block ---

        return `Payment request for £${requestedAmount!.toFixed(2)} submitted successfully.`; // Success

    } catch (error: any) {
        console.error("Error sending email via SES:", error);
        const errorMessage = error.message || 'Internal SES Error';
        return `Error: Failed to send email notification (${errorMessage}). Please contact support.`; // Error
    }
};