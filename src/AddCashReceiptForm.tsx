// src/AddCashReceiptForm.tsx
// Updated for scalar mutation arguments

import React, { useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource'; // Adjust path if needed
import { Button, Flex, TextField, Text, View, Heading } from '@aws-amplify/ui-react';

// --- FIX: Update Mutation String for scalar arguments ---
const adminAddCashReceiptMutation = /* GraphQL */ `
  mutation AdminAddCashReceipt(
    $targetOwnerId: String!,
    $amount: Float!,
    $description: String
  ) {
    adminAddCashReceipt(
      targetOwnerId: $targetOwnerId,
      amount: $amount,
      description: $description
    ) {
      id # Request fields you want back
      owner
      type
      amount
      description
      createdAt
    }
  }
`;
// --- END FIX ---

const client = generateClient<Schema>(); // Keep client for types if needed

function AddCashReceiptForm() {
  // State remains the same
  const [ownerIdInput, setOwnerIdInput] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const numericAmount = parseFloat(amount);

    if (!ownerIdInput || isNaN(numericAmount) || numericAmount <= 0) {
       setError('Please provide a valid Target User ID and a positive Amount.');
       return;
    }

    setIsLoading(true); setError(null); setSuccess(null);

    // --- FIX: Prepare flat variables object ---
    const variables = {
        targetOwnerId: ownerIdInput,
        amount: numericAmount,
        description: description || null // Pass null if empty string
    };
    // --- END FIX ---

    try {
      console.log("Calling adminAddCashReceipt mutation with variables:", variables);
      // Use client.graphql with updated mutation string and variables
      const result = await client.graphql({
        query: adminAddCashReceiptMutation,
        variables: variables, // Pass flat variables object
        authMode: 'userPool'
      });

      console.log("Admin Add Cash Receipt Result:", result);
      const newTransaction = result.data?.adminAddCashReceipt;
      const errors = result.errors;

      if (errors) throw errors;
      if (!newTransaction) throw new Error("Mutation did not return transaction data.");

      setSuccess(`Cash Receipt of £${numericAmount.toFixed(2)} added for owner ${ownerIdInput}. ID: ${newTransaction.id}`);
      // Clear form
      setOwnerIdInput(''); setAmount(''); setDescription('');

    } catch (err: any) {
      console.error("Error creating cash receipt:", err);
      let displayError = 'Unknown error.';
      if (Array.isArray(err?.errors) && err.errors.length > 0 && err.errors[0].message) { displayError = err.errors[0].message;}
      else if (err?.message) { displayError = err.message;}
      else { try { displayError = JSON.stringify(err); } catch (e) { /* ignore */ }}
      setError(`Failed to add cash receipt: ${displayError}`);
    } finally {
      setIsLoading(false);
    }
  };

  // JSX remains largely the same
  return (
    <View as="form" onSubmit={handleSubmit} /* ... styles ... */ >
      <Heading level={4}>Add Cash Receipt Transaction</Heading>
      <Flex direction="column" gap="small">
        <TextField label="Target User ID (Owner GUID):" id="cash-ownerId" value={ownerIdInput} onChange={(e) => setOwnerIdInput(e.target.value)} isRequired={true} isDisabled={isLoading} />
        <TextField label="Amount Received:" id="cash-amount" type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} isRequired={true} isDisabled={isLoading} />
        <TextField label="Description (Optional):" id="cash-description" value={description} onChange={(e) => setDescription(e.target.value)} isDisabled={isLoading} />
        <Button type="submit" variation="primary" isLoading={isLoading} isDisabled={isLoading}>
          Add Cash Receipt (- Balance)
        </Button>
        {success && <Text color="success">{success}</Text>}
        {error && <Text color="error">{error}</Text>}
       </Flex>
    </View>
  );
}

export default AddCashReceiptForm;