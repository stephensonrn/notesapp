// Filename: amplify/backend.ts
import { defineBackend } from '@aws-amplify/backend';
import { defineFunction } from '@aws-amplify/backend-function';
import { auth } from './auth/resource';
import { data } from './data/resource'; // Imports the models-only definition
import * as path from 'path';

// 1. Define the Lambda Function Resource (MINIMAL)
export const sendPaymentRequestFunction = defineFunction({
  // name: 'sendPaymentRequestFn', // Name might be optional, removing temporarily
  entry: path.join('functions', 'sendPaymentRequest', 'handler.ts'),
  environment: {
    // --- CRITICAL: Make sure this is your REAL verified email ---
    FROM_EMAIL: 'ross@aurumif.com',
    // USER_POOL_ID will need to be set manually in Lambda Console
  },
  // No permissions defined here - MUST be done manually
});

// 2. Define and Export the Backend
export const backend = defineBackend({
  auth,
  data, // Provides the API for data models only
  sendPaymentRequestFunction, // Defines the function resource
});