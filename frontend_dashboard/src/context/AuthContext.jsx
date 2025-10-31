import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import apiClient, { setAuthTokenProvider } from '../api/client';

// PUBLIC_INTERFACE
// AuthContextValue shape exposed to the app.
const AuthContext = createContext({
  user: null,
  role: null,
  token: null,
  isAdmin: false,
  loading: true,
  refresh: async () => {},
});

function deriveAdminFromEmail(email) {
  const admins = (process.env.REACT_APP_ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (!email) return false;
  return admins.includes(email.toLowerCase());
}

async function fetchMe(signal) {
  try {
    const res = await apiClient.get('/auth/me', { signal });
    return res?.data || null;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('Failed to fetch /api/auth/me', err?.response?.status, err?.message);
    return null;
  }
}

// PUBLIC_INTERFACE
// AuthProvider provides Clerk + backend derived auth state.
export function AuthProvider({ children }) {
  const { isLoaded: authLoaded, getToken, isSignedIn, signOut } = useAuth();
  const { isLoaded: userLoaded, user: clerkUser } = useUser();

  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [backendUser, setBackendUser] = useState(null);
  const abortRef = useRef(null);

  // Keep axios token fresh via provider callback
  useEffect(() => {
    setAuthTokenProvider(async () => {
      if (!authLoaded || !isSignedIn) return null;
      try {
        const t = await getToken().catch(() => null);
        return t || null;
      } catch {
        return null;
      }
    });
  }, [authLoaded, isSignedIn, getToken]);

  const refresh = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      let t = null;
      if (authLoaded && isSignedIn) {
        try {
          t = await getToken().catch(() => null);
        } catch {
          t = null;
        }
      }
      setToken(t);

      let me = null;
      if (t) {
        me = await fetchMe(controller.signal);
      }
      if (!me && clerkUser) {
        me = {
          id: clerkUser.id,
          email: clerkUser.primaryEmailAddress?.emailAddress || null,
          role: deriveAdminFromEmail(clerkUser.primaryEmailAddress?.emailAddress) ? 'admin' : 'user',
        };
      }
      setBackendUser(me || null);
    } finally {
      setLoading(false);
    }
  }, [authLoaded, isSignedIn, getToken, clerkUser]);

  // Subscribe to Clerk changes
  useEffect(() => {
    if (!authLoaded || !userLoaded) return;
    refresh();
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [authLoaded, userLoaded, isSignedIn, clerkUser, refresh]);

  // Clear on sign-out
  useEffect(() => {
    if (authLoaded && !isSignedIn) {
      setBackendUser(null);
      setToken(null);
      setLoading(false);
    }
  }, [authLoaded, isSignedIn]);

  const value = useMemo(() => {
    const id = backendUser?.id || null;
    const email = backendUser?.email || clerkUser?.primaryEmailAddress?.emailAddress || null;
    const role = backendUser?.role || (deriveAdminFromEmail(email) ? 'admin' : 'user');
    const isAdmin = role === 'admin';
    const user = (id || email) ? { id, email } : null;

    return { user, role, token, isAdmin, loading, refresh, signOut };
  }, [backendUser, clerkUser, token, loading, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// PUBLIC_INTERFACE
// useAuthContext provides access to AuthContext.
export function useAuthContext() {
  return useContext(AuthContext);
}

export default AuthContext;
