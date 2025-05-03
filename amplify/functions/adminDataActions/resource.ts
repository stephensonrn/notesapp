import { defineFunction } from '@aws-amplify/backend-function';
// import * as path from 'path'; // No longer needed

export const adminDataActionsFunction = defineFunction({
  // Use path relative to this file
  entry: './handler.ts',
});