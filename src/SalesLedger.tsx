// src/SalesLedger.tsx
import React, { useState, useEffect, useCallback } from 'react';
// Import Amplify data client and generated types/schema
import { generateClient } from 'aws-amplify/data';
// Make sure the path to your resource file is correct
import type { Schema } from '../amplify/data/resource';

// Import all the necessary sub-components
import CurrentBalance from './CurrentBalance'; // Displays Ledger balance
import LedgerEntryForm from './LedgerEntryForm';
import LedgerHistory from './LedgerHistory';
import AvailabilityDisplay from './AvailabilityDisplay'; // Displays availability calculation
import AccountStatusForm from './AccountStatusForm';   // Form for manual unapproved/balance inputs
import PaymentRequestForm from './PaymentRequestForm'; // Form for payment request

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

  // State for the single AccountStatus record (manual inputs)
  const [accountStatus, setAccountStatus] = useState<Schema['AccountStatus'] | null>(null);
  const [accountStatusId, setAccountStatusId] = useState<string | null>(null); // To store the ID for updates
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isSavingStatus, setIsSavingStatus] = useState(false); // Loading state for AccountStatus updates

  // State for Calculated Availability figures
  const [grossAvailability, setGrossAvailability] = useState(0);
  const [netAvailability, setNetAvailability] = useState(0);

  // State for Payment Request process
  const [paymentRequestLoading, setPaymentRequestLoading] = useState(false);
  const [paymentRequestError, setPaymentRequestError] = useState<string | null>(null);
  const [paymentRequestSuccess, setPaymentRequestSuccess] = useState<string | null>(null);

  // General Error State for the component (e.g., fetch errors)
  const [error, setError] = useState<string | null>(null);

  // Effect Hook: Fetch Ledger Entries using real-time subscription
  useEffect(() => {
    setError(null); // Clear previous general errors
    const sub = client.models.LedgerEntry.observeQuery({
      authMode: 'userPool' // Specify auth mode used
    }).subscribe({
      next: ({ items, isSynced }) => {
        // Sort entries chronologically based on creation date
        const sortedItems = [...items].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
         );
        setEntries(sortedItems);
        setIsLoadingEntries(!isSynced); // Loading is true until data is synced
      },
      error: (err: any) => {
        console.error("Error fetching ledger entries:", err);
        setError(`Failed to load ledger history: ${err.message || JSON.stringify(err)}`);
        setIsLoadingEntries(false);
      },
    });
    // Cleanup function to unsubscribe when component unmounts
    return () => sub.unsubscribe();
  }, []); // Empty dependency array means this effect runs once on mount

  // Effect Hook: Calculate Current Sales Ledger Balance whenever entries change
  useEffect(() => {
    let calculatedBalance = 0;
    entries.forEach(entry => {
      // Sum amounts based on transaction type
      switch (entry.type) {
        case 'INVOICE':
        case 'INCREASE_ADJUSTMENT':
          calculatedBalance += entry.amount;
          break;
        case 'CREDIT_NOTE':
        case 'DECREASE_ADJUSTMENT':
          calculatedBalance -= entry.amount;
          break;
        default: break; // Ignore any unknown types
      }
    });
    // Update state, formatted to two decimal places
    setCurrentSalesLedgerBalance(parseFloat(calculatedBalance.toFixed(2)));
  }, [entries]); // Dependency array: recalculate when 'entries' state changes

  // Effect Hook: Fetch the user's AccountStatus record (only one expected)
  const fetchAccountStatus = useCallback(async () => {
    setIsLoadingStatus(true);
    setError(null); // Clear previous general errors
    try {
      // List records - owner auth rule means only user's own record(s) are returned
      const { data: statusItems, errors } = await client.models.AccountStatus.list({
          authMode: 'userPool'
      });

      if (errors) throw errors; // Handle GraphQL errors

      if (statusItems.length > 0) {
        // If record(s) exist, use the first one
        setAccountStatus(statusItems[0]);
        setAccountStatusId(statusItems[0].id); // Store the ID for updates
      } else {
        // No record exists yet for this user
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
  }, []); // useCallback ensures function identity is stable

  useEffect(() => {
    fetchAccountStatus(); // Run the fetch function on mount
  }, [fetchAccountStatus]); // Dependency includes the stable fetch function


  // Effect Hook: Calculate Availability whenever dependencies change
  useEffect(() => {
    // Use 0 if accountStatus is null (not loaded or doesn't exist)
    const unapprovedValue = accountStatus?.totalUnapprovedInvoiceValue ?? 0;
    const currentBalance = accountStatus?.currentAccountBalance ?? 0;

    // Calculate Gross Availability
    const grossAvail = (currentSalesLedgerBalance - unapprovedValue) * ADVANCE_RATE;
    // Calculate Net Availability
    const netAvail = grossAvail - currentBalance;

    // Update state, ensuring non-negative values and formatted to 2 decimals
    setGrossAvailability(Math.max(0, parseFloat(grossAvail.toFixed(2))));
    setNetAvailability(Math.max(0, parseFloat(netAvail.toFixed(2))));

  }, [currentSalesLedgerBalance, accountStatus]); // Dependencies: recalculate if these change


  // Handler function to Create or Update the AccountStatus record
  const handleStatusUpdate = async (unapprovedValue: number, accountBalance: number) => {
    setIsSavingStatus(true); // Set loading state for button
    setError(null); // Clear previous general errors
    try {
      // Prepare data payload
      const inputData = {
        totalUnapprovedInvoiceValue: unapprovedValue,
        currentAccountBalance: accountBalance,
      };

      if (accountStatusId) {
        // If ID exists, update the existing record
        const { data: updatedStatus, errors } = await client.models.AccountStatus.update(
            { id: accountStatusId, ...inputData }, // Include ID for update
            { authMode: 'userPool' }
        );
        if (errors) throw errors;
        console.log("AccountStatus updated:", updatedStatus);
        setAccountStatus(updatedStatus); // Update local state with returned data

      } else {
        // If ID doesn't exist, create a new record
        const { data: newStatus, errors } = await client.models.AccountStatus.create(
            inputData,
            { authMode: 'userPool' }
        );
        if (errors) throw errors;
        console.log("AccountStatus created:", newStatus);
        setAccountStatus(newStatus); // Update local state with the new record
        setAccountStatusId(newStatus.id); // Store the ID of the newly created record
      }
    } catch (err: any) {
      console.error("Error updating/creating account status:", err);
      const errorMsg = Array.isArray(err?.errors) ? err.errors[0].message : (err?.message || 'Unknown error');
      setError(`Failed to update status: ${errorMsg}`);
    } finally {
      setIsSavingStatus(false); // Unset loading state
    }
  };


  // Handler function for adding new ledger entries
  const handleAddLedgerEntry = async (entryData: { type: string, amount: number, description?: string }) => {
     setError(null); // Clear previous general errors
     try {
       // Create the new ledger entry using data from form
       const { errors, data: newEntry } = await client.models.LedgerEntry.create({
         type: entryData.type, // Make sure type is one of the Enum values
         amount: entryData.amount,
         description: entryData.description || null, // Handle optional field
       }, { authMode: 'userPool' });

       if (errors) throw errors;
       console.log("Ledger Entry created:", newEntry);
       // State updates automatically via observeQuery subscription

     } catch (err: any) {
       console.error("Error creating ledger entry:", err);
       const errorMsg = Array.isArray(err?.errors) ? err.errors[0].message : (err?.message || 'Unknown error');
       setError(`Failed to save transaction: ${errorMsg}`);
     }
   };

  // Handler function for submitting payment request (uses client.graphql)
  const handlePaymentRequest = async (amount: number) => {
    setPaymentRequestLoading(true); // Set loading state for request form
    setPaymentRequestError(null);
    setPaymentRequestSuccess(null);

    // Define the GraphQL mutation string (matching the schema)
    const mutationDoc = /* GraphQL */ `
      mutation SendPaymentRequest($input: PaymentRequestInput!) {
        requestPayment(input: $input)
      }
    `;
    // Define the variables object for the mutation
    const variables = { input: { amount: amount } };

    console.log('Calling requestPayment mutation via client.graphql with variables:', variables);

    try {
      // Execute the mutation using client.graphql()
      const result = await client.graphql({
        query: mutationDoc,
        variables: variables,
        authMode: 'userPool' // Use the appropriate auth mode
      });

      console.log('GraphQL Result:', result);
      const responseMessage = result.data?.requestPayment; // Access result data
      const errors = result.errors;

      if (errors) throw errors[0]; // Throw first error if any

      console.log('Payment request result data:', responseMessage);
      setPaymentRequestSuccess(responseMessage ?? 'Request submitted successfully!'); // Update success state

    } catch (err: any) {
      // Catch block with enhanced logging
      console.error("-----------------------------------------");
      console.error("Error object submitting payment request:", err);
      console.error("err.message:", err?.message);
      try { console.error("err.errors:", JSON.stringify(err?.errors)); } catch (e) { /* ignore */ }
      console.error("-----------------------------------------");
      // Determine best error message to show user
      let displayError = 'Unknown error during payment request.';
      if (Array.isArray(err?.errors) && err.errors.length > 0 && err.errors[0].message) {
          displayError = err.errors[0].message;
      } else if (err?.message) {
          displayError = err.message;
      } else if (typeof err === 'string') {
          displayError = err;
      } else { try { displayError = JSON.stringify(err); } catch (e) { /* ignore */ }}
      // Update error state
      setPaymentRequestError(`Failed to submit request: ${displayError}`);
      setPaymentRequestSuccess(null); // Clear success message
    } finally {
      setPaymentRequestLoading(false); // Unset loading state
    }
  };


  // Render Loading state if initial data isn't ready
  if (isLoadingEntries || isLoadingStatus) {
      return <p>Loading application data...</p>
  }


  // Render the main UI
  return (
    <div style={{ padding: '20px' }}>
      <h2>Sales Ledger</h2>
      {/* Display general errors at the top */}
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

      {/* Render Form for Manual Status Updates */}
      <AccountStatusForm
        initialUnapprovedValue={accountStatus?.totalUnapprovedInvoiceValue ?? 0}
        initialAccountBalance={accountStatus?.currentAccountBalance ?? 0}
        onUpdate={handleStatusUpdate}
        isSaving={isSavingStatus}
      />

      {/* Render Form for Adding Ledger Entries */}
      <LedgerEntryForm onSubmit={handleAddLedgerEntry} />

      {/* Render Ledger History Table */}
      <LedgerHistory entries={entries} isLoading={isLoadingEntries} />
    </div>
  );
}

// Ensure the component is exported as default
export default SalesLedger;