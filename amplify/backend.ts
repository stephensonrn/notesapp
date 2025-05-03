// Filename: amplify/backend.ts - ABSOLUTE MINIMUM for deployment

import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource'; // Defines models + admin mutation type

// DO NOT import or include function resources here due to persistent build bug
// import { sendPaymentRequestFunction } from './functions/sendPaymentRequest/resource';
// import { adminDataActionsFunction } from './functions/adminDataActions/resource';

export const backend = defineBackend({
  auth, // Include Auth resources
  data, // Include Data resources (AppSync API for models, etc.)
  // sendPaymentRequestFunction, // REMOVED from definition
  // adminDataActionsFunction,   // REMOVED from definition
});

// NOTE: Lambda functions, their Env Vars, their IAM Permissions,
// and their AppSync Resolvers MUST ALL be managed manually in the AWS Console.