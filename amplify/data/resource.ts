// Filename: amplify/data/resource.ts
import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

// Enums remain the same
const LedgerEntryType = a.enum([ 'INVOICE', 'CREDIT_NOTE', 'INCREASE_ADJUSTMENT', 'DECREASE_ADJUSTMENT' ]);
const CurrentAccountTransactionType = a.enum([ 'PAYMENT_REQUEST', 'CASH_RECEIPT' ]);

const schema = a.schema({
  // LedgerEntry - No auth change needed unless admins need access
  LedgerEntry: a
    .model({
      type: LedgerEntryType,
      amount: a.float().required(),
      description: a.string(),
    })
    .authorization((allow) => [
        allow.owner() // Only owner can manage these by default
    ]),

  // AccountStatus - Grant Admin read/update access
  AccountStatus: a
    .model({
      totalUnapprovedInvoiceValue: a.float().required().default(0),
    })
    .authorization((allow) => [
        allow.owner().to(['read']), // Owner can read their own status
        allow.groups('Admin').to(['read', 'update']) // Admins can read/update ANY status record
        // Note: Create might need owner rule if users should implicitly create their own on first access,
        // or admin rule if only admins create the initial record.
        // Let's assume owner rule implicit on create for now.
    ]),

  // CurrentAccountTransaction - Grant Admin create/read access
  CurrentAccountTransaction: a
    .model({
        type: CurrentAccountTransactionType,
        amount: a.float().required(),
        description: a.string(),
    })
    .authorization((allow) => [
        allow.owner().to(['read', 'delete']), // Owner can read/delete their own transactions
        allow.groups('Admin').to(['create', 'read']) // Admins can read ANY and CREATE transactions (incl. for others if needed)
        // Note: We need to ensure the 'owner' field is set correctly when Admins create
    ]),

}); // End of a.schema({})

// Define data resource - unchanged
export const data = defineData({
  schema,
  authorizationModes: { defaultAuthorizationMode: 'userPool' },
});

// Keep existing Schema export
export type Schema = ClientSchema<typeof schema>;