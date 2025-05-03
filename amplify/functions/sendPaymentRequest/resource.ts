import { defineFunction } from '@aws-amplify/backend-function';
// import * as path from 'path'; // No longer needed if using relative string

export const sendPaymentRequestFunction = defineFunction({
  // Use path relative to this file
  entry: './handler.ts',
});