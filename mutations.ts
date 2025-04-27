/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "./API";
type GeneratedMutation<InputType, OutputType> = string & {
  __generatedMutationInput: InputType;
  __generatedMutationOutput: OutputType;
};

export const createAccountStatus = /* GraphQL */ `mutation CreateAccountStatus(
  $condition: ModelAccountStatusConditionInput
  $input: CreateAccountStatusInput!
) {
  createAccountStatus(condition: $condition, input: $input) {
    createdAt
    currentAccountBalance
    id
    owner
    totalUnapprovedInvoiceValue
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateAccountStatusMutationVariables,
  APITypes.CreateAccountStatusMutation
>;
export const createLedgerEntry = /* GraphQL */ `mutation CreateLedgerEntry(
  $condition: ModelLedgerEntryConditionInput
  $input: CreateLedgerEntryInput!
) {
  createLedgerEntry(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.CreateLedgerEntryMutationVariables,
  APITypes.CreateLedgerEntryMutation
>;
export const deleteAccountStatus = /* GraphQL */ `mutation DeleteAccountStatus(
  $condition: ModelAccountStatusConditionInput
  $input: DeleteAccountStatusInput!
) {
  deleteAccountStatus(condition: $condition, input: $input) {
    createdAt
    currentAccountBalance
    id
    owner
    totalUnapprovedInvoiceValue
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteAccountStatusMutationVariables,
  APITypes.DeleteAccountStatusMutation
>;
export const deleteLedgerEntry = /* GraphQL */ `mutation DeleteLedgerEntry(
  $condition: ModelLedgerEntryConditionInput
  $input: DeleteLedgerEntryInput!
) {
  deleteLedgerEntry(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.DeleteLedgerEntryMutationVariables,
  APITypes.DeleteLedgerEntryMutation
>;
export const requestPayment = /* GraphQL */ `mutation RequestPayment($input: PaymentRequestInput!) {
  requestPayment(input: $input)
}
` as GeneratedMutation<
  APITypes.RequestPaymentMutationVariables,
  APITypes.RequestPaymentMutation
>;
export const updateAccountStatus = /* GraphQL */ `mutation UpdateAccountStatus(
  $condition: ModelAccountStatusConditionInput
  $input: UpdateAccountStatusInput!
) {
  updateAccountStatus(condition: $condition, input: $input) {
    createdAt
    currentAccountBalance
    id
    owner
    totalUnapprovedInvoiceValue
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateAccountStatusMutationVariables,
  APITypes.UpdateAccountStatusMutation
>;
export const updateLedgerEntry = /* GraphQL */ `mutation UpdateLedgerEntry(
  $condition: ModelLedgerEntryConditionInput
  $input: UpdateLedgerEntryInput!
) {
  updateLedgerEntry(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.UpdateLedgerEntryMutationVariables,
  APITypes.UpdateLedgerEntryMutation
>;
