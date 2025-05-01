// Filename: amplify/backend.ts
import { defineBackend } from '@aws-amplify/backend';
import { defineFunction } from '@aws-amplify/backend-function';
import { auth } from './auth/resource';
import { data } from './data/resource'; // Includes CurrentAccountTransaction model now
import * as path from 'path';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';

// Define the Lambda Function Resource
export const sendPaymentRequestFunction = defineFunction({
  name: 'sendPaymentRequestFn', // Use the name referenced by AppSync resolver (if set manually)
  entry: path.join('functions', 'sendPaymentRequest', 'handler.ts'),
  environment: {
    // --- CRITICAL: Replace with your verified SES email ---
    FROM_EMAIL: 'your-real-verified-email@example.com',
    // --- Attempt to reference User Pool ID (might fail compile) ---
    USER_POOL_ID: auth.resources.userPool.userPoolId,
    // --- Attempt to reference Table Name (might fail compile) ---
    CURRENT_ACCT_TABLE_NAME: data.resources.tables.CurrentAccountTransaction.tableName,
  },
  // --- Attempt to add ALL required permissions ---
  // This block might fail compilation - remove if it does and add manually
  allowPolicies: (grant) => [
      grant.createAwsSdkCalls({ actions: ["ses:SendEmail"], resources: ["*"] }),
      grant.createAwsSdkCalls({
          actions: ["cognito-idp:AdminGetUser"],
          resources: [auth.resources.userPool.userPoolArn], // Use ARN output
      }),
      // Add DynamoDB PutItem Permission for the transaction table
      grant.createAwsSdkCalls({
          actions: ["dynamodb:PutItem"],
          resources: [data.resources.tables.CurrentAccountTransaction.tableArn], // Use Table ARN
      })
  ],
});

// Define and Export the Backend
export const backend = defineBackend({
  auth,
  data, // Includes schema for all models
  sendPaymentRequestFunction, // Include function definition itself
});