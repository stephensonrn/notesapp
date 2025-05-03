// amplify/functions/adminDataActions/handler.ts
// Updated for scalar arguments

import type { AppSyncResolverHandler } from 'aws-lambda';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { ulid } from "ulid";

// Initialize Clients
const ddbClient = new DynamoDBClient({});
const marshallOptions = { removeUndefinedValues: true };
const translateConfig = { marshallOptions };
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient, translateConfig);

// Interface for the FLAT arguments expected now
interface AdminAddCashReceiptArgs {
    targetOwnerId: string;
    amount: number;
    description?: string | null;
}

// Return type definition (adjust fields if your model differs)
type CurrentAccountTransactionResult = {
    id: string; owner: string; type: 'CASH_RECEIPT'; amount: number;
    description?: string | null; createdAt: string; updatedAt: string;
    __typename: 'CurrentAccountTransaction';
} | null;

// Main handler function
export const handler: AppSyncResolverHandler<AdminAddCashReceiptArgs, CurrentAccountTransactionResult> = async (event) => {
    const CURRENT_ACCT_TABLE_NAME = process.env.CURRENT_ACCT_TABLE_NAME;
    console.log('ADMIN ACTION EVENT:', JSON.stringify(event, null, 2));

    if (!CURRENT_ACCT_TABLE_NAME) { /* ... error handling ... */ throw new Error('Lambda config error (TABLE NAME).'); }

    // --- FIX: Extract arguments directly ---
    const { targetOwnerId, amount, description } = event.arguments; // No longer nested under input
    // --- END FIX ---

    console.log(`Admin request to add CASH_RECEIPT for owner ${targetOwnerId} amount ${amount}`);

    // --- Validate Arguments ---
    if (!targetOwnerId) { throw new Error('Target Owner ID is required.'); }
    if (typeof amount !== 'number' || amount <= 0) { throw new Error('Invalid cash receipt amount provided.'); }
    // --- End Validation ---

    // Prepare Item
    const transactionId = ulid();
    const timestamp = new Date().toISOString();
    const transactionItem = {
        id: transactionId,
        owner: targetOwnerId, // Use the target ID passed directly
        type: 'CASH_RECEIPT',
        amount: amount,
        description: description ?? null,
        createdAt: timestamp,
        updatedAt: timestamp,
        __typename: 'CurrentAccountTransaction'
    };

    // Perform DynamoDB Write
    try {
        console.log("Attempting to put item into DynamoDB Table:", CURRENT_ACCT_TABLE_NAME);
        const putCommand = new PutCommand({ TableName: CURRENT_ACCT_TABLE_NAME, Item: transactionItem });
        await ddbDocClient.send(putCommand);
        console.log("CurrentAccountTransaction record created successfully by admin.");
        return transactionItem as CurrentAccountTransactionResult; // Return created item

    } catch (dbError: any) {
        console.error("Error creating CurrentAccountTransaction record by admin:", dbError);
        throw new Error(`Failed to create cash receipt record: ${dbError.message || 'Internal DB Error'}`);
    }
};