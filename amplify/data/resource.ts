// Filename: amplify/data/resource.ts
import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
// Add near other imports at the top
import { adminDataActionsFunction } from '../functions/adminDataActions/resource'; // Adjust path if your folder structure is different
// Enums
const LedgerEntryType = a.enum([ 'INVOICE', 'CREDIT_NOTE', 'INCREASE_ADJUSTMENT', 'DECREASE_ADJUSTMENT' ]);
const CurrentAccountTransactionType = a.enum([ 'PAYMENT_REQUEST', 'CASH_RECEIPT' ]);

// Main Schema Definition
const schema = a.schema({
  // --- NEW: Custom Input Type for Admin Mutation ---
  AdminAddCashReceiptInput: a.customType({
      targetOwnerId: a.string().required(), // ID of the user this cash receipt belongs to
      amount: a.float().required(),
      description: a.string()
  }),

  // LedgerEntry Model (Unchanged)
  LedgerEntry: a.model({
      type: LedgerEntryType,
      amount: a.float().required(),
      description: a.string(),
    }).authorization((allow) => [allow.owner()]),

  // AccountStatus Model (Unchanged)
  AccountStatus: a.model({
      totalUnapprovedInvoiceValue: a.float().required().default(0),
    }).authorization((allow) => [
        allow.owner().to(['read']),
        allow.groups(['Admin']).to(['read', 'update']) // Use array for groups
    ]),

  // CurrentAccountTransaction Model (Unchanged)
  CurrentAccountTransaction: a.model({
        type: CurrentAccountTransactionType,
        amount: a.float().required(),
        description: a.string(),
    }).authorization((allow) => [
        allow.owner().to(['read', 'delete']),
        allow.groups(['Admin']).to(['read', 'create']) // Use array for groups
    ]),

  // --- NEW: Add custom mutation for Admin ---
  adminAddCashReceipt: a.mutation() // Define as a custom mutation
      .arguments({ input: a.ref('AdminAddCashReceiptInput').required() }) // Use the custom input type
      .returns(a.ref('CurrentAccountTransaction')) // It will return the created transaction
      .authorization((allow) => [allow.groups(['Admin'])]) // Only Admins can call this
	  // --- ADD THIS LINE ---
      .handler(a.handler.function(adminDataActionsFunction)), // Link to the Lambda resource
      // We will link the handler (Lambda) in backend.ts or manually

}); // End of a.schema({})

// Define data resource - unchanged
export const data = defineData({
  schema,
  authorizationModes: { defaultAuthorizationMode: 'userPool' },
});

// Keep existing Schema export
export type Schema = ClientSchema<typeof schema>;