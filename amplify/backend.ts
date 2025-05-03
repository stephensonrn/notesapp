// Filename: amplify/backend.ts
import { defineBackend } from '@aws-amplify/backend';
// Ensure these paths are correct relative to backend.ts
import { sendPaymentRequestFunction } from './functions/sendPaymentRequest/resource';
import { adminDataActionsFunction } from './functions/adminDataActions/resource';
import { auth } from './auth/resource';
import { data } from './data/resource'; // Defines models + adminAddCashReceipt mutation

export const backend = defineBackend({
  auth,
  data,
  sendPaymentRequestFunction, // Include existing function resource definition
  adminDataActionsFunction,   // Include new function resource definition
  // NO postSynthesize or allowPolicies blocks
});

// NOTE: Env Vars (USER_POOL_ID, CURRENT_ACCT_TABLE_NAME for BOTH functions if needed)
// AND IAM Permissions (SES, Cognito, DynamoDB for BOTH functions)
// AND AppSync Resolvers (for BOTH mutations) MUST be configured manually post-deploy.