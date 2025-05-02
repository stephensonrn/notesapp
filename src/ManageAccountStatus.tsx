// src/ManageAccountStatus.tsx
import React, { useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';

const client = generateClient<Schema>();

function ManageAccountStatus() {
  const [ownerIdInput, setOwnerIdInput] = useState('');
  const [loadedStatus, setLoadedStatus] = useState<Schema['AccountStatus'] | null>(null);
  const [newUnapprovedValue, setNewUnapprovedValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleLoadStatus = async () => {
    if (!ownerIdInput) {
      setError('Please enter a User ID (Owner).');
      return;
    }
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    setLoadedStatus(null);
    setNewUnapprovedValue('');

    try {
      // Admins have read access via group auth rule
      const { data: statusItems, errors } = await client.models.AccountStatus.list({
        filter: { owner: { eq: ownerIdInput } },
        authMode: 'userPool' // Assuming admin uses userPool auth
      });
      if (errors) throw errors;

      if (statusItems.length > 0) {
        setLoadedStatus(statusItems[0]);
        setNewUnapprovedValue(statusItems[0].totalUnapprovedInvoiceValue.toString());
      } else {
        setError(`No AccountStatus record found for owner ID: ${ownerIdInput}. A record might be created automatically on first user activity, or needs initial creation.`);
      }
    } catch (err: any) {
      console.error("Error loading account status:", err);
      const errorMsg = Array.isArray(err?.errors) ? err.errors[0].message : (err?.message || 'Unknown error');
      setError(`Failed to load status: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (event: React.FormEvent<HTMLFormElement>) => {
     event.preventDefault();
     if (!loadedStatus?.id) {
       setError('No status record loaded to update.');
       return;
     }
     const numericValue = parseFloat(newUnapprovedValue);
     if (isNaN(numericValue) || numericValue < 0) {
       setError('Please enter a valid non-negative unapproved value.');
       return;
     }

     setIsLoading(true);
     setError(null);
     setSuccess(null);

     try {
       // Admins have update access via group auth rule
       const { data: updatedStatus, errors } = await client.models.AccountStatus.update(
         {
           id: loadedStatus.id, // Use the loaded record ID
           totalUnapprovedInvoiceValue: numericValue
         },
         { authMode: 'userPool' }
       );
       if (errors) throw errors;

       setLoadedStatus(updatedStatus); // Update displayed value
       setNewUnapprovedValue(updatedStatus.totalUnapprovedInvoiceValue.toString());
       setSuccess(`Successfully updated unapproved value for owner ${loadedStatus.owner} to ${numericValue.toFixed(2)}.`);
     } catch (err: any) {
        console.error("Error updating account status:", err);
        const errorMsg = Array.isArray(err?.errors) ? err.errors[0].message : (err?.message || 'Unknown error');
        setError(`Failed to update status: ${errorMsg}`);
     } finally {
       setIsLoading(false);
     }
  };


  return (
    <div>
      <h4>Manage Account Status (Total Unapproved Value)</h4>
      <div>
        <label htmlFor="ownerId">User ID (Owner GUID): </label>
        <input
          type="text"
          id="ownerId"
          value={ownerIdInput}
          onChange={(e) => setOwnerIdInput(e.target.value)}
          placeholder="Enter Cognito User GUID"
          style={{width: '300px'}}
          disabled={isLoading}
        />
        <button onClick={handleLoadStatus} disabled={isLoading || !ownerIdInput} style={{marginLeft: '10px'}}>
          {isLoading ? 'Loading...' : 'Load Status'}
        </button>
      </div>

      {loadedStatus && (
         <form onSubmit={handleUpdateStatus} style={{marginTop: '15px'}}>
           <p>Current record ID: {loadedStatus.id}</p>
           <p>Owner: {loadedStatus.owner}</p>
           <div>
              <label htmlFor="unapprovedValue">Total Unapproved Value: </label>
              <input
                  type="number"
                  id="unapprovedValue"
                  step="0.01"
                  min="0"
                  value={newUnapprovedValue}
                  onChange={(e) => setNewUnapprovedValue(e.target.value)}
                  required
                  disabled={isLoading}
              />
              <button type="submit" disabled={isLoading} style={{marginLeft: '10px'}}>
                  {isLoading ? 'Saving...' : 'Save New Value'}
              </button>
           </div>
         </form>
      )}
      {success && <p style={{ color: 'green' }}>{success}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

export default ManageAccountStatus;