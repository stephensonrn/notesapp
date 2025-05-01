// Filename: amplify/data/resource.ts
// CORRECT version with CurrentAccountTransaction model

import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

// Original Enum for Sales Ledger items
const LedgerEntryType = a.enum([
  'INVOICE',
  'CREDIT_NOTE',
  'INCREASE_ADJUSTMENT',
  'DECREASE_ADJUSTMENT',
]);

// --- NEW Enum for Current Account transactions ---
const CurrentAccountTransactionType = a.enum([
    'PAYMENT_REQUEST', // Represents funds drawn down / paid out (+)
    'CASH_RECEIPT'     // Represents funds paid back / cash received (-)
]);

// Define the schema
const schema = a.schema({
  // LedgerEntry model - for sales ledger items only
  LedgerEntry: a
    .model({
      type: LedgerEntryType, // Required by default
      amount: a.float().required(),
      description: a.string(),
      // owner, id, createdAt, updatedAt added by @model/@auth
    })
    .authorization((allow) => [allow.owner()]),

  // AccountStatus model - ONLY manual unapproved value now
  AccountStatus: a
    .model({
      totalUnapprovedInvoiceValue: a.float().required().default(0),
      // currentAccountBalance field REMOVED
      // owner, id, createdAt, updatedAt added by @model/@auth
    })
    .authorization((allow) => [ allow.owner() ]),

  // --- NEW Model for Current Account Transactions ---
  CurrentAccountTransaction: a
    .model({
        type: CurrentAccountTransactionType, // Required by default
        amount: a.float().required(),      // Always store positive value of transaction
        description: a.string(),           // Optional description
        // owner, id, createdAt, updatedAt added by @model/@auth
    })
    .authorization((allow) => [ allow.owner() ]), // User owns their transactions

}); // End of a.schema({})

// Define data resource
export const data = defineData({
  schema,
  authorizationModes: { defaultAuthorizationMode: 'userPool' },
});

// Keep existing Schema export
export type Schema = ClientSchema<typeof schema>;