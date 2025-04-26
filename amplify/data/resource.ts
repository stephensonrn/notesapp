// Keep the existing import
import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

// Define the Enum for transaction types first
const LedgerEntryType = a.enum([
  'INVOICE',
  'CREDIT_NOTE',
  'INCREASE_ADJUSTMENT',
  'DECREASE_ADJUSTMENT',
]);

// Define the schema, replacing the Note model with LedgerEntry
const schema = a.schema({
  LedgerEntry: a
    .model({
      // --- CORRECTED LINE ---
      type: LedgerEntryType, // Assign the Enum type directly. Required by default.
      // --- END CORRECTION ---
      amount: a.float().required(),    // Amount is a required float
      description: a.string(),         // Optional description field
      // `createdAt` & `updatedAt` timestamps are typically added automatically by Amplify
      // `owner` field is implicitly handled by the authorization rule below
    })
    .authorization((allow) => [
      allow.owner(), // Allow owner full access (create, read, update, delete)
    ]),
});

// Keep the existing Schema export
export type Schema = ClientSchema<typeof schema>;

// Keep the existing data export, including authorizationModes
export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool', // Keep your existing default mode
  },
});