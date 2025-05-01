// src/SalesLedger.tsx
import React, { useState, useEffect, useCallback } from 'react';
// Import Amplify data client and generated types/schema
import { generateClient } from 'aws-amplify/data';
// Make sure the path to your resource file is correct
import type { Schema } from '../amplify/data/resource';

// Import all the necessary sub-components
import CurrentBalance from './CurrentBalance';
import LedgerEntryForm from './LedgerEntryForm'; // Assumes CASH_RECEIPT option removed
import LedgerHistory from './LedgerHistory'; // Will display both types based on props
import AvailabilityDisplay from './AvailabilityDisplay';
// AccountStatusForm component was removed (or needs simplification if used elsewhere)
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
        setCurrentAccountTransactions(sortedItems); // Set state for these transactions
        setIsLoadingAcctTransactions(!isSynced);
      },
      error: (err: any) => { console.error("[ObserveQuery CurrentAccountTransaction] Subscription Error:", err); setError(`Account transaction error: ${err.message || JSON.stringify(err)}`); setIsLoadingAcctTransactions(false); }
    });
    console.log("CurrentAccountTransaction subscription established.");
    return () => { console.log("Cleaning up CurrentAccountTransaction subscription."); sub.unsubscribe(); }
  }, []);


  // --- Effect Hooks for Calculations ---

  // Calculate Sales Ledger Balance (Based ONLY on LedgerEntry)
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

  // Calculate Current Account Balance (Based ONLY on CurrentAccountTransaction)
  useEffect(() => {
    let calculatedAccBalance = 0;
    currentAccountTransactions.forEach(transaction => {
        console.log('Calculating balance: Processing transaction:', transaction.type, transaction.amount);
        switch (transaction.type) {
            case 'PAYMENT_REQUEST':
                // Payment requests INCREASE the drawn balance
                calculatedAccBalance += transaction.amount;
                break;
            case 'CASH_RECEIPT':
                // Cash receipts DECREASE the drawn balance
                calculatedAccBalance -= transaction.amount;
                break;
            default: break;
        }
    });
    setCalculatedCurrentAccountBalance(parseFloat(calculatedAccBalance.toFixed(2)));
    console.log("Calculated Current Account Balance:", calculatedAccBalance.toFixed(2));
  }, [currentAccountTransactions]); // Re-run when these transactions change

  // Calculate Availability (Uses calculated balances + manual unapproved value)
  useEffect(() => {
    const unapprovedValue = accountStatus?.totalUnapprovedInvoiceValue ?? 0;
    const currentAccountBalance = calculatedCurrentAccountBalance; // Use calculated value
    const grossAvail = (currentSalesLedgerBalance - unapprovedValue) * ADVANCE_RATE;
    const netAvail = grossAvail - currentAccountBalance; // Use calculated value
    setGrossAvailability(Math.max(0, parseFloat(grossAvail.toFixed(2))));
    setNetAvailability(Math.max(0, parseFloat(netAvail.toFixed(2))));
  }, [currentSalesLedgerBalance, accountStatus, calculatedCurrentAccountBalance]); // Dependencies updated


  // --- Handler Functions ---

  // Add Ledger Entry (Invoices, CNs, Adjustments)
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

  // Payment Request (sends email, triggers Lambda to create CurrentAccountTransaction record)
  const handlePaymentRequest = async (amount: number) => {
    setPaymentRequestLoading(true); setPaymentRequestError(null); setPaymentRequestSuccess(null);
    const mutationDoc = /* GraphQL */ `
      mutation SendPaymentRequest($input: PaymentRequestInput!) {
        requestPayment(input: $input)
      }
    `;
    const variables = { input: { amount: amount } };
    console.log('Calling requestPayment mutation via client.graphql with variables:', variables);
    try {
        const result = await client.graphql({ query: mutationDoc, variables: variables, authMode: 'userPool' });
        console.log('GraphQL Result:', result);
        const responseMessage = result.data?.requestPayment;
        const errors = result.errors;
        if (errors) throw errors[0];
        setPaymentRequestSuccess(responseMessage ?? 'Request submitted successfully!');
    } catch (err: any) { /* ... enhanced error handling ... */
        console.error("Error object submitting payment request:", err);
        let displayError = 'Unknown error during payment request.';
        if (Array.isArray(err?.errors) && err.errors.length > 0 && err.errors[0].message) { displayError = err.errors[0].message;}
        else if (err?.message) { displayError = err.message;}
        else if (typeof err === 'string') { displayError = err;}
        else { try { displayError = JSON.stringify(err); } catch (e) { /* ignore */ }}
        setPaymentRequestError(`Failed to submit request: ${displayError}`);
        setPaymentRequestSuccess(null);
    } finally { setPaymentRequestLoading(false); }
  };


  // --- Filtering logic for Sales Ledger History ---
  // (Only contains INVOICE, CREDIT_NOTE, INCREASE_ADJUSTMENT, DECREASE_ADJUSTMENT)
  const salesLedgerEntries = entries.filter(entry =>
    entry.type !== 'CASH_RECEIPT' // Filter out cash receipts if they were somehow still in entries
  );
  // cashEntries filter removed - directly using currentAccountTransactions state


  // --- Loading State Check (includes all data sources) ---
  if (isLoadingEntries || isLoadingStatus || isLoadingAcctTransactions) {
      return <p>Loading application data...</p>;
  }


  // --- Main Render Output ---
  return (
    <div style={{ padding: '20px' }}>
      <h2>Sales Ledger</h2>
      {error && <p style={{ color: 'red', border: '1px solid red', padding: '10px' }}>Error: {error}</p>}

      {/* Display Balances and Availability */}
      <CurrentBalance balance={currentSalesLedgerBalance} />
      <AvailabilityDisplay
        grossAvailability={grossAvailability}
        netAvailability={netAvailability}
        currentSalesLedgerBalance={currentSalesLedgerBalance}
        totalUnapprovedInvoiceValue={accountStatus?.totalUnapprovedInvoiceValue ?? 0}
        // Pass the CALCULATED balance here
        currentAccountBalance={calculatedCurrentAccountBalance}
      />

      {/* Display Payment Request Form */}
      <PaymentRequestForm
        netAvailability={netAvailability}
        onSubmitRequest={handlePaymentRequest}
        isLoading={paymentRequestLoading}
        requestError={paymentRequestError}
        requestSuccess={paymentRequestSuccess}
      />

      {/* AccountStatusForm component would go here if needed for totalUnapprovedInvoiceValue */}
      {/* <AccountStatusForm ... /> */}

      {/* Ledger Entry Form (for Sales Ledger items) */}
      <LedgerEntryForm onSubmit={handleAddLedgerEntry} />

      {/* Sales Ledger History Section */}
      <div style={{marginTop: '30px'}}>
        <h3>Sales Ledger Transaction History</h3>
        {/* Pass filtered sales ledger entries */}
        <LedgerHistory entries={salesLedgerEntries} historyType="sales" isLoading={isLoadingEntries} />
      </div>

      {/* Current Account History Section */}
      <div style={{marginTop: '30px'}}>
        <h3>Current Account Transaction History</h3>
         {/* Pass the fetched currentAccountTransactions state directly */}
         {/* Ensure LedgerHistory component handles 'account' historyType correctly */}
        <LedgerHistory entries={currentAccountTransactions} historyType="account" isLoading={isLoadingAcctTransactions} />
      </div>

    </div> // Closing div for main component return
  ); // Closing parenthesis for main component return

} // Closing brace for SalesLedger function component

// Default export
export default SalesLedger;