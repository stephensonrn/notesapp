// Filename: amplify/functions/adminDataActions/handler.ts
import type { AppSyncResolverHandler } from 'aws-lambda';
// Import DynamoDB Document Client V3 and PutCommand
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
// Import ULID for unique IDs
import { ulid } from "ulid";

// Initialize DynamoDB Client
const ddbClient = new DynamoDBClient({});
const marshallOptions = { removeUndefinedValues: true };
const translateConfig = { marshallOptions };
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient, translateConfig);

// Interface for the arguments defined in the custom input type
interface AdminAddCashReceiptArgs {
    input: {
        targetOwnerId: string;
        amount: number;
        description?: string | null; // Match optionality in schema
    }
}

// Define expected return type matching the schema (or null on error)
// Adjust fields based on your CurrentAccountTransaction model definition
type CurrentAccountTransactionResult = {
    id: string;
    owner: string;
    type: 'PAYMENT_REQUEST' | 'CASH_RECEIPT';
    amount: number;
    description?: string | null;
    createdAt: string;
    updatedAt: string;
    __typename: 'CurrentAccountTransaction';
} | null;


// Main handler function
export const handler: AppSyncResolverHandler<AdminAddCashReceiptArgs, CurrentAccountTransactionResult> = async (event) => {
    // Read Environment Variable for table name (MUST be set manually if code definition fails)
    const CURRENT_ACCT_TABLE_NAME = process.env.CURRENT_ACCT_TABLE_NAME;

    console.log('ADMIN ACTION EVENT:', JSON.stringify(event, null, 2));

    // --- Validate Environment Variable ---
    if (!CURRENT_ACCT_TABLE_NAME) {
        console.error('CURRENT_ACCT_TABLE_NAME environment variable not set.');
        // Throw error back to AppSync
        throw new Error('Lambda configuration error (TABLE NAME).');
    }

    // --- Extract & Validate Arguments ---
    const args = event.arguments?.input; // Arguments are nested under input
    if (!args) {
        console.error("Input arguments are missing.");
        throw new Error('Input arguments are required.');
    }
    const { targetOwnerId, amount, description } = args;
    if (!targetOwnerId) {
        console.error("targetOwnerId is missing.");
        throw new Error('Target Owner ID is required.');
    }
    if (typeof amount !== 'number' || amount <= 0) {
        console.error("Invalid amount type or value:", amount);
        throw new Error('Invalid cash receipt amount provided.');
    }
    console.log(`Admin request to add CASH_RECEIPT for owner ${targetOwnerId} amount ${amount}`);

    // --- Optional: Verify Caller is Admin (though AppSync should enforce) ---
    // You could add checks on event.identity.claims['cognito:groups'] here if needed

    // --- Prepare Item for DynamoDB ---
    const transactionId = ulid();
    const timestamp = new Date().toISOString();
    const transactionItem = {
        id: transactionId,
        owner: targetOwnerId, // Set owner to the target user ID passed in
        type: 'CASH_RECEIPT', // Specific type for this action
        amount: amount,
        description: description ?? null, // Handle optional description
        createdAt: timestamp,
        updatedAt: timestamp,
        __typename: 'CurrentAccountTransaction' // Match GraphQL type name
    };

    // --- Perform DynamoDB Write ---
    try {
        console.log("Attempting to put item into DynamoDB Table:", CURRENT_ACCT_TABLE_NAME);
        const putCommand = new PutCommand({
            TableName: CURRENT_ACCT_TABLE_NAME,
            Item: transactionItem,
        });
        await ddbDocClient.send(putCommand);
        console.log("CurrentAccountTransaction record created successfully by admin.");

        // Return the newly created item (matching the GraphQL return type)
        // Note: Need to cast return value to satisfy handler type, TS doesn't know PutCommand returns the item structure
        return transactionItem as CurrentAccountTransactionResult;

    } catch (dbError: any) {
        console.error("Error creating CurrentAccountTransaction record by admin (check DDB permissions):", dbError);
        // Throw error back to AppSync - client will see it in errors array
        throw new Error(`Failed to create cash receipt record: ${dbError.message || 'Internal DB Error'}`);
    }
}; // End of handler