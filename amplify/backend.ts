// Filename: amplify/backend.ts

import { defineBackend } from '@aws-amplify/backend';
import { defineFunction } from '@aws-amplify/backend-function'; // Keep this import

import { auth } from './auth/resource'; // Your auth resource
import { data } from './data/resource'; // Your data resource (models ONLY from data/resource.ts)
import * as path from 'path';
// NO CDK imports needed here for now

// 1. Define the Lambda Function Resource (MINIMAL definition)
// Exporting it might allow referencing it later if needed
export const sendPaymentRequestFunction = defineFunction({
  // No name, no permissions defined here to ensure compilation
  entry: path.join('functions', 'sendPaymentRequest', 'handler.ts'),
  environment: {
    // --- IMPORTANT: Replace with your verified SES sender email ---
    FROM_EMAIL: 'ross@aurumif.com',
  },
});

// 2. Define and Export the Backend - constituent resources ONLY
export const backend = defineBackend({
  auth,
  data, // Provides the API for data models only defined in data/resource.ts
  sendPaymentRequestFunction, // Defines the function resource itself
});

// NOTE: The 'defineApi' import and usage have been removed.
// NOTE: The attempt to add permissions via 'backend.resources...' has been removed.
// Linking the function to an API mutation and adding SES permissions
// need to be solved separately using a different method.