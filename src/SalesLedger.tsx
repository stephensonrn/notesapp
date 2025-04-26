// src/SalesLedger.jsx
import React, { useState, useEffect } from 'react';

// 1. Import Amplify data client and types
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource'; // Import the generated Schema type

// Import sub-components (we'll create these below)
import CurrentBalance from './CurrentBalance';
import LedgerEntryForm from './LedgerEntryForm';
import LedgerHistory from './LedgerHistory';

// 2. Define the client type based on your schema
const client = generateClient<Schema>(); // Use the Schema type

function SalesLedger() {
  const [entries, setEntries] = useState<Schema['LedgerEntry'][]>([]); // Use type from Schema
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 3. Fetch entries using observeQuery (real-time updates)
  useEffect(() => {
    setError(null);
    // Subscribe to changes in LedgerEntry data for the current user
    const sub = client.models.LedgerEntry.observeQuery({
      authMode: 'userPool' // Specify auth mode if needed (matches backend config)
      // Add sorting if desired, e.g., sort by createdAt descending
      // sort: (a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')
    }).subscribe({
      next: ({ items, isSynced }) => {
        // Sort entries chronologically here if not done in the query
         const sortedItems = [...items].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
         );
        setEntries(sortedItems);
        setIsLoading(!isSynced); // Loading is true until initial sync is complete
      },
      error: (err) => {
        console.error("Error fetching ledger entries:", err);
        setError("Failed to load ledger history.");
        setIsLoading(false);
      },
    });

    // Cleanup subscription on component unmount
    return () => sub.unsubscribe();
  }, []); // Empty dependency array means run once on mount

  // 4. Calculate balance whenever entries change
  useEffect(() => {
    let calculatedBalance = 0;
    entries.forEach(entry => {
      switch (entry.type) {
        case 'INVOICE':
        case 'INCREASE_ADJUSTMENT':
          calculatedBalance += entry.amount;
          break;
        case 'CREDIT_NOTE':
        case 'DECREASE_ADJUSTMENT':
          calculatedBalance -= entry.amount;
          break;
        default:
          console.warn("Unknown entry type:", entry.type);
      }
    });
    setBalance(parseFloat(calculatedBalance.toFixed(2))); // Format to 2 decimal places
  }, [entries]); // Recalculate when entries array changes

  // 5. Function to handle adding a new entry
  async function handleAddEntry(entryData: { type: string, amount: number, description?: string }) {
    setError(null);
    try {
      const { errors, data: newEntry } = await client.models.LedgerEntry.create({
        type: entryData.type, // Use the string value from the form
        amount: entryData.amount,
        description: entryData.description || null, // Handle optional field
      }, {
        authMode: 'userPool' // Specify auth mode
      });

      if (errors) {
        console.error("Error creating entry:", errors);
        setError(`Failed to save transaction: ${errors[0].message}`);
      } else {
        console.log("Entry created:", newEntry);
        // No need to manually update state with observeQuery,
        // the subscription will automatically receive the new item.
      }
    } catch (err: any) {
      console.error("Error creating ledger entry:", err);
      setError(`Failed to save transaction. ${err.message || ''}`);
    }
  }

  return (
    <div>
      <h2>Sales Ledger</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <CurrentBalance balance={balance} />

      <LedgerEntryForm onSubmit={handleAddEntry} />

      <LedgerHistory entries={entries} isLoading={isLoading} />
    </div>
  );
}

export default SalesLedger;