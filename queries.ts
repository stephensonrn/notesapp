/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "./API";
type GeneratedQuery<InputType, OutputType> = string & {
  __generatedQueryInput: InputType;
  __generatedQueryOutput: OutputType;
};

export const getAccountStatus = /* GraphQL */ `query GetAccountStatus($id: ID!) {
  getAccountStatus(id: $id) {
    createdAt
    currentAccountBalance
    id
    owner
    totalUnapprovedInvoiceValue
    updatedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetAccountStatusQueryVariables,
  APITypes.GetAccountStatusQuery
>;
export const getLedgerEntry = /* GraphQL */ `query GetLedgerEntry($id: ID!) {
  getLedgerEntry(id: $id) {
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
` as GeneratedQuery<
  APITypes.GetLedgerEntryQueryVariables,
  APITypes.GetLedgerEntryQuery
>;
export const listAccountStatuses = /* GraphQL */ `query ListAccountStatuses(
  $filter: ModelAccountStatusFilterInput
  $limit: Int
  $nextToken: String
) {
  listAccountStatuses(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      createdAt
      currentAccountBalance
      id
      owner
      totalUnapprovedInvoiceValue
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListAccountStatusesQueryVariables,
  APITypes.ListAccountStatusesQuery
>;
export const listLedgerEntries = /* GraphQL */ `query ListLedgerEntries(
  $filter: ModelLedgerEntryFilterInput
  $limit: Int
  $nextToken: String
) {
  listLedgerEntries(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      amount
      createdAt
      description
      id
      owner
      type
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListLedgerEntriesQueryVariables,
  APITypes.ListLedgerEntriesQuery
>;
