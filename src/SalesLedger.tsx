// src/SalesLedger.tsx
import React, { useState, useEffect, useCallback } from 'react';
// Import Amplify data client and generated types/schema
import { generateClient } from 'aws-amplify/data';
// Make sure the path to your resource file is correct (e.g., if it's schema.ts not resource.ts)
import type { Schema } from '../amplify/data/resource';

// Import all the necessary sub-components that should exist in separate .tsx files
import CurrentBalance from './CurrentBalance';
import LedgerEntryForm from './LedgerEntryForm';
import LedgerHistory from './LedgerHistory';
import AvailabilityDisplay from './AvailabilityDisplay';
// import AccountStatusForm from './AccountStatusForm'; // No longer imported/used
import PaymentRequestForm from './PaymentRequestForm';

// Define the Amplify data client, typed with your Schema
const client = generateClient<Schema>();

// Define constants used in calculations
const ADVANCE_RATE = 0.90; // 90%

// Main component definition
function SalesLedger() {
  // State for Ledger Entries list
  const [entries, setEntries] = useState<Schema['LedgerEntry'][]>([]);
  const [currentSalesLedgerBalance, setCurrentSalesLedgerBalance] = useState(0);
  const [isLoadingEntries, setIsLoadingEntries] = useState(true);

  // State for the single AccountStatus record (values fetched from backend)
  const [accountStatus, setAccountStatus] = useState<Schema['AccountStatus'] | null>(null);
  const [accountStatusId, setAccountStatusId] = useState<string | null>(null); // Kept in case ID is needed elsewhere
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  // isSavingStatus state removed - no longer needed

  // State for Calculated Availability figures
  const [grossAvailability, setGrossAvailability] = useState(0);
  const [netAvailability, setNetAvailability] = useState(0);

  // State for Payment Request process
  const [paymentRequestLoading, setPaymentRequestLoading] = useState(false);
  const [paymentRequestError, setPaymentRequestError] = useState<string | null>(null);
  const [paymentRequestSuccess, setPaymentRequestSuccess] = useState<string | null>(null);

  // General Error State for the component
  const [error, setError] = useState<string | null>(null);

  // Effect Hook: Fetch Ledger Entries (real-time subscription)
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
      error: (err: any) => {
        console.error("Error fetching ledger entries:", err);
        setError(`Failed to load ledger history: ${err.message || JSON.stringify(err)}`);
        setIsLoadingEntries(false);
      },
    });
    return () => sub.unsubscribe();
  }, []);

  // Effect Hook: Calculate Current Sales Ledger Balance
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
        default: break;
      }
    });
    setCurrentSalesLedgerBalance(parseFloat(calculatedBalance.toFixed(2)));
  }, [entries]);

  // Effect Hook: Fetch the user's AccountStatus record
  const fetchAccountStatus = useCallback(async () => {
    setIsLoadingStatus(true);
    setError(null);
    try {
      const { data: statusItems, errors } = await client.models.AccountStatus.list({
          authMode: 'userPool'
      });
      if (errors) throw errors;
      if (statusItems.length > 0) {
        setAccountStatus(statusItems[0]);
        setAccountStatusId(statusItems[0].id);
      } else {
        setAccountStatus(null);
        setAccountStatusId(null);
      }
    } catch (err: any) {
        console.error("Error fetching account status:", err);
        const errorMsg = Array.isArray(err?.errors) ? err.errors[0].message : (err?.message || 'Unknown error');
        setError(`Failed to load account status: ${errorMsg}`);
        setAccountStatus(null);
        setAccountStatusId(null);
    } finally {
        setIsLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    fetchAccountStatus();
  }, [fetchAccountStatus]);


  // Effect Hook: Calculate Availability
  useEffect(() => {
    const unapprovedValue = accountStatus?.totalUnapprovedInvoiceValue ?? 0;
    const currentBalance = accountStatus?.currentAccountBalance ?? 0;
    const grossAvail = (currentSalesLedgerBalance - unapprovedValue) * ADVANCE_RATE;
    const netAvail = grossAvail - currentBalance;
    setGrossAvailability(Math.max(0, parseFloat(grossAvail.toFixed(2))));
    setNetAvailability(Math.max(0, parseFloat(netAvail.toFixed(2))));
  }, [currentSalesLedgerBalance, accountStatus]);


  // --- handleStatusUpdate function was REMOVED ---


  // Handler function for adding new ledger entries
  const handleAddLedgerEntry = async (entryData: { type: string, amount: number, description?: string }) => {
     setError(null);
     try {
       const { errors, data: newEntry } = await client.models.LedgerEntry.create({
         type: entryData.type,
         amount: entryData.amount,
         description: entryData.description || null,
       }, { authMode: 'userPool' });
       if (errors) throw errors;
       console.log("Ledger Entry created:", newEntry);
     } catch (err: any) {
       console.error("Error creating ledger entry:", err);
       const errorMsg = Array.isArray(err?.errors) ? err.errors[0].message : (err?.message || 'Unknown error');
       setError(`Failed to save transaction: ${errorMsg}`);
     }
   };

  // Handler function for submitting payment request (uses client.graphql)
  const handlePaymentRequest = async (amount: number) => {
    setPaymentRequestLoading(true);
    setPaymentRequestError(null);
    setPaymentRequestSuccess(null);

    const mutationDoc = /* GraphQL */ `
      mutation SendPaymentRequest($input: PaymentRequestInput!) {
        requestPayment(input: $input)
      }
    `;
    const variables = { input: { amount: amount } };

    console.log('Calling requestPayment mutation via client.graphql with variables:', variables);

    try {
      const result = await client.graphql({
        query: mutationDoc,
        variables: variables,
        authMode: 'userPool'
      });

      console.log('GraphQL Result:', result);
      const responseMessage = result.data?.requestPayment;
      const errors = result.errors;

      if (errors) throw errors[0];

      console.log('Payment request result data:', responseMessage);
      setPaymentRequestSuccess(responseMessage ?? 'Request submitted successfully!');

    } catch (err: any) {
      // Enhanced Logging
      console.error("-----------------------------------------");
      console.error("Error object submitting payment request:", err);
      console.error("err.message:", err?.message);
      try { console.error("err.errors:", JSON.stringify(err?.errors)); } catch (e) { /* ignore */ }
      console.error("-----------------------------------------");
      // Determine message
      let displayError = 'Unknown error during payment request.';
      if (Array.isArray(err?.errors) && err.errors.length > 0 && err.errors[0].message) {
          displayError = err.errors[0].message;
      } else if (err?.message) {
          displayError = err.message;
      } else if (typeof err === 'string') {
          displayError = err;
      } else { try { displayError = JSON.stringify(err); } catch (e) { /* ignore */ }}
      setPaymentRequestError(`Failed to submit request: ${displayError}`);
      setPaymentRequestSuccess(null);
    } finally {
      setPaymentRequestLoading(false);
    }
  }; // End handlePaymentRequest


  // Render Loading state if initial data isn't ready
  if (isLoadingEntries || isLoadingStatus) {
      return <p>Loading application data...</p>;
  }


  // Main Render Output
  return (
    <div style={{ padding: '20px' }}>
      <h2>Sales Ledger</h2>
      {/* Display general errors */}
      {error && <p style={{ color: 'red', border: '1px solid red', padding: '10px' }}>Error: {error}</p>}

      {/* Render Balance Display */}
      <CurrentBalance balance={currentSalesLedgerBalance} />

      {/* Render Availability Calculation Display */}
      <AvailabilityDisplay
        grossAvailability={grossAvailability}
        netAvailability={netAvailability}
        currentSalesLedgerBalance={currentSalesLedgerBalance}
        totalUnapprovedInvoiceValue={accountStatus?.totalUnapprovedInvoiceValue ?? 0}
        currentAccountBalance={accountStatus?.currentAccountBalance ?? 0}
      />

      {/* Render Payment Request Form */}
      <PaymentRequestForm
        netAvailability={netAvailability}
        onSubmitRequest={handlePaymentRequest}
        isLoading={paymentRequestLoading}
        requestError={paymentRequestError}
        requestSuccess={paymentRequestSuccess}
      />

      {/* AccountStatusForm component rendering removed */}

      {/* Render Form for Adding Ledger Entries */}
      <LedgerEntryForm onSubmit={handleAddLedgerEntry} />

      {/* Render Ledger History Table */}
      <LedgerHistory entries={entries} isLoading={isLoadingEntries} />

    </div> // Closing div for main component return
  ); // Closing parenthesis for main component return

} // Closing brace for SalesLedger function component

// Default export needed for import in App.tsx
export default SalesLedger;