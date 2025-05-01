// Filename: amplify/backend.ts

import { defineBackend } from '@aws-amplify/backend';
import { defineFunction } from '@aws-amplify/backend-function'; // Keep this import

import { auth } from './auth/resource'; // Your auth resource
// Import data resource which ONLY defines models now (ensure data/resource.ts is updated as per Response #142)
import { data } from './data/resource';
import * as path from 'path';

// 1. Define the Lambda Function Resource (MINIMAL definition)
// Exporting allows potential future referencing if syntax is figured out
export const sendPaymentRequestFunction = defineFunction({
  // No name, no environment vars (besides FROM_EMAIL), no permissions defined here
  entry: path.join('functions', 'sendPaymentRequest', 'handler.ts'),
  environment: {
    // --- CRITICAL: Use your REAL verified email here ---
    FROM_EMAIL: 'your-real-verified-email@example.com',
    // USER_POOL_ID and CURRENT_ACCT_TABLE_NAME MUST be set manually in Lambda console
  },
});

// 2. Define and Export the Backend - constituent resources ONLY
export const backend = defineBackend({
  auth,
  data, // Provides the API for data models only
  sendPaymentRequestFunction, // Defines the function resource itself
});

// NOTE: ALL Permissions (SES, Cognito, DynamoDB) for the Lambda function
// AND the USER_POOL_ID / CURRENT_ACCT_TABLE_NAME environment variables
// AND the AppSync Resolver link MUST be configured manually in AWS Console.