// src/SalesLedger.tsx
import React, { useState, useEffect, useCallback } from 'react';
// Import Amplify data client and generated types/schema
import { generateClient } from 'aws-amplify/data';
// Make sure the path to your resource file is correct
import type { Schema } from '../amplify/data/resource';

// Import all the necessary sub-components
import CurrentBalance from './CurrentBalance';
import LedgerEntryForm from './LedgerEntryForm';
import LedgerHistory from './LedgerHistory';
import AvailabilityDisplay from './AvailabilityDisplay';
import PaymentRequestForm from './PaymentRequestForm';

// Define the Amplify data client, typed with your Schema
const client = generateClient<Schema>();

// Define constants used in calculations
const ADVANCE_RATE = 0.90; // 90%

// Main component definition
function SalesLedger() {
  // State: Sales Ledger Entries
  const [entries, setEntries] = useState<Schema['LedgerEntry'][]>([]);
  const [currentSalesLedgerBalance, setCurrentSalesLedgerBalance] = useState(0);
  const [isLoadingEntries, setIsLoadingEntries] = useState(true);

  // State: Account Status (Manual Unapproved Value)
  const [accountStatus, setAccountStatus] = useState<Schema['AccountStatus'] | null>(null);
  const [accountStatusId, setAccountStatusId] = useState<string | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  // State: Current Account Transactions
  const [currentAccountTransactions, setCurrentAccountTransactions] = useState<Schema['CurrentAccountTransaction'][]>([]);
  const [isLoadingAcctTransactions, setIsLoadingAcctTransactions] = useState(true);
  const [calculatedCurrentAccountBalance, setCalculatedCurrentAccountBalance] = useState(0);

  // State: Calculated Availability figures
  const [grossAvailability, setGrossAvailability] = useState(0);
  const [netAvailability, setNetAvailability] = useState(0);
  // --- NEW Temporary state for refactored availability calculation ---
  const [grossAvailTemp, setGrossAvailTemp] = useState(0);
  const [netAvailTemp, setNetAvailTemp] = useState(0);
  // --- END NEW ---

  // State: Payment Request Process
  const [paymentRequestLoading, setPaymentRequestLoading] = useState(false);
  const [paymentRequestError, setPaymentRequestError] = useState<string | null>(null);
  const [paymentRequestSuccess, setPaymentRequestSuccess] = useState<string | null>(null);

  // State: General Errors
  const [error, setError] = useState<string | null>(null);

  // --- Effect Hooks for Data Fetching ---

  // Fetch Ledger Entries (Real-time)
  useEffect(() => {
    setError(null);
    const sub = client.models.LedgerEntry.observeQuery({ authMode: 'userPool' }).subscribe({
      next: ({ items, isSynced }) => {
        const sortedItems = [...items].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        setEntries(sortedItems);
        setIsLoadingEntries(!isSynced);
      },
      error: (err: any) => { console.error("Error fetching ledger entries:", err); setError(`Ledger history error: ${err.message || JSON.stringify(err)}`); setIsLoadingEntries(false); }
    });
    return () => { console.log("Cleaning LedgerEntry subscription."); sub.unsubscribe(); }
  }, []);

  // Fetch Account Status (Real-time)
  useEffect(() => {
    setIsLoadingStatus(true); setError(null); console.log("Setting up AccountStatus subscription...");
    const sub = client.models.AccountStatus.observeQuery({ authMode: 'userPool' }).subscribe({
      next: ({ items, isSynced }) => {
        console.log(`[ObserveQuery AccountStatus] Update Received (isSynced: ${isSynced}):`, JSON.stringify(items, null, 2));
        if (items.length > 0) { setAccountStatus(items[0]); setAccountStatusId(items[0].id); }
        else { setAccountStatus(null); setAccountStatusId(null); }
        setIsLoadingStatus(!isSynced);
      },
      error: (err: any) => { console.error("[ObserveQuery AccountStatus] Subscription Error:", err); setError(`Account status error: ${err.message || JSON.stringify(err)}`); setIsLoadingStatus(false); setAccountStatus(null); setAccountStatusId(null); }
    });
    console.log("AccountStatus subscription established.");
    return () => { console.log("Cleaning up AccountStatus subscription."); sub.unsubscribe(); }
  }, []);

  // Fetch Current Account Transactions (Real-time)
  useEffect(() => {
    setIsLoadingAcctTransactions(true); setError(null); console.log("Setting up CurrentAccountTransaction subscription...");
    const sub = client.models.CurrentAccountTransaction.observeQuery({ authMode: 'userPool' }).subscribe({
      next: ({ items, isSynced }) => {
        console.log(`[ObserveQuery CurrentAccountTransaction] Update Received (isSynced: ${isSynced}):`, JSON.stringify(items, null, 2));
        const sortedItems = [...items].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        setCurrentAccountTransactions(sortedItems);
        setIsLoadingAcctTransactions(!isSynced);
      },
      error: (err: any) => { console.error("[ObserveQuery CurrentAccountTransaction] Subscription Error:", err); setError(`Account transaction error: ${err.message || JSON.stringify(err)}`); setIsLoadingAcctTransactions(false); }
    });
    console.log("CurrentAccountTransaction subscription established.");
    return () => { console.log("Cleaning up CurrentAccountTransaction subscription."); sub.unsubscribe(); }
  }, []);


  // --- Effect Hooks for Calculations ---

  // Calculate Sales Ledger Balance
  useEffect(() => {
    let calculatedSLBalance = 0;
    entries.forEach(entry => {
      switch (entry.type) {
        case 'INVOICE': case 'INCREASE_ADJUSTMENT': calculatedSLBalance += entry.amount; break;
        case 'CREDIT_NOTE': case 'DECREASE_ADJUSTMENT': calculatedSLBalance -= entry.amount; break;
        default: break;
      }
    });
    setCurrentSalesLedgerBalance(parseFloat(calculatedSLBalance.toFixed(2)));
  }, [entries]);

  // Calculate Current Account Balance
  useEffect(() => {
    let calculatedAccBalance = 0;
    currentAccountTransactions.forEach(transaction => {
        switch (transaction.type) {
            case 'PAYMENT_REQUEST': calculatedAccBalance += transaction.amount; break;
            case 'CASH_RECEIPT': calculatedAccBalance -= transaction.amount; break;
            default: break;
        }
    });
    setCalculatedCurrentAccountBalance(parseFloat(calculatedAccBalance.toFixed(2)));
    console.log("Calculated Current Account Balance:", calculatedAccBalance.toFixed(2));
  }, [currentAccountTransactions]);


  // --- REFACTORED Availability Calculation ---

  // Effect 1: Calculate intermediate values based on inputs
  useEffect(() => {
    const unapprovedValue = accountStatus?.totalUnapprovedInvoiceValue ?? 0;
    const currentAccountBalance = calculatedCurrentAccountBalance; // Use calculated value
    const grossAvail = (currentSalesLedgerBalance - unapprovedValue) * ADVANCE_RATE;
    const netAvail = grossAvail - currentAccountBalance;

    // Set temporary state variables
    setGrossAvailTemp(grossAvail);
    setNetAvailTemp(netAvail);
    console.log("Intermediate availability calculated:", { grossAvail, netAvail });

  }, [currentSalesLedgerBalance, accountStatus, calculatedCurrentAccountBalance]); // Original dependencies

  // Effect 2: Update final Gross Availability state when intermediate value changes
  useEffect(() => {
      console.log("Setting Gross Availability based on temp value:", grossAvailTemp);
      setGrossAvailability(Math.max(0, parseFloat(grossAvailTemp.toFixed(2))));
  }, [grossAvailTemp]); // Only depends on the intermediate value

  // Effect 3: Update final Net Availability state when intermediate value changes
  useEffect(() => {
      console.log("Setting Net Availability based on temp value:", netAvailTemp);
      setNetAvailability(Math.max(0, parseFloat(netAvailTemp.toFixed(2))));
  }, [netAvailTemp]); // Only depends on the intermediate value

  // --- END REFACTORED Availability Calculation ---


  // --- Handler Functions ---

  // Add Ledger Entry
  const handleAddLedgerEntry = async (entryData: { type: string, amount: number, description?: string }) => {
     setError(null);
     try {
       const { errors } = await client.models.LedgerEntry.create({ /* ... */ }, { authMode: 'userPool' });
       if (errors) throw errors;
     } catch (err: any) { setError(`Failed to save transaction: ${err.message || 'Unknown error'}`); }
   };

  // Payment Request
  const handlePaymentRequest = async (amount: number) => {
    setPaymentRequestLoading(true); setPaymentRequestError(null); setPaymentRequestSuccess(null);
    const mutationDoc = /* GraphQL */ ` mutation SendPaymentRequest($input: PaymentRequestInput!) { requestPayment(input: $input) } `;
    const variables = { input: { amount: amount } };
    console.log('Calling requestPayment mutation via client.graphql with variables:', variables);
    try {
        const result = await client.graphql({ query: mutationDoc, variables: variables, authMode: 'userPool' });
        const responseMessage = result.data?.requestPayment;
        const errors = result.errors;
        if (errors) throw errors[0];
        setPaymentRequestSuccess(responseMessage ?? 'Request submitted successfully!');
    } catch (err: any) { /* ... enhanced error handling ... */
        console.error("Error object submitting payment request:", err);
        let displayError = 'Unknown error during payment request.';
        if (Array.isArray(err?.errors) && err.errors.length > 0 && err.errors[0].message) { displayError = err.errors[0].message;}
        else if (err?.message) { displayError = err.message;}
        // ... other error message extraction ...
        setPaymentRequestError(`Failed to submit request: ${displayError}`);
        setPaymentRequestSuccess(null);
    } finally { setPaymentRequestLoading(false); }
  };


  // --- Filtering logic for Sales Ledger History ---
  const salesLedgerEntries = entries.filter(entry =>
    entry.type !== 'CASH_RECEIPT' // Just ensure no cash receipts are shown here
  );


  // --- Loading State Check ---
  if (isLoadingEntries || isLoadingStatus || isLoadingAcctTransactions) {
      return <p>Loading application data...</p>;
  }


  // --- Main Render Output ---
  return (
    <div style={{ padding: '20px' }}>
      <h2>Sales Ledger</h2>
      {error && <p style={{ color: 'red', border: '1px solid red', padding: '10px' }}>Error: {error}</p>}

      <CurrentBalance balance={currentSalesLedgerBalance} />

      <AvailabilityDisplay
        grossAvailability={grossAvailability} // Final calculated state
        netAvailability={netAvailability}     // Final calculated state
        currentSalesLedgerBalance={currentSalesLedgerBalance}
        totalUnapprovedInvoiceValue={accountStatus?.totalUnapprovedInvoiceValue ?? 0}
        currentAccountBalance={calculatedCurrentAccountBalance} // Use calculated value
      />

      <PaymentRequestForm
        netAvailability={netAvailability}
        onSubmitRequest={handlePaymentRequest}
        isLoading={paymentRequestLoading}
        requestError={paymentRequestError}
        requestSuccess={paymentRequestSuccess}
      />

      {/* AccountStatusForm removed */}

      <LedgerEntryForm onSubmit={handleAddLedgerEntry} />

      {/* Sales Ledger History */}
      <div style={{marginTop: '30px'}}>
        <h3>Sales Ledger Transaction History</h3>
        <LedgerHistory entries={salesLedgerEntries} historyType="sales" isLoading={isLoadingEntries} />
      </div>

      {/* Current Account History */}
      <div style={{marginTop: '30px'}}>
        <h3>Current Account Transaction History</h3>
        <LedgerHistory entries={currentAccountTransactions} historyType="account" isLoading={isLoadingAcctTransactions} />
      </div>

    </div>
  );

} // End SalesLedger Component

// Default export
export default SalesLedger;