// amplify/functions/sendPaymentRequest/handler.ts
import type { AppSyncResolverHandler } from 'aws-lambda';
import { SESClient, SendEmailCommand, type SendEmailCommandInput } from "@aws-sdk/client-ses";
import { CognitoIdentityProviderClient, AdminGetUserCommand } from "@aws-sdk/client-cognito-identity-provider";
// Import DynamoDB Document Client V3 and PutCommand
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
// Import ULID for unique, sortable IDs
import { ulid } from "ulid";

// Initialize AWS SDK Clients
const sesClient = new SESClient({});
const cognitoClient = new CognitoIdentityProviderClient({});
const ddbClient = new DynamoDBClient({});
const marshallOptions = { removeUndefinedValues: true }; // Option to potentially remove undefined attributes before sending to DynamoDB
const translateConfig = { marshallOptions };
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient, translateConfig);

// Interface for expected GraphQL arguments from AppSync
interface RequestPaymentArgs {
    input: { // Assumes the 'amount' is nested within an 'input' object
        amount: number;
    }
}

// Interface for the Cognito identity object passed by AppSync
interface AppSyncCognitoIdentity {
    claims?: {
        sub?: string;
        email?: string;
        "cognito:username"?: string;
        [key: string]: any;
    };
    sub?: string;       // Usually the same as username, unique user identifier
    username?: string;  // Often the unique sub/GUID
    sourceIp?: string[];
    [key: string]: any;
}

// Main Lambda handler function
export const handler: AppSyncResolverHandler<RequestPaymentArgs, string | null> = async (event) => {
    // Read Environment Variables passed from backend.ts/Lambda console
    const FROM_EMAIL = process.env.FROM_EMAIL;
    const TO_EMAIL = "ross@aurumif.com"; // Hardcoded recipient
    const USER_POOL_ID = process.env.USER_POOL_ID;
    const CURRENT_ACCT_TABLE_NAME = process.env.CURRENT_ACCT_TABLE_NAME;

    console.log('EVENT:', JSON.stringify(event, null, 2));

    // --- Validate Environment Variables ---
    if (!FROM_EMAIL || FROM_EMAIL === 'your-verified-sender-email@example.com') {
        console.error('FROM_EMAIL environment variable not set correctly.');
        return 'Error: Lambda configuration error (FROM_EMAIL).';
    }
    if (!USER_POOL_ID) {
        console.warn('USER_POOL_ID environment variable not set. Cannot perform email lookup.');
        // Proceed without email lookup, identifier will be username/sub
    }
    if (!CURRENT_ACCT_TABLE_NAME) {
        console.error('CURRENT_ACCT_TABLE_NAME environment variable not set.');
        // Proceed without DB write, but log the error
    }

    // --- Extract & Validate Arguments ---
    const args = event.arguments;
    console.log('Arguments Received:', JSON.stringify(args));
    const requestedAmount = args?.input?.amount; // Get amount from input object
    console.log('Extracted requestedAmount:', requestedAmount);
    if (typeof requestedAmount !== 'number' || requestedAmount <= 0) {
        console.error("Invalid amount type or value:", requestedAmount);
        return 'Error: Invalid payment amount provided.';
    }

    // --- Extract User Identity ---
    const identity = event.identity as AppSyncCognitoIdentity | null;
    console.log('Identity Object:', JSON.stringify(identity, null, 2));

    let userIdentifierForEmail: string = 'Unknown User'; // For the email body
    // Use 'sub' if available, otherwise 'username', as the reliable owner ID for DB record
    let ownerId: string | undefined = identity?.sub || identity?.username;
    const cognitoUsernameForLookup = identity?.username; // Use username for AdminGetUser call

    if (cognitoUsernameForLookup && USER_POOL_ID) {
        userIdentifierForEmail = cognitoUsernameForLookup; // Default to username for email
        try {
            console.log(`Attempting AdminGetUser for username: ${cognitoUsernameForLookup} in pool ${USER_POOL_ID}`);
            const getUserCommand = new AdminGetUserCommand({ UserPoolId: USER_POOL_ID, Username: cognitoUsernameForLookup });
            const userData = await cognitoClient.send(getUserCommand);
            console.log("AdminGetUser Response:", JSON.stringify(userData.UserAttributes));
            const emailAttribute = userData.UserAttributes?.find(attr => attr.Name === 'email');
            if (emailAttribute?.Value) {
                userIdentifierForEmail = emailAttribute.Value; // Use email for notification if found
                console.log(`Found email via AdminGetUser: ${userIdentifierForEmail}`);
            } else {
                console.log("Email attribute not found via AdminGetUser.");
            }
        } catch (cognitoError: any) {
            console.error("Error calling AdminGetUser (check IAM permissions):", cognitoError);
            // Keep username as identifier if lookup fails
        }
    } else if (ownerId) { // Fallback if username was missing but sub exists
         userIdentifierForEmail = ownerId;
    }

    // Ensure we have an ownerId before proceeding if we plan to write to DB
     if (!ownerId){
        console.error("Owner ID (sub/username) is missing from identity. Cannot reliably identify user for DB record.");
        // Decide how critical this is - maybe still send email but return specific error?
         userIdentifierForEmail = "Unknown (ID missing)";
    }

    console.log('Resolved User Identifier (for email):', userIdentifierForEmail);
    console.log('Owner ID (for DB record):', ownerId);
    // --- End User Identity Extraction ---

    // Construct email body
    const emailSubject = `Payment Request Received`;
    const emailBody = `A payment request for £${requestedAmount.toFixed(2)} has been submitted by user: ${userIdentifierForEmail}.`;
    const sendEmailParams: SendEmailCommandInput = {
        Source: FROM_EMAIL,
        Destination: { ToAddresses: [TO_EMAIL] },
        Message: { Subject: { Data: emailSubject }, Body: { Text: { Data: emailBody } } }
    };

    let emailSentSuccessfully = false;
    let transactionRecordError: string | null = null;

    // --- Main Logic: Send Email THEN Record Transaction ---
    try {
        console.log(`Attempting to send email from ${FROM_EMAIL} to ${TO_EMAIL}`);
        await sesClient.send(new SendEmailCommand(sendEmailParams));
        console.log("Email send command issued successfully.");
        emailSentSuccessfully = true;

    } catch (error: any) {
        console.error("Error sending email via SES (check Lambda IAM permissions):", error);
        const errorMessage = error.message || 'Internal SES Error';
        // If email fails, we don't proceed to DB write and return error immediately
        return `Error: Failed to send email notification (${errorMessage}). Please contact support.`;
    }

    // --- If email was sent successfully, attempt to record the transaction ---
    if (emailSentSuccessfully) {
        if (!CURRENT_ACCT_TABLE_NAME) {
             console.error("Cannot record transaction - table name env var missing.");
             transactionRecordError = "Transaction recording failed (config error)."; // Store error message
        } else if (!ownerId) {
             console.error("Cannot create transaction record: Owner ID is missing from identity.");
             transactionRecordError = "Transaction recording failed (missing owner)."; // Store error message
        } else {
            // Proceed with DB write attempt
            const transactionId = ulid(); // Generate unique, sortable ID
            const timestamp = new Date().toISOString();
            // Item structure must match the CurrentAccountTransaction model schema
            const transactionItem = {
                id: transactionId,
                owner: ownerId,
                type: 'PAYMENT_REQUEST', // Type indicating funds drawn
                amount: requestedAmount, // Store positive amount requested
                description: `Payment Request`,
                createdAt: timestamp,
                updatedAt: timestamp,
                __typename: 'CurrentAccountTransaction' // Match GraphQL type name
            };

            try {
                console.log("Attempting to put item into DynamoDB Table:", CURRENT_ACCT_TABLE_NAME);
                const putCommand = new PutCommand({
                    TableName: CURRENT_ACCT_TABLE_NAME,
                    Item: transactionItem,
                });
                await ddbDocClient.send(putCommand);
                console.log("CurrentAccountTransaction record created successfully.");
                // Both email and DB write succeeded

            } catch (dbError: any) {
                console.error("Error creating CurrentAccountTransaction record (check DDB permissions):", dbError);
                transactionRecordError = `Transaction recording failed (${dbError.message || 'DB Error'}).`; // Store error
            }
        }
    }

    // --- Final Return Message ---
    // Using '!' on requestedAmount is safe due to validation check above
    let finalMessage = `Payment request for £${requestedAmount!.toFixed(2)} submitted successfully.`;
    if (transactionRecordError) {
        finalMessage += ` ${transactionRecordError}`; // Append warning if recording failed
    }
    return finalMessage;

}; // End of handler