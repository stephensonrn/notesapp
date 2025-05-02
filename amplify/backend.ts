// Filename: amplify/backend.ts
import { defineBackend } from '@aws-amplify/backend';
import { defineFunction } from '@aws-amplify/backend-function';
import { auth } from './auth/resource';
import { data } from './data/resource'; // Includes CurrentAccountTransaction model
import * as path from 'path';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';

// Import BOTH functions
import { sendPaymentRequestFunction } from './functions/sendPaymentRequest/resource';
import { adminDataActionsFunction } from './functions/adminDataActions/resource'; // <-- Import new function

// Export the backend definition
export const backend = defineBackend({
  auth,
  data,
  sendPaymentRequestFunction, // Keep existing function
  adminDataActionsFunction,   // <-- Add new function here

  // --- Define Global Outputs / Overrides if needed ---
  // Example: Trying to grant permission and set Env Vars
  // NOTE: Based on previous errors, this referencing style might fail compilation.
  // Be prepared to remove this section and configure manually in console.
  // -------------------------------------------------------------
  postSynthesize: (context) => {
    // Attempt to set Table Name for Admin Function
    context.stack.node.tryFindChild(adminDataActionsFunction.resources.lambda.node.id)?.addEnvironment(
      'CURRENT_ACCT_TABLE_NAME',
      context.stack.node.tryFindChild(data.resources.tables.CurrentAccountTransaction.node.id)?.tableName ?? 'MISSING_TABLE_NAME'
    );
    // Attempt to set Table Name for Payment Function (if removed earlier)
    context.stack.node.tryFindChild(sendPaymentRequestFunction.resources.lambda.node.id)?.addEnvironment(
      'CURRENT_ACCT_TABLE_NAME',
      context.stack.node.tryFindChild(data.resources.tables.CurrentAccountTransaction.node.id)?.tableName ?? 'MISSING_TABLE_NAME'
    );
    // Attempt to set User Pool ID for Payment Function (if removed earlier)
     context.stack.node.tryFindChild(sendPaymentRequestFunction.resources.lambda.node.id)?.addEnvironment(
      'USER_POOL_ID',
      context.stack.node.tryFindChild(auth.resources.userPool.node.id)?.userPoolId ?? 'MISSING_POOL_ID'
    );

    // Attempt to grant DDB PutItem to Admin Function
    context.stack.node.tryFindChild(adminDataActionsFunction.resources.lambda.role?.node.id)?.addToPrincipalPolicy(
      new PolicyStatement({
        actions: ['dynamodb:PutItem'],
        resources: [context.stack.node.tryFindChild(data.resources.tables.CurrentAccountTransaction.node.id)?.tableArn ?? '*'],
      })
    );
     // Attempt to grant DDB PutItem to Payment Function (if removed earlier)
    context.stack.node.tryFindChild(sendPaymentRequestFunction.resources.lambda.role?.node.id)?.addToPrincipalPolicy(
      new PolicyStatement({
        actions: ['dynamodb:PutItem'],
        resources: [context.stack.node.tryFindChild(data.resources.tables.CurrentAccountTransaction.node.id)?.tableArn ?? '*'],
      })
    );
     // Attempt to grant Cognito GetUser to Payment Function (if removed earlier)
    context.stack.node.tryFindChild(sendPaymentRequestFunction.resources.lambda.role?.node.id)?.addToPrincipalPolicy(
      new PolicyStatement({
        actions: ['cognito-idp:AdminGetUser'],
        resources: [context.stack.node.tryFindChild(auth.resources.userPool.node.id)?.userPoolArn ?? '*'],
      })
    );
     // Attempt to grant SES SendEmail to Payment Function (if removed earlier)
    context.stack.node.tryFindChild(sendPaymentRequestFunction.resources.lambda.role?.node.id)?.addToPrincipalPolicy(
      new PolicyStatement({
        actions: ['ses:SendEmail'],
        resources: ['*'], // SES SendEmail typically uses Resource: *
      })
    );
  }
  // -------------------------------------------------------------

}); // End defineBackend

// NOTE: Manual config in console is still the most reliable fallback for
// Env Vars, IAM Permissions, and AppSync Resolvers if code above fails.