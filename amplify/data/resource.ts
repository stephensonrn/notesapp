// Filename: amplify/data/resource.ts
// CORRECTED version using scalar arguments for custom mutation

import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { adminDataActionsFunction } from '../functions/adminDataActions/resource'; // Keep this import

// Enums remain the same
const LedgerEntryType = a.enum([ 'INVOICE', 'CREDIT_NOTE', 'INCREASE_ADJUSTMENT', 'DECREASE_ADJUSTMENT' ]);
const CurrentAccountTransactionType = a.enum([ 'PAYMENT_REQUEST', 'CASH_RECEIPT' ]);

const schema = a.schema({
  // Models remain the same
  LedgerEntry: a.model({ type: LedgerEntryType, amount: a.float().required(), description: a.string(), }).authorization((allow) => [allow.owner()]),
  AccountStatus: a.model({ totalUnapprovedInvoiceValue: a.float().required().default(0), }).authorization((allow) => [allow.owner().to(['read']), allow.groups(['Admin']).to(['read', 'update'])]),
  CurrentAccountTransaction: a.model({ type: CurrentAccountTransactionType, amount: a.float().required(), description: a.string(), }).authorization((allow) => [allow.owner().to(['read', 'delete']), allow.groups(['Admin']).to(['create', 'read'])]),

  // Custom mutation for Admin
  adminAddCashReceipt: a.mutation()
      // --- FIX: Define arguments as separate scalars ---
      .arguments({
          targetOwnerId: a.string().required(),
          amount: a.float().required(),
          description: a.string() // Optional scalar argument
      })
      // --- END FIX ---
      .returns(a.ref('CurrentAccountTransaction'))
      .authorization((allow) => [allow.groups(['Admin'])])
      .handler(a.handler.function(adminDataActionsFunction)), // Keep handler link

}); // End of a.schema({})

// Define data resource - unchanged
export const data = defineData({
  schema,
  authorizationModes: { defaultAuthorizationMode: 'userPool' },
});

// Export Schema type for frontend
export type Schema = ClientSchema<typeof schema>;