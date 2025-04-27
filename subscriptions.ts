/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "./API";
type GeneratedSubscription<InputType, OutputType> = string & {
  __generatedSubscriptionInput: InputType;
  __generatedSubscriptionOutput: OutputType;
};

export const onCreateAccountStatus = /* GraphQL */ `subscription OnCreateAccountStatus(
  $filter: ModelSubscriptionAccountStatusFilterInput
  $owner: String
) {
  onCreateAccountStatus(filter: $filter, owner: $owner) {
    createdAt
    currentAccountBalance
    id
    owner
    totalUnapprovedInvoiceValue
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateAccountStatusSubscriptionVariables,
  APITypes.OnCreateAccountStatusSubscription
>;
export const onCreateLedgerEntry = /* GraphQL */ `subscription OnCreateLedgerEntry(
  $filter: ModelSubscriptionLedgerEntryFilterInput
  $owner: String
) {
  onCreateLedgerEntry(filter: $filter, owner: $owner) {
    amount
    createdAt
    description
    id
    owner
    type
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateLedgerEntrySubscriptionVariables,
  APITypes.OnCreateLedgerEntrySubscription
>;
export const onDeleteAccountStatus = /* GraphQL */ `subscription OnDeleteAccountStatus(
  $filter: ModelSubscriptionAccountStatusFilterInput
  $owner: String
) {
  onDeleteAccountStatus(filter: $filter, owner: $owner) {
    createdAt
    currentAccountBalance
    id
    owner
    totalUnapprovedInvoiceValue
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteAccountStatusSubscriptionVariables,
  APITypes.OnDeleteAccountStatusSubscription
>;
export const onDeleteLedgerEntry = /* GraphQL */ `subscription OnDeleteLedgerEntry(
  $filter: ModelSubscriptionLedgerEntryFilterInput
  $owner: String
) {
  onDeleteLedgerEntry(filter: $filter, owner: $owner) {
    amount
    createdAt
    description
    id
    owner
    type
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteLedgerEntrySubscriptionVariables,
  APITypes.OnDeleteLedgerEntrySubscription
>;
export const onUpdateAccountStatus = /* GraphQL */ `subscription OnUpdateAccountStatus(
  $filter: ModelSubscriptionAccountStatusFilterInput
  $owner: String
) {
  onUpdateAccountStatus(filter: $filter, owner: $owner) {
    createdAt
    currentAccountBalance
    id
    owner
    totalUnapprovedInvoiceValue
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateAccountStatusSubscriptionVariables,
  APITypes.OnUpdateAccountStatusSubscription
>;
export const onUpdateLedgerEntry = /* GraphQL */ `subscription OnUpdateLedgerEntry(
  $filter: ModelSubscriptionLedgerEntryFilterInput
  $owner: String
) {
  onUpdateLedgerEntry(filter: $filter, owner: $owner) {
    amount
    createdAt
    description
    id
    owner
    type
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateLedgerEntrySubscriptionVariables,
  APITypes.OnUpdateLedgerEntrySubscription
>;
