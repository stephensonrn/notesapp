// src/AccountStatusForm.tsx
import React, { useState, useEffect } from 'react';

interface AccountStatusFormProps {
  initialUnapprovedValue: number;
  initialAccountBalance: number;
  onUpdate: (unapprovedValue: number, accountBalance: number) => Promise<void>; // Make async for loading state
  isSaving: boolean;
}

function AccountStatusForm({
  initialUnapprovedValue,
  initialAccountBalance,
  onUpdate,
  isSaving,
}: AccountStatusFormProps) {
  const [unapprovedInput, setUnapprovedInput] = useState(initialUnapprovedValue.toString());
  const [accountBalanceInput, setAccountBalanceInput] = useState(initialAccountBalance.toString());

  // Update local state if initial props change (e.g., after successful fetch/update)
  useEffect(() => {
    setUnapprovedInput(initialUnapprovedValue.toString());
  }, [initialUnapprovedValue]);

  useEffect(() => {
    setAccountBalanceInput(initialAccountBalance.toString());
  }, [initialAccountBalance]);


  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const unapprovedValue = parseFloat(unapprovedInput);
    const accountBalance = parseFloat(accountBalanceInput);

    if (isNaN(unapprovedValue) || unapprovedValue < 0 || isNaN(accountBalance) || accountBalance < 0) {
      alert("Please enter valid, non-negative numbers for both fields.");
      return;
    }
    // Call the async update function passed from parent
    await onUpdate(unapprovedValue, accountBalance);
  };

  return (
    <form onSubmit={handleSubmit} style={{ border: '1px solid #eee', padding: '15px', margin: '20px 0' }}>
      <h4>Update Facility Status</h4>
      <div style={{ marginBottom: '10px' }}>
        <label htmlFor="unapproved-value" style={{ marginRight: '10px', display: 'block' }}>
          Total Unapproved Invoice Value (£):
        </label>
        <input
          id="unapproved-value"
          type="number"
          step="0.01"
          min="0"
          value={unapprovedInput}
          onChange={(e) => setUnapprovedInput(e.target.value)}
          required
          placeholder="e.g., 5000.00"
          style={{ width: '150px' }}
        />
      </div>
      <div>
        <label htmlFor="account-balance" style={{ marginRight: '10px', display: 'block' }}>
          Current Account Balance (£):
        </label>
        <input
          id="account-balance"
          type="number"
          step="0.01"
          min="0"
          value={accountBalanceInput}
          onChange={(e) => setAccountBalanceInput(e.target.value)}
          required
          placeholder="e.g., 10000.00"
          style={{ width: '150px' }}
        />
      </div>
      <button type="submit" style={{ marginTop: '15px' }} disabled={isSaving}>
        {isSaving ? 'Saving...' : 'Update Status'}
      </button>
    </form>
  );
}

export default AccountStatusForm;