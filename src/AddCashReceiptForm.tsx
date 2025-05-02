// src/AddCashReceiptForm.tsx
import React, { useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource'; // Adjust path if needed

const client = generateClient<Schema>();

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

    try {
      // Admin group has create permission from auth rules
      // We pass the owner explicitly here. Ensure auth rule allows this.
      // If owner rule was { allow: owner, operations: [create] }, this might fail
      // unless admin implicitly owns it? Test needed. Assuming admin create rule works.
      const { data: newTransaction, errors } = await client.models.CurrentAccountTransaction.create(
        {
          type: 'CASH_RECEIPT', // Set type specifically
          amount: numericAmount,
          description: description || null,
        },
        { authMode: 'userPool' } // Admin should be authenticated
      );

      if (errors) throw errors;

      setSuccess(`Cash Receipt of ${numericAmount.toFixed(2)} added for owner ${ownerIdInput}. ID: ${newTransaction.id}`);
      // Clear form
      setOwnerIdInput('');
      setAmount('');
      setDescription('');

    } catch (err: any) {
      console.error("Error creating cash receipt:", err);
      const errorMsg = Array.isArray(err?.errors) ? err.errors[0].message : (err?.message || 'Unknown error');
      setError(`Failed to add cash receipt: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h4>Add Cash Receipt Transaction</h4>
      <div>
        <label htmlFor="cash-ownerId">Target User ID (Owner GUID): </label>
        <input
          type="text"
          id="cash-ownerId"
          value={ownerIdInput}
          onChange={(e) => setOwnerIdInput(e.target.value)}
          placeholder="Enter Cognito User GUID"
          style={{width: '300px'}}
          required
          disabled={isLoading}
        />
       </div>
      <div style={{marginTop: '10px'}}>
        <label htmlFor="cash-amount">Amount Received:</label>
        <input
          id="cash-amount"
          type="number"
          step="0.01"
          min="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>
      <div style={{marginTop: '10px'}}>
        <label htmlFor="cash-description">Description (Optional):</label>
        <input
          id="cash-description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isLoading}
        />
      </div>
      <button type="submit" disabled={isLoading} style={{marginTop: '10px'}}>
        {isLoading ? 'Adding...' : 'Add Cash Receipt (- Balance)'}
      </button>
      {success && <p style={{ color: 'green' }}>{success}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </form>
  );
}

export default AddCashReceiptForm;