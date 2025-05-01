// Filename: amplify/data/resource.ts
import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

// --- MODIFIED Enum: Add CASH_RECEIPT ---
const LedgerEntryType = a.enum([
  'INVOICE',
  'CREDIT_NOTE',
  'INCREASE_ADJUSTMENT',
  'DECREASE_ADJUSTMENT',
  'CASH_RECEIPT' // Added new type
]);
// --- END MODIFICATION ---

// Schema ONLY defines models
const schema = a.schema({
  // LedgerEntry model - no changes needed here
  LedgerEntry: a
    .model({
      type: LedgerEntryType, // Uses the updated enum
      amount: a.float().required(),
      description: a.string(),
    })
    .authorization((allow) => [allow.owner()]),

  // AccountStatus model - no changes needed here
  AccountStatus: a
    .model({
      totalUnapprovedInvoiceValue: a.float().required().default(0),
      currentAccountBalance: a.float().required().default(0),
    })
    .authorization((allow) => [ allow.owner() ]),
});

// Define data - no changes needed here
export const data = defineData({
  schema,
  authorizationModes: { defaultAuthorizationMode: 'userPool' },
});

// Keep existing Schema export
export type Schema = ClientSchema<typeof schema>;