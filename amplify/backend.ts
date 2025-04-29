// Filename: amplify/backend.ts

import { defineBackend } from '@aws-amplify/backend';
import { defineFunction } from '@aws-amplify/backend-function';
import { auth } from './auth/resource'; // Your auth resource
import { data } from './data/resource'; // Your data resource
import * as path from 'path';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam'; // Keep for permissions attempt
// Removed CdkFunction import as escape hatch failed before

// 1. Define the Lambda Function Resource
export const sendPaymentRequestFunction = defineFunction({
  name: 'sendPaymentRequestFn', // Keep name for consistency if referenced elsewhere
  entry: path.join('functions', 'sendPaymentRequest', 'handler.ts'),
  environment: {
    // --- Add User Pool ID ---
    // Access the physical user pool ID output from the auth resource
    // The exact path '.userPoolId' depends on how 'defineAuth' exposes outputs. Verify if needed.
    USER_POOL_ID: auth.resources.userPool.userPoolId,
    // --- Keep FROM_EMAIL (ensure it has your real verified email) ---
    FROM_EMAIL: 'ross@aurumif.com',
  },
  // --- Attempt to add Cognito AdminGetUser permission ---
  // This syntax might still fail compilation based on previous errors,
  // but it's the intended place if supported. If it fails, remove this block
  // and plan to add the permission manually in IAM after deployment.
  allowPolicies: (grant) => [
      // Grant SES Send permission (as attempted before)
      grant.createAwsSdkCalls({
          actions: ["ses:SendEmail"],
          resources: ["*"],
      }),
      // Grant Cognito Read permission
      grant.createAwsSdkCalls({
          actions: ["cognito-idp:AdminGetUser"],
          // Restrict resource to the specific user pool
          resources: [auth.resources.userPool.userPoolArn], // Use ARN output from auth resource
      })
  ],
  // --- End Permissions Attempt ---
});

// 2. Define and Export the Backend
export const backend = defineBackend({
  auth,
  data,
  sendPaymentRequestFunction,
});