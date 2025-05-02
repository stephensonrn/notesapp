// src/AddCashReceiptForm.tsx
import React, { useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource'; // Adjust path if needed
import { Button, Flex, TextField, Text, View, Heading } from '@aws-amplify/ui-react';

// Define the GraphQL mutation string MANUALLY
// Note: We need to explicitly ask for fields to get them back in the response
const adminAddCashReceiptMutation = /* GraphQL */ `
  mutation AdminAddCashReceipt($input: AdminAddCashReceiptInput!) {
    adminAddCashReceipt(input: $input) {
      id
      owner
      type
      amount
      description
      createdAt
    }
  }
`;

const client = generateClient<Schema>(); // Still useful for types

function AddCashReceiptForm() {
  const [ownerIdInput, setOwnerIdInput] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const numericAmount = parseFloat(amount);

    if (!ownerIdInput) {
        setError('Target User ID (Owner) is required.');
        return;
    }
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError("Please enter a valid positive amount for the cash receipt.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    // Prepare variables for the custom mutation
    const variables = {
        input: {
            targetOwnerId: ownerIdInput,
            amount: numericAmount,
            description: description || null
        }
    };

    try {
      console.log("Calling adminAddCashReceipt mutation with variables:", variables);
      // Use client.graphql to call the custom mutation
      const result = await client.graphql({
        query: adminAddCashReceiptMutation,
        variables: variables,
        authMode: 'userPool' // Run as the authenticated admin user
      });

      console.log("Admin Add Cash Receipt Result:", result);
      const newTransaction = result.data?.adminAddCashReceipt; // Access result via mutation name
      const errors = result.errors;

      if (errors) throw errors; // Throw if GraphQL layer returns errors
      if (!newTransaction) throw new Error("Mutation did not return transaction data.");

      setSuccess(`Cash Receipt of £${numericAmount.toFixed(2)} added for owner ${ownerIdInput}. ID: ${newTransaction.id}`);
      // Clear form
      setOwnerIdInput('');
      setAmount('');
      setDescription('');

    } catch (err: any) {
      console.error("Error creating cash receipt:", err);
      // Handle potential errors array from GraphQL or general JS errors
       let displayError = 'Unknown error.';
       if (Array.isArray(err?.errors) && err.errors.length > 0 && err.errors[0].message) { displayError = err.errors[0].message;}
       else if (err?.message) { displayError = err.message;}
       else { try { displayError = JSON.stringify(err); } catch (e) { /* ignore */ }}
       setError(`Failed to add cash receipt: ${displayError}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View as="form" onSubmit={handleSubmit} padding="medium" border="1px solid var(--amplify-colors-border-secondary)" borderRadius="medium">
      <Heading level={4}>Add Cash Receipt Transaction</Heading>
      <Flex direction="column" gap="small">
        <TextField
          label="Target User ID (Owner GUID):"
          id="cash-ownerId" // Use htmlFor if label is separate component
          value={ownerIdInput}
          onChange={(e) => setOwnerIdInput(e.target.value)}
          placeholder="Enter Cognito User GUID"
          isRequired={true}
          isDisabled={isLoading}
        />
       <TextField
          label="Amount Received:"
          id="cash-amount" // Use htmlFor if label is separate component
          type="number"
          step="0.01"
          min="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          isRequired={true}
          isDisabled={isLoading}
        />
        <TextField
          label="Description (Optional):"
          id="cash-description" // Use htmlFor if label is separate component
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          isDisabled={isLoading}
        />
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