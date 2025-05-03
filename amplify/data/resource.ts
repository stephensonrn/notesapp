// Filename: amplify/data/resource.ts
// CORRECTED version with inline input definition for custom mutation

import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
// Import function resource needed for the handler link
import { adminDataActionsFunction } from '../functions/adminDataActions/resource'; // Adjust path if necessary

// Enums
const LedgerEntryType = a.enum([
  'INVOICE',
  'CREDIT_NOTE',
  'INCREASE_ADJUSTMENT',
  'DECREASE_ADJUSTMENT',
]);
const CurrentAccountTransactionType = a.enum([
  'PAYMENT_REQUEST',
  'CASH_RECEIPT'
]);

// Main Schema Definition
const schema = a.schema({
  // --- AdminAddCashReceiptInput definition REMOVED ---

  // Models
  LedgerEntry: a
    .model({
      type: LedgerEntryType,
      amount: a.float().required(),
      description: a.string(),
    })
    .authorization((allow) => [allow.owner()]),

  AccountStatus: a
    .model({
      totalUnapprovedInvoiceValue: a.float().required().default(0),
      // currentAccountBalance removed
    })
    .authorization((allow) => [
        allow.owner().to(['read']),
        allow.groups(['Admin']).to(['read', 'update']) // Use array for groups
    ]),

  CurrentAccountTransaction: a
    .model({
        type: CurrentAccountTransactionType,
        amount: a.float().required(),
        description: a.string(),
    })
    .authorization((allow) => [
        allow.owner().to(['read', 'delete']),
        allow.groups(['Admin']).to(['create', 'read']) // Use array for groups
    ]),

  // Custom mutation for Admin
  adminAddCashReceipt: a.mutation()
      // --- Define arguments inline using a.input() ---
      .arguments({
          input: a.input({ // Creates an inline input type structure
              targetOwnerId: a.string().required(),
              amount: a.float().required(),
              description: a.string()
          }).required() // The 'input' argument itself is required
      })
      // --- End argument definition ---
      .returns(a.ref('CurrentAccountTransaction')) // Returns the created transaction
      .authorization((allow) => [allow.groups(['Admin'])]) // Only Admins can call
      .handler(a.handler.function(adminDataActionsFunction)), // Link to the admin Lambda

}); // End of a.schema({})

// Define data resource
export const data = defineData({
  schema,
  authorizationModes: { defaultAuthorizationMode: 'userPool' },
});

// Export Schema type for frontend
export type Schema = ClientSchema<typeof schema>;