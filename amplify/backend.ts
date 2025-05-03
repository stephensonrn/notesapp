// Filename: amplify/backend.ts
// Minimal version to allow deployment - requires manual configuration post-deploy

import { defineBackend } from '@aws-amplify/backend';
import { defineFunction } from '@aws-amplify/backend-function'; // Needed if functions defined here, but resource files are better

// Import the resource definitions
import { auth } from './auth/resource';
import { data } from './data/resource'; // Defines models + adminAddCashReceipt mutation
// Import function resource definitions (assuming files exist and export correctly)
import { sendPaymentRequestFunction } from './functions/sendPaymentRequest/resource';
import { adminDataActionsFunction } from './functions/adminDataActions/resource';

// Define and Export the Backend, including the functions
// This tells Amplify that these functions are part of the backend,
// but doesn't attempt complex configuration here.
export const backend = defineBackend({
  auth,
  data,
  sendPaymentRequestFunction, // Include existing function resource definition
  adminDataActionsFunction,   // Include new function resource definition
});

// NOTE: You need to manually add the following in the AWS Console after deployment:
// 1. Lambda Env Var for sendPaymentRequestFunction: USER_POOL_ID
// 2. Lambda Env Var for sendPaymentRequestFunction: CURRENT_ACCT_TABLE_NAME
// 3. Lambda Env Var for adminDataActionsFunction: CURRENT_ACCT_TABLE_NAME
// 4. Lambda Env Var for sendPaymentRequestFunction: FROM_EMAIL (Set your verified email - check function resource.ts too)
// 5. Lambda IAM Role Permissions for sendPaymentRequestFunction: ses:SendEmail, cognito-idp:AdminGetUser, dynamodb:PutItem
// 6. Lambda IAM Role Permissions for adminDataActionsFunction: dynamodb:PutItem
// 7. AppSync Schema: Add 'PaymentRequestInput', 'AdminAddCashReceiptInput', 'Mutation { requestPayment(...), adminAddCashReceipt(...) }'
// 8. AppSync Data Sources: Create/Verify one for each Lambda function, ensure Role ARN and Trust Policy are correct.
// 9. AppSync Resolvers: Create/Verify one for 'requestPayment' and one for 'adminAddCashReceipt', linking to correct Data Source with correct VTL/Direct setting.