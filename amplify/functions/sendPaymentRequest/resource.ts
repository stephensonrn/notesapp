// Filename: amplify/functions/sendPaymentRequest/resource.ts
import { defineFunction } from '@aws-amplify/backend-function';
import * as path from 'path';

// Define and EXPORT the function resource
export const sendPaymentRequestFunction = defineFunction({
  // Name is optional, Amplify uses directory name by default
  // name: 'sendPaymentRequestFn',
  entry: path.resolve(import.meta.dirname, 'handler.ts'), // Correct path using import.meta
  // Environment variables and permissions are defined in backend.ts
  // OR set manually in the console after deployment.
});