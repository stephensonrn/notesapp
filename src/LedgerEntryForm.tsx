// src/LedgerEntryForm.jsx
import React, { useState } from 'react';
// Note: We don't strictly need the Enum type here if we use string values,
// but importing it can help with type safety if desired.
// import { type Schema } from '../amplify/data/resource'; // If you need LedgerEntryType enum

interface LedgerEntryFormProps {
  onSubmit: (data: { type: string, amount: number, description?: string }) => void;
}

function LedgerEntryForm({ onSubmit }: LedgerEntryFormProps) {
  const [type, setType] = useState('INVOICE'); // Default type
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      alert("Please enter a valid positive amount.");
      return;
    }
    onSubmit({
      type: type, // Pass the selected string value
      amount: numericAmount,
      description: description || undefined // Pass undefined if empty
    });
    // Clear form
    setAmount('');
    setDescription('');
    setType('INVOICE'); // Reset type
  };

  return (
    <form onSubmit={handleSubmit} style={{ margin: '20px 0', border: '1px solid #ccc', padding: '15px' }}>
      <h4>Add New Transaction</h4>
      <div>
        <label htmlFor="entry-type" style={{ marginRight: '10px' }}>Type:</label>
        <select
          id="entry-type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          required
        >
          {/* Use the exact string values defined in your Enum */}
          <option value="INVOICE">Invoice (+)</option>
          <option value="CREDIT_NOTE">Credit Note (-)</option>
          <option value="INCREASE_ADJUSTMENT">Increase Adjustment (+)</option>
          <option value="DECREASE_ADJUSTMENT">Decrease Adjustment (-)</option>
        </select>
      </div>
      <div style={{ marginTop: '10px' }}>
        <label htmlFor="entry-amount" style={{ marginRight: '10px' }}>Amount:</label>
        <input
          id="entry-amount"
          type="number"
          step="0.01"
          min="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          placeholder="e.g., 100.50"
        />
      </div>
       <div style={{ marginTop: '10px' }}>
        <label htmlFor="entry-description" style={{ marginRight: '10px' }}>Description (Optional):</label>
        <input
          id="entry-description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g., Invoice #123"
        />
      </div>
      <button type="submit" style={{ marginTop: '15px' }}>Add Entry</button>
    </form>
  );
}
export default LedgerEntryForm;