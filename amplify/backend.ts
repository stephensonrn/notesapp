// Filename: amplify/backend.ts

import { defineBackend } from '@aws-amplify/backend';
import { defineFunction } from '@aws-amplify/backend-function';
import { auth } from './auth/resource';
import { data } from './data/resource'; // Assumes this ONLY defines models now
import * as path from 'path';
// No IAM/CDK imports needed here now

// 1. Define the Lambda Function Resource (MINIMAL definition)
export const sendPaymentRequestFunction = defineFunction({
  // Removed name
  entry: path.join('functions', 'sendPaymentRequest', 'handler.ts'),
  environment: {
    // --- USER_POOL_ID REMOVED FROM HERE ---
    // It caused a compilation error. Will be set manually in console.
    // --- Keep FROM_EMAIL (ensure it has your REAL verified email) ---
    FROM_EMAIL: 'your-real-verified-email@example.com',
  },
  // --- REMOVED allowPolicies block entirely ---
  // It failed previously. Permissions will be set manually in console.
});

// 2. Define and Export the Backend
export const backend = defineBackend({
  auth,
  data, // Provides the API for data models only
  sendPaymentRequestFunction, // Defines the function resource itself
});

// NOTE: Permissions (SES + Cognito) and the specific User Pool ID env var
// for the function MUST be configured manually in the AWS Console after deployment.
// The API trigger (AppSync Resolver) also needs manual configuration.