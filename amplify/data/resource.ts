// Filename: amplify/data/resource.ts

import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

// Define Enum used by LedgerEntry
const LedgerEntryType = a.enum([
  'INVOICE',
  'CREDIT_NOTE',
  'INCREASE_ADJUSTMENT',
  'DECREASE_ADJUSTMENT',
]);

// Define the schema containing ONLY the data models
const schema = a.schema({
  // LedgerEntry model definition
  LedgerEntry: a
    .model({
      type: LedgerEntryType, // Required by default
      amount: a.float().required(),
      description: a.string(),
      // createdAt & updatedAt are automatically added by @model
    })
    .authorization((allow) => [
      allow.owner() // Grant owner full access
    ]),

  // AccountStatus model definition
  AccountStatus: a
    .model({
      totalUnapprovedInvoiceValue: a.float().required().default(0),
      currentAccountBalance: a.float().required().default(0),
      // createdAt & updatedAt are automatically added by @model
    })
    .authorization((allow) => [
       allow.owner() // Grant owner full access
    ]),
}); // End of a.schema({...})

// Define the data resource, passing the schema and authorization config
export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool', // Your default auth mode
  },
  // NOTE: No 'resolvers' or 'functions' properties here
});

// Export the TypeScript type for the schema (used by the client)
export type Schema = ClientSchema<typeof schema>;