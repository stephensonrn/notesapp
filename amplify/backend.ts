// Filename: amplify/backend.ts
// Attempting deployment WITH function resources included in defineBackend
// WARNING: This has previously failed with module export resolution errors.

import { defineBackend } from '@aws-amplify/backend';
// Import the top-level resource definitions
import { auth } from './auth/resource';
import { data } from './data/resource'; // Assumes this defines models + custom admin mutation type

// Import the function resource definitions (ensure files exist and export correctly)
import { sendPaymentRequestFunction } from './functions/sendPaymentRequest/resource';
import { adminDataActionsFunction } from './functions/adminDataActions/resource';

// Define and Export the Backend, including the function resources
// This tells Amplify the functions are part of the managed backend.
export const backend = defineBackend({
  auth,
  data,
  sendPaymentRequestFunction, // Include reference to the first function's resource definition
  adminDataActionsFunction,   // Include reference to the second function's resource definition
  // NOTE: No environment variables (like USER_POOL_ID, TABLE_NAME) referencing
  // other resources are defined here, as that caused errors.
  // NOTE: No permissions (allowPolicies) are defined here, as that caused errors.
});

// REMINDER: If this deployment fails with the 'does not provide export' error again,
// you MUST revert this file to remove the function imports/includes
// and rely on fully manual configuration for the functions and resolvers.
// If this deployment SUCCEEDS, you still need to manually configure
// Lambda Env Vars (USER_POOL_ID, TABLE_NAME) and Lambda IAM Permissions (SES, Cognito, DDB)
// and the AppSync Resolvers in the AWS Console afterwards.