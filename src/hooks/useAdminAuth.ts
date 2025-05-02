// src/hooks/useAdminAuth.ts
import { useState, useEffect } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';

function useAdminAuth() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true; // Prevent state update on unmounted component
    const checkAdminStatus = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // forceRefresh = false uses cached session if available
        const session = await fetchAuthSession({ forceRefresh: false });
        // ID token usually contains group information
        const groups = session.tokens?.idToken?.payload['cognito:groups'] as string[] | undefined;
        console.log('User groups from session:', groups); // For debugging
        if (isMounted) {
          setIsAdmin(groups?.includes('Admin') ?? false);
        }
      } catch (e) {
        console.error('Error fetching auth session for admin check:', e);
        if (isMounted) {
          setIsAdmin(false);
          setError(e instanceof Error ? e : new Error('Unknown auth error'));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    checkAdminStatus();

    return () => {
      isMounted = false; // Cleanup function
    };
  }, []); // Run only once on mount

  return { isAdmin, isLoading, error };
}

export default useAdminAuth;