// src/App.jsx
import React from 'react';

// 1. Import Authenticator and styles
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css'; // Default Amplify UI styles

// Import your SalesLedger component (we'll create this next)
import SalesLedger from './SalesLedger';

function App() {
  return (
    // 2. Wrap the core app content with Authenticator
    <Authenticator>
      {({ signOut, user }) => (
        <main>
          {/* Pass user info and signOut to your main app content if needed */}
          <h1>Hello, {user?.signInDetails?.loginId ?? 'User'}!</h1>
          {/* Render the SalesLedger component only when authenticated */}
          <SalesLedger />

          <button onClick={signOut} style={{ marginTop: '20px' }}>Sign out</button>
        </main>
      )}
    </Authenticator>
  );
}

export default App;