// Filename: amplify/data/resource.ts
import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const LedgerEntryType = a.enum([ /* ... */ ]);
const CurrentAccountTransactionType = a.enum(['PAYMENT_REQUEST', 'CASH_RECEIPT']);

const schema = a.schema({
  LedgerEntry: a.model({
      type: LedgerEntryType, // REMOVE .required()
      amount: a.float().required(),
      description: a.string(),
  }).authorization((allow) => [allow.owner()]),

  AccountStatus: a.model({
      totalUnapprovedInvoiceValue: a.float().required().default(0),
  }).authorization((allow) => [ allow.owner() ]),

  CurrentAccountTransaction: a.model({
      type: CurrentAccountTransactionType, // REMOVE .required()
      amount: a.float().required(),
      description: a.string(),
  }).authorization((allow) => [ allow.owner() ]),
});

export const data = defineData({
  schema,
  authorizationModes: { defaultAuthorizationMode: 'userPool' },
});

export type Schema = ClientSchema<typeof schema>;