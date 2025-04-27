/* tslint:disable */
/* eslint-disable */
//  This file was automatically generated and should not be edited.

export type AccountStatus = {
  __typename: "AccountStatus",
  createdAt: string,
  currentAccountBalance: number,
  id: string,
  owner?: string | null,
  totalUnapprovedInvoiceValue: number,
  updatedAt: string,
};

export type LedgerEntry = {
  __typename: "LedgerEntry",
  amount: number,
  createdAt: string,
  description?: string | null,
  id: string,
  owner?: string | null,
  type?: LedgerEntryType | null,
  updatedAt: string,
};

export enum LedgerEntryType {
  CREDIT_NOTE = "CREDIT_NOTE",
  DECREASE_ADJUSTMENT = "DECREASE_ADJUSTMENT",
  INCREASE_ADJUSTMENT = "INCREASE_ADJUSTMENT",
  INVOICE = "INVOICE",
}


export type ModelAccountStatusFilterInput = {
  and?: Array< ModelAccountStatusFilterInput | null > | null,
  createdAt?: ModelStringInput | null,
  currentAccountBalance?: ModelFloatInput | null,
  id?: ModelIDInput | null,
  not?: ModelAccountStatusFilterInput | null,
  or?: Array< ModelAccountStatusFilterInput | null > | null,
  owner?: ModelStringInput | null,
  totalUnapprovedInvoiceValue?: ModelFloatInput | null,
  updatedAt?: ModelStringInput | null,
};

export type ModelStringInput = {
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
  beginsWith?: string | null,
  between?: Array< string | null > | null,
  contains?: string | null,
  eq?: string | null,
  ge?: string | null,
  gt?: string | null,
  le?: string | null,
  lt?: string | null,
  ne?: string | null,
  notContains?: string | null,
  size?: ModelSizeInput | null,
};

export enum ModelAttributeTypes {
  _null = "_null",
  binary = "binary",
  binarySet = "binarySet",
  bool = "bool",
  list = "list",
  map = "map",
  number = "number",
  numberSet = "numberSet",
  string = "string",
  stringSet = "stringSet",
}


export type ModelSizeInput = {
  between?: Array< number | null > | null,
  eq?: number | null,
  ge?: number | null,
  gt?: number | null,
  le?: number | null,
  lt?: number | null,
  ne?: number | null,
};

export type ModelFloatInput = {
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
  between?: Array< number | null > | null,
  eq?: number | null,
  ge?: number | null,
  gt?: number | null,
  le?: number | null,
  lt?: number | null,
  ne?: number | null,
};

export type ModelIDInput = {
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
  beginsWith?: string | null,
  between?: Array< string | null > | null,
  contains?: string | null,
  eq?: string | null,
  ge?: string | null,
  gt?: string | null,
  le?: string | null,
  lt?: string | null,
  ne?: string | null,
  notContains?: string | null,
  size?: ModelSizeInput | null,
};

export type ModelAccountStatusConnection = {
  __typename: "ModelAccountStatusConnection",
  items:  Array<AccountStatus | null >,
  nextToken?: string | null,
};

export type ModelLedgerEntryFilterInput = {
  amount?: ModelFloatInput | null,
  and?: Array< ModelLedgerEntryFilterInput | null > | null,
  createdAt?: ModelStringInput | null,
  description?: ModelStringInput | null,
  id?: ModelIDInput | null,
  not?: ModelLedgerEntryFilterInput | null,
  or?: Array< ModelLedgerEntryFilterInput | null > | null,
  owner?: ModelStringInput | null,
  type?: ModelLedgerEntryTypeInput | null,
  updatedAt?: ModelStringInput | null,
};

export type ModelLedgerEntryTypeInput = {
  eq?: LedgerEntryType | null,
  ne?: LedgerEntryType | null,
};

export type ModelLedgerEntryConnection = {
  __typename: "ModelLedgerEntryConnection",
  items:  Array<LedgerEntry | null >,
  nextToken?: string | null,
};

export type ModelAccountStatusConditionInput = {
  and?: Array< ModelAccountStatusConditionInput | null > | null,
  createdAt?: ModelStringInput | null,
  currentAccountBalance?: ModelFloatInput | null,
  not?: ModelAccountStatusConditionInput | null,
  or?: Array< ModelAccountStatusConditionInput | null > | null,
  owner?: ModelStringInput | null,
  totalUnapprovedInvoiceValue?: ModelFloatInput | null,
  updatedAt?: ModelStringInput | null,
};

export type CreateAccountStatusInput = {
  currentAccountBalance: number,
  id?: string | null,
  totalUnapprovedInvoiceValue: number,
};

export type ModelLedgerEntryConditionInput = {
  amount?: ModelFloatInput | null,
  and?: Array< ModelLedgerEntryConditionInput | null > | null,
  createdAt?: ModelStringInput | null,
  description?: ModelStringInput | null,
  not?: ModelLedgerEntryConditionInput | null,
  or?: Array< ModelLedgerEntryConditionInput | null > | null,
  owner?: ModelStringInput | null,
  type?: ModelLedgerEntryTypeInput | null,
  updatedAt?: ModelStringInput | null,
};

export type CreateLedgerEntryInput = {
  amount: number,
  description?: string | null,
  id?: string | null,
  type?: LedgerEntryType | null,
};

export type DeleteAccountStatusInput = {
  id: string,
};

export type DeleteLedgerEntryInput = {
  id: string,
};

export type PaymentRequestInput = {
  amount: number,
};

export type UpdateAccountStatusInput = {
  currentAccountBalance?: number | null,
  id: string,
  totalUnapprovedInvoiceValue?: number | null,
};

export type UpdateLedgerEntryInput = {
  amount?: number | null,
  description?: string | null,
  id: string,
  type?: LedgerEntryType | null,
};

export type ModelSubscriptionAccountStatusFilterInput = {
  and?: Array< ModelSubscriptionAccountStatusFilterInput | null > | null,
  createdAt?: ModelSubscriptionStringInput | null,
  currentAccountBalance?: ModelSubscriptionFloatInput | null,
  id?: ModelSubscriptionIDInput | null,
  or?: Array< ModelSubscriptionAccountStatusFilterInput | null > | null,
  owner?: ModelStringInput | null,
  totalUnapprovedInvoiceValue?: ModelSubscriptionFloatInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
};

export type ModelSubscriptionStringInput = {
  beginsWith?: string | null,
  between?: Array< string | null > | null,
  contains?: string | null,
  eq?: string | null,
  ge?: string | null,
  gt?: string | null,
  in?: Array< string | null > | null,
  le?: string | null,
  lt?: string | null,
  ne?: string | null,
  notContains?: string | null,
  notIn?: Array< string | null > | null,
};

export type ModelSubscriptionFloatInput = {
  between?: Array< number | null > | null,
  eq?: number | null,
  ge?: number | null,
  gt?: number | null,
  in?: Array< number | null > | null,
  le?: number | null,
  lt?: number | null,
  ne?: number | null,
  notIn?: Array< number | null > | null,
};

export type ModelSubscriptionIDInput = {
  beginsWith?: string | null,
  between?: Array< string | null > | null,
  contains?: string | null,
  eq?: string | null,
  ge?: string | null,
  gt?: string | null,
  in?: Array< string | null > | null,
  le?: string | null,
  lt?: string | null,
  ne?: string | null,
  notContains?: string | null,
  notIn?: Array< string | null > | null,
};

export type ModelSubscriptionLedgerEntryFilterInput = {
  amount?: ModelSubscriptionFloatInput | null,
  and?: Array< ModelSubscriptionLedgerEntryFilterInput | null > | null,
  createdAt?: ModelSubscriptionStringInput | null,
  description?: ModelSubscriptionStringInput | null,
  id?: ModelSubscriptionIDInput | null,
  or?: Array< ModelSubscriptionLedgerEntryFilterInput | null > | null,
  owner?: ModelStringInput | null,
  type?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
};

export type GetAccountStatusQueryVariables = {
  id: string,
};

export type GetAccountStatusQuery = {
  getAccountStatus?:  {
    __typename: "AccountStatus",
    createdAt: string,
    currentAccountBalance: number,
    id: string,
    owner?: string | null,
    totalUnapprovedInvoiceValue: number,
    updatedAt: string,
  } | null,
};

export type GetLedgerEntryQueryVariables = {
  id: string,
};

export type GetLedgerEntryQuery = {
  getLedgerEntry?:  {
    __typename: "LedgerEntry",
    amount: number,
    createdAt: string,
    description?: string | null,
    id: string,
    owner?: string | null,
    type?: LedgerEntryType | null,
    updatedAt: string,
  } | null,
};

export type ListAccountStatusesQueryVariables = {
  filter?: ModelAccountStatusFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListAccountStatusesQuery = {
  listAccountStatuses?:  {
    __typename: "ModelAccountStatusConnection",
    items:  Array< {
      __typename: "AccountStatus",
      createdAt: string,
      currentAccountBalance: number,
      id: string,
      owner?: string | null,
      totalUnapprovedInvoiceValue: number,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type ListLedgerEntriesQueryVariables = {
  filter?: ModelLedgerEntryFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListLedgerEntriesQuery = {
  listLedgerEntries?:  {
    __typename: "ModelLedgerEntryConnection",
    items:  Array< {
      __typename: "LedgerEntry",
      amount: number,
      createdAt: string,
      description?: string | null,
      id: string,
      owner?: string | null,
      type?: LedgerEntryType | null,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type CreateAccountStatusMutationVariables = {
  condition?: ModelAccountStatusConditionInput | null,
  input: CreateAccountStatusInput,
};

export type CreateAccountStatusMutation = {
  createAccountStatus?:  {
    __typename: "AccountStatus",
    createdAt: string,
    currentAccountBalance: number,
    id: string,
    owner?: string | null,
    totalUnapprovedInvoiceValue: number,
    updatedAt: string,
  } | null,
};

export type CreateLedgerEntryMutationVariables = {
  condition?: ModelLedgerEntryConditionInput | null,
  input: CreateLedgerEntryInput,
};

export type CreateLedgerEntryMutation = {
  createLedgerEntry?:  {
    __typename: "LedgerEntry",
    amount: number,
    createdAt: string,
    description?: string | null,
    id: string,
    owner?: string | null,
    type?: LedgerEntryType | null,
    updatedAt: string,
  } | null,
};

export type DeleteAccountStatusMutationVariables = {
  condition?: ModelAccountStatusConditionInput | null,
  input: DeleteAccountStatusInput,
};

export type DeleteAccountStatusMutation = {
  deleteAccountStatus?:  {
    __typename: "AccountStatus",
    createdAt: string,
    currentAccountBalance: number,
    id: string,
    owner?: string | null,
    totalUnapprovedInvoiceValue: number,
    updatedAt: string,
  } | null,
};

export type DeleteLedgerEntryMutationVariables = {
  condition?: ModelLedgerEntryConditionInput | null,
  input: DeleteLedgerEntryInput,
};

export type DeleteLedgerEntryMutation = {
  deleteLedgerEntry?:  {
    __typename: "LedgerEntry",
    amount: number,
    createdAt: string,
    description?: string | null,
    id: string,
    owner?: string | null,
    type?: LedgerEntryType | null,
    updatedAt: string,
  } | null,
};

export type RequestPaymentMutationVariables = {
  input: PaymentRequestInput,
};

export type RequestPaymentMutation = {
  requestPayment?: string | null,
};

export type UpdateAccountStatusMutationVariables = {
  condition?: ModelAccountStatusConditionInput | null,
  input: UpdateAccountStatusInput,
};

export type UpdateAccountStatusMutation = {
  updateAccountStatus?:  {
    __typename: "AccountStatus",
    createdAt: string,
    currentAccountBalance: number,
    id: string,
    owner?: string | null,
    totalUnapprovedInvoiceValue: number,
    updatedAt: string,
  } | null,
};

export type UpdateLedgerEntryMutationVariables = {
  condition?: ModelLedgerEntryConditionInput | null,
  input: UpdateLedgerEntryInput,
};

export type UpdateLedgerEntryMutation = {
  updateLedgerEntry?:  {
    __typename: "LedgerEntry",
    amount: number,
    createdAt: string,
    description?: string | null,
    id: string,
    owner?: string | null,
    type?: LedgerEntryType | null,
    updatedAt: string,
  } | null,
};

export type OnCreateAccountStatusSubscriptionVariables = {
  filter?: ModelSubscriptionAccountStatusFilterInput | null,
  owner?: string | null,
};

export type OnCreateAccountStatusSubscription = {
  onCreateAccountStatus?:  {
    __typename: "AccountStatus",
    createdAt: string,
    currentAccountBalance: number,
    id: string,
    owner?: string | null,
    totalUnapprovedInvoiceValue: number,
    updatedAt: string,
  } | null,
};

export type OnCreateLedgerEntrySubscriptionVariables = {
  filter?: ModelSubscriptionLedgerEntryFilterInput | null,
  owner?: string | null,
};

export type OnCreateLedgerEntrySubscription = {
  onCreateLedgerEntry?:  {
    __typename: "LedgerEntry",
    amount: number,
    createdAt: string,
    description?: string | null,
    id: string,
    owner?: string | null,
    type?: LedgerEntryType | null,
    updatedAt: string,
  } | null,
};

export type OnDeleteAccountStatusSubscriptionVariables = {
  filter?: ModelSubscriptionAccountStatusFilterInput | null,
  owner?: string | null,
};

export type OnDeleteAccountStatusSubscription = {
  onDeleteAccountStatus?:  {
    __typename: "AccountStatus",
    createdAt: string,
    currentAccountBalance: number,
    id: string,
    owner?: string | null,
    totalUnapprovedInvoiceValue: number,
    updatedAt: string,
  } | null,
};

export type OnDeleteLedgerEntrySubscriptionVariables = {
  filter?: ModelSubscriptionLedgerEntryFilterInput | null,
  owner?: string | null,
};

export type OnDeleteLedgerEntrySubscription = {
  onDeleteLedgerEntry?:  {
    __typename: "LedgerEntry",
    amount: number,
    createdAt: string,
    description?: string | null,
    id: string,
    owner?: string | null,
    type?: LedgerEntryType | null,
    updatedAt: string,
  } | null,
};

export type OnUpdateAccountStatusSubscriptionVariables = {
  filter?: ModelSubscriptionAccountStatusFilterInput | null,
  owner?: string | null,
};

export type OnUpdateAccountStatusSubscription = {
  onUpdateAccountStatus?:  {
    __typename: "AccountStatus",
    createdAt: string,
    currentAccountBalance: number,
    id: string,
    owner?: string | null,
    totalUnapprovedInvoiceValue: number,
    updatedAt: string,
  } | null,
};

export type OnUpdateLedgerEntrySubscriptionVariables = {
  filter?: ModelSubscriptionLedgerEntryFilterInput | null,
  owner?: string | null,
};

export type OnUpdateLedgerEntrySubscription = {
  onUpdateLedgerEntry?:  {
    __typename: "LedgerEntry",
    amount: number,
    createdAt: string,
    description?: string | null,
    id: string,
    owner?: string | null,
    type?: LedgerEntryType | null,
    updatedAt: string,
  } | null,
};
