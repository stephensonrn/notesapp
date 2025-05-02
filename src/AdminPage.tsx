// src/AdminPage.tsx
import React from 'react';
import ManageAccountStatus from './ManageAccountStatus';
import AddCashReceiptForm from './AddCashReceiptForm';

function AdminPage() {
  // This page is already protected by the routing logic in App.tsx
  return (
    <div>
      <h2>Admin Section</h2>
      <p>Manage backend data here.</p>
      <hr />
      <ManageAccountStatus />
      <hr style={{margin: '20px 0'}}/>
      <AddCashReceiptForm />
    </div>
  );
}

export default AdminPage;