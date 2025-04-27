// Keep the existing import
import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

// Keep existing Enum for LedgerEntry types
const LedgerEntryType = a.enum([
  'INVOICE',
  'CREDIT_NOTE',
  'INCREASE_ADJUSTMENT',
  'DECREASE_ADJUSTMENT',
]);

// Define the schema
const schema = a.schema({
  // LedgerEntry model remains as it was (no status field needed now)
  LedgerEntry: a
    .model({
      type: LedgerEntryType, // Required by default
      amount: a.float().required(),
      description: a.string(),
      // createdAt/updatedAt automatically added
    })
    .authorization((allow) => [
      allow.owner(), // Allow owner full access
    ]),

  // NEW: Model to store manually input account status values
  // Assume only one record per user (owner)
  AccountStatus: a
    .model({
      // Manual input for total value of unapproved invoices
      totalUnapprovedInvoiceValue: a.float().required().default(0),
      // Manual input for current account balance (facility usage)
      currentAccountBalance: a.float().required().default(0),
    })
    .authorization((allow) => [
       allow.owner(), // Allow owner to manage their own status record
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