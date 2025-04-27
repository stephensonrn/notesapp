// amplify/functions/sendPaymentRequest/handler.ts
import type { AppSyncResolverHandler } from 'aws-lambda';
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const sesClient = new SESClient({});

// Define expected arguments structure (adjust if needed based on schema)
interface RequestPaymentArgs {
    input?: {
        amount: number;
    }
    amount?: number; // Optional fallback if amount is top-level
}

// Expected structure of the identity object from AppSync + Cognito User Pools
// Note: claims content can vary based on token type (access vs id) and pool config
interface CognitoIdentity {
    claims?: {
        sub?: string;
        email?: string; // This might or might not be present
        email_verified?: boolean;
        "cognito:username"?: string; // Often same as top-level username/sub
        [key: string]: any; // Allow other claims
    };
    sub?: string;
    issuer?: string;
    username?: string; // Often the UUID-like sub
    sourceIp?: string[];
    defaultAuthStrategy?: string;
    groups?: string[] | null;
}

// Return type must be string | null
export const handler: AppSyncResolverHandler<RequestPaymentArgs, string | null> = async (event) => {
    const FROM_EMAIL = process.env.FROM_EMAIL; // Assumes this is correctly set via deployment
    const TO_EMAIL = "ross@aurumif.com"; // Hardcoded recipient

    console.log('EVENT:', JSON.stringify(event, null, 2));

    if (!FROM_EMAIL) {
        console.error('FROM_EMAIL environment variable not set correctly in deployed function.');
        return 'Error: Lambda configuration error (FROM_EMAIL).'; // User-friendly error
    }

    // Extract Arguments
    const args = event.arguments;
    console.log('Arguments Received:', JSON.stringify(args));
    const requestedAmount = args?.input?.amount ?? args?.amount;
    console.log('Extracted requestedAmount:', requestedAmount);

    // Validate Amount
    if (typeof requestedAmount !== 'number' || requestedAmount <= 0) {
        console.error("Invalid amount type or value:", requestedAmount);
        return 'Error: Invalid payment amount provided.'; // User-friendly error
    }

    // Extract User Identity (Prioritize Email Claim)
    const identity = event.identity as CognitoIdentity | null; // Type assertion
    console.log('Identity Object:', JSON.stringify(identity, null, 2));

    let userIdentifier = 'Unknown User';
    if (identity?.claims?.email) { // Check for email in claims first
         userIdentifier = identity.claims.email;
    } else if (identity?.username) { // Fallback to top-level username
         userIdentifier = identity.username;
    } else if (identity?.sub) { // Fallback to top-level sub if username also missing
        userIdentifier = identity.sub;
    }
    console.log('Resolved User Identifier for email:', userIdentifier);

    // Construct email body
    const emailSubject = `Payment Request Received`;
    // Use the resolved identifier in the body
    const emailBody = `A payment request for £${requestedAmount.toFixed(2)} has been submitted by user: ${userIdentifier}.`;

    const sendEmailParams = {
        Source: FROM_EMAIL,
        Destination: { ToAddresses: [TO_EMAIL] },
        Message: { Subject: { Data: emailSubject }, Body: { Text: { Data: emailBody } } }
    };

    try {
        console.log(`Attempting to send email from ${FROM_EMAIL} to ${TO_EMAIL}`);
        // --- Ensure this line is uncommented ---
        await sesClient.send(new SendEmailCommand(sendEmailParams));
        console.log("Email send command issued successfully.");

        // Return success message
        // Using '!' because the check above guarantees it's a number here
        return `Payment request for £${requestedAmount!.toFixed(2)} submitted successfully.`;

    } catch (error: any) {
        console.error("Error sending email via SES:", error);
        // Log the specific SES error if possible
        const errorMessage = error.message || 'Unknown SES error';
        return `Error: Failed to send email notification (${errorMessage}). Please contact support.`;
    }
};