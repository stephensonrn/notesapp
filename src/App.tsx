// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';

// Import Amplify UI components (NO useAuthenticator needed here)
import { Authenticator, Button, Heading, View, Flex } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css'; // Default theme

// Custom components & hooks
import SalesLedger from './SalesLedger';
import AdminPage from './AdminPage';
import useAdminAuth from './hooks/useAdminAuth'; // Hook to check group membership

// Custom CSS (optional)
import './App.css';

// Logo (ensure path is correct for your project structure - /public/Aurum.png for Vite)
import aurumLogo from '/Aurum.png';

// Note: Amplify.configure(outputs) should be in main.tsx or index.tsx

// --- Authenticator Customization Objects ---
const formFields = {
  signIn: {
    username: { // Assuming login is via email based on previous setting
      label: 'Email:',
      placeholder: 'Enter your email',
      type: 'email'
    },
  },
  signUp: {
     email: { order: 1 },
     // Add 'name' or 'preferred_username' if you have it as a required signup attribute
     // name: { label: 'Name:', placeholder: 'Enter your full name', order: 2 },
     password: { label: 'Password:', placeholder: 'Enter your password', order: 3 },
     confirm_password: { label: 'Confirm Password:', placeholder: 'Please confirm your password', order: 4 }
  },
};

const components = {
  Header() {
    return (
      <Heading level={3} padding="medium" textAlign="center">
        <img src={aurumLogo} alt="Aurum Logo" style={{ height: '40px', marginRight: '10px', verticalAlign: 'middle' }} />
        Sales Ledger Application
      </Heading>
    );
  },
};
// --- End Authenticator Customization ---


// --- Main App Component ---
function App() {
  // Custom hook to determine if user is admin (runs after authentication)
  const { isAdmin, isLoading: isAdminLoading, error: adminCheckError } = useAdminAuth();

  // We get signOut and user from the Authenticator's render prop below,
  // so the useAuthenticator hook is NOT needed here.

  if (adminCheckError) {
     console.error("Error checking admin status:", adminCheckError);
     // Handle error appropriately - maybe show a generic error UI
  }

  return (
    // Authenticator handles sign-in/sign-up UI and state
    <Authenticator loginMechanisms={['email']} formFields={formFields} components={components}>
      {/* This function receives signOut and user WHEN the user is authenticated */}
      {({ signOut, user }) => (
        <Router>
          <View padding="medium">
            {/* --- Navigation --- */}
            <Flex
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                style={{ marginBottom: '20px', borderBottom: '1px solid #ccc', paddingBottom: '10px' }}
            >
              <nav>
                <Link to="/" style={{ marginRight: '15px', textDecoration: 'none' }}>Sales Ledger</Link>
                {/* Conditionally render Admin link based on hook result */}
                {/* Check if user exists before showing admin loading state */}
                {user && !isAdminLoading && isAdmin && (
                  <Link to="/admin" style={{ marginRight: '15px', textDecoration: 'none' }}>Admin Section</Link>
                )}
                {user && isAdminLoading && <span> (Checking admin...)</span>}
              </nav>
              {/* Sign Out Button - use signOut from render prop, show only if user exists */}
              {user && (
                 <Button onClick={signOut} variation="primary" size="small">Sign Out {user.signInDetails?.loginId || user.username || ''}</Button>
              )}
            </Flex>
             {/* --- End Navigation Bar --- */}

            {/* --- Main Content Area (Routed) --- */}
            <main>
              <Routes>
                <Route path="/" element={<SalesLedger />} />
                {/* Protect the Admin Route */}
                <Route
                  path="/admin"
                  element={
                    // Ensure user exists and admin check is complete
                    user && !isAdminLoading ? (
                      isAdmin ? ( // If admin, show page
                        <AdminPage />
                      ) : ( // If not admin, redirect
                        <Navigate to="/" replace state={{ message: "Access Denied" }} />
                      )
                    ) : (
                      // Show loading only if logged in but checking admin status
                       user && isAdminLoading ? <p>Verifying permissions...</p> : <Navigate to="/" replace /> // Redirect if not logged in at all
                    )
                  }
                />
                {/* Catch-all route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            {/* --- End Main Content Area --- */}

          </View>
        </Router>
      )}
    </Authenticator>
  );
}

export default App;