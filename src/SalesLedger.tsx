// src/SalesLedger.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { generateClient } from 'aws-amplify/data';
// Import the full Schema type
import type { Schema } from '../amplify/data/resource';

// Import sub-components
import CurrentBalance from './CurrentBalance'; // Displays Ledger balance
import LedgerEntryForm from './LedgerEntryForm';
import LedgerHistory from './LedgerHistory';
import AvailabilityDisplay from './AvailabilityDisplay'; // New
import AccountStatusForm from './AccountStatusForm';   // New

// Define the client
const client = generateClient<Schema>();

// Define constants
const ADVANCE_RATE = 0.90; // 90%

function SalesLedger() {
  // State for Ledger Entries
  const [entries, setEntries] = useState<Schema['LedgerEntry'][]>([]);
  const [currentSalesLedgerBalance, setCurrentSalesLedgerBalance] = useState(0); // Renamed for clarity
  const [isLoadingEntries, setIsLoadingEntries] = useState(true);

  // State for Account Status (manual inputs)
  const [accountStatus, setAccountStatus] = useState<Schema['AccountStatus'] | null>(null);
  const [accountStatusId, setAccountStatusId] = useState<string | null>(null); // Need ID for updates
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isSavingStatus, setIsSavingStatus] = useState(false); // Loading state for updates

  // State for Calculated Availability
  const [grossAvailability, setGrossAvailability] = useState(0);
  const [netAvailability, setNetAvailability] = useState(0);

  // General Error State
  const [error, setError] = useState<string | null>(null);

  // Fetch Ledger Entries (same as before)
  useEffect(() => {
    setError(null);
    const sub = client.models.LedgerEntry.observeQuery({
      authMode: 'userPool'
    }).subscribe({
      next: ({ items, isSynced }) => {
        const sortedItems = [...items].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
         );
        setEntries(sortedItems);
        setIsLoadingEntries(!isSynced);
      },
      error: (err) => {
        console.error("Error fetching ledger entries:", err);
        setError("Failed to load ledger history.");
        setIsLoadingEntries(false);
      },
    });
    return () => sub.unsubscribe();
  }, []);

  // Calculate Current Sales Ledger Balance (renamed state variable)
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
        default: break; // Ignore unknown types
      }
    });
    setCurrentSalesLedgerBalance(parseFloat(calculatedBalance.toFixed(2)));
  }, [entries]);

  // Fetch Account Status (runs once on mount)
  const fetchAccountStatus = useCallback(async () => {
    setIsLoadingStatus(true);
    setError(null);
    try {
      // Fetch the user's AccountStatus record(s). Expecting only one.
      const { data: statusItems, errors } = await client.models.AccountStatus.list({
          authMode: 'userPool'
          // No filter needed, owner rule applied by backend/DataStore
      });

      if (errors) throw errors;

      if (statusItems.length > 0) {
        setAccountStatus(statusItems[0]); // Assume first record is the one
        setAccountStatusId(statusItems[0].id);
      } else {
        // No record exists yet
        setAccountStatus(null);
        setAccountStatusId(null);
      }
    } catch (err: any) {
        console.error("Error fetching account status:", err);
        setError(`Failed to load account status. ${err.message || JSON.stringify(err)}`);
        setAccountStatus(null);
        setAccountStatusId(null);
    } finally {
        setIsLoadingStatus(false);
    }
  }, []); // No dependencies, runs once

  useEffect(() => {
    fetchAccountStatus();
  }, [fetchAccountStatus]);


  // Calculate Availability whenever dependencies change
  useEffect(() => {
    const unapprovedValue = accountStatus?.totalUnapprovedInvoiceValue ?? 0;
    const currentBalance = accountStatus?.currentAccountBalance ?? 0;

    const grossAvail = (currentSalesLedgerBalance - unapprovedValue) * ADVANCE_RATE;
    const netAvail = grossAvail - currentBalance;

    setGrossAvailability(parseFloat(grossAvail.toFixed(2)));
    setNetAvailability(parseFloat(netAvail.toFixed(2)));

  }, [currentSalesLedgerBalance, accountStatus]); // Recalculate when these change


  // Handle saving manual AccountStatus updates
  const handleStatusUpdate = async (unapprovedValue: number, accountBalance: number) => {
    setIsSavingStatus(true);
    setError(null);
    try {
      const inputData = {
        totalUnapprovedInvoiceValue: unapprovedValue,
        currentAccountBalance: accountBalance,
      };

      if (accountStatusId) {
        // Update existing record
        const { data: updatedStatus, errors } = await client.models.AccountStatus.update({
          id: accountStatusId,
          ...inputData,
        }, { authMode: 'userPool' });
        if (errors) throw errors;
        console.log("AccountStatus updated:", updatedStatus);
        // Optimistically update state or re-fetch
        setAccountStatus(updatedStatus);

      } else {
        // Create new record
        const { data: newStatus, errors } = await client.models.AccountStatus.create(
            inputData,
            { authMode: 'userPool' }
        );
        if (errors) throw errors;
        console.log("AccountStatus created:", newStatus);
         // Update state with the newly created record and ID
        setAccountStatus(newStatus);
        setAccountStatusId(newStatus.id);
      }
    } catch (err: any) {
      console.error("Error updating/creating account status:", err);
      setError(`Failed to update status. ${err.message || JSON.stringify(err)}`);
    } finally {
      setIsSavingStatus(false);
    }
  };


  // Handle adding new ledger entries (same as before)
  const handleAddLedgerEntry = async (entryData: { type: string, amount: number, description?: string }) => {
     setError(null);
     try {
       const { errors, data: newEntry } = await client.models.LedgerEntry.create({
         type: entryData.type,
         amount: entryData.amount,
         description: entryData.description || null,
       }, { authMode: 'userPool' });
       if (errors) throw errors;
       // observeQuery handles state update
     } catch (err: any) {
       console.error("Error creating ledger entry:", err);
       setError(`Failed to save transaction. ${err.message || ''}`);
     }
   };

  // Display loading state while fetching initial data
  if (isLoadingEntries || isLoadingStatus) {
      return <p>Loading application data...</p>
  }


  return (
    <div>
      <h2>Sales Ledger</h2>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {/* Display Current Sales Ledger Balance */}
      <CurrentBalance balance={currentSalesLedgerBalance} />

      {/* Display Availability Calculation */}
      <AvailabilityDisplay
        grossAvailability={grossAvailability}
        netAvailability={netAvailability}
        currentSalesLedgerBalance={currentSalesLedgerBalance}
        totalUnapprovedInvoiceValue={accountStatus?.totalUnapprovedInvoiceValue ?? 0}
        currentAccountBalance={accountStatus?.currentAccountBalance ?? 0}
      />

      {/* Form to Update Manual Status Values */}
      <AccountStatusForm
        initialUnapprovedValue={accountStatus?.totalUnapprovedInvoiceValue ?? 0}
        initialAccountBalance={accountStatus?.currentAccountBalance ?? 0}
        onUpdate={handleStatusUpdate}
        isSaving={isSavingStatus}
      />

      {/* Form to Add New Ledger Entries */}
      <LedgerEntryForm onSubmit={handleAddLedgerEntry} />

      {/* Display Ledger Entry History */}
      <LedgerHistory entries={entries} isLoading={isLoadingEntries} />
    </div>
  );
}

export default SalesLedger;