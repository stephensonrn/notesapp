// Filename: amplify/functions/adminDataActions/resource.ts
import { defineFunction } from '@aws-amplify/backend-function';
import * as path from 'path';

export const adminDataActionsFunction = defineFunction({
  // Amplify convention usually uses folder name, or specify explicitly:
  // name: 'adminDataActionsFn',
  entry: path.resolve(import.meta.dirname, 'handler.ts'), // Use new import.meta syntax
  // Environment variables and Permissions will be defined in backend.ts
  // OR set manually in console later
});