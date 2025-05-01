// Filename: amplify/data/resource.ts
import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const LedgerEntryType = a.enum([
  'INVOICE',
  'CREDIT_NOTE',
  'INCREASE_ADJUSTMENT',
  'DECREASE_ADJUSTMENT',
]);

// Schema ONLY defines models
const schema = a.schema({
  LedgerEntry: a
    .model({
      type: LedgerEntryType, // Removed .required() - required by default
      amount: a.float().required(),
      description: a.string(),
    })
    .authorization((allow) => [allow.owner()]),

  AccountStatus: a
    .model({
      totalUnapprovedInvoiceValue: a.float().required().default(0),
      currentAccountBalance: a.float().required().default(0), // This field is defined, but updated manually via console
    })
    .authorization((allow) => [ allow.owner() ]),
}); // End of a.schema({...})

// Define data WITHOUT resolvers
export const data = defineData({
  schema,
  authorizationModes: { defaultAuthorizationMode: 'userPool' },
});

// Keep existing Schema export
export type Schema = ClientSchema<typeof schema>;