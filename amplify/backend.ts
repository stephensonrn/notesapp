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
  sendPaymentRequestFunction, // Include existing function
  adminDataActionsFunction,   // Include new function
  // NO postSynthesize
  // Env vars and Permissions MUST be configured manually post-deploy
});