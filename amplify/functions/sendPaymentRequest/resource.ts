import { defineFunction } from '@aws-amplify/backend-function';
import * as path from 'path';
export const sendPaymentRequestFunction = defineFunction({
  entry: path.resolve(import.meta.dirname, 'handler.ts'),
});