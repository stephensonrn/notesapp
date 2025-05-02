// src/AdminPage.tsx
import React from 'react';
import ManageAccountStatus from './ManageAccountStatus';
import AddCashReceiptForm from './AddCashReceiptForm'; // Import the new form
import { Flex, Heading, Text } from '@aws-amplify/ui-react'; // Add Heading and Text here

function AdminPage() {
  return (
    <Flex direction="column" gap="large"> {/* Use Flex for layout */}
      <Heading level={2}>Admin Section</Heading>
      <Text>Manage backend data here.</Text>

      <ManageAccountStatus />

      <AddCashReceiptForm /> {/* Render the cash receipt form */}

    </Flex>
  );
}

export default AdminPage;