// src/App.tsx

import React from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import SalesLedger from './SalesLedger';
import './App.css'; // Make sure you import the CSS file with the logo style

function App() {
  return (
    <Authenticator>
      {({ signOut, user }) => (
        <main>
          {/* --- ADD THE LOGO IMAGE HERE --- */}
          <img
            src="/Aurum.png" // Path to the logo in the 'public' folder
            alt="Aurum Company Logo"
            className="company-logo" // Apply the CSS class for positioning
          />
          {/* --- END OF ADDED LOGO --- */}

          <h1>Hello, {user?.signInDetails?.loginId ?? 'User'}!</h1>
          <SalesLedger />
          <button onClick={signOut} style={{ marginTop: '20px' }}>Sign out</button>
        </main>
      )}
    </Authenticator>
  );
}

export default App;