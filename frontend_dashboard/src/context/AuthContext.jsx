import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import apiClient from '../api/client';

// Attempt to import Clerk hooks if available, otherwise create no-op replacements
let useAuthHook;
let useUserHook;
try {
  // eslint-disable-next-line global-require
  const clerk = require('@clerk/clerk-react');
  useAuthHook = clerk.useAuth;
  useUserHook = clerk.useUser;
} catch {
  useAuthHook = () => ({
    isLoaded: true,
    isSignedIn: false,
    getToken: async () => null,
    signOut: async () => {},
  });
  useUserHook = () => ({ isLoaded: true, user: null });
}

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
  } catch {
    return null;
  }
}

// PUBLIC_INTERFACE
// AuthProvider provides Clerk + backend derived auth state.
export function AuthProvider({ children }) {
  const { isLoaded: authLoaded, getToken, isSignedIn, signOut } = useAuthHook();
  const { isLoaded: userLoaded, user: clerkUser } = useUserHook();

  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [backendUser, setBackendUser] = useState(null);
  const abortRef = useRef(null);

  const refresh = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      let t = null;
      if (authLoaded && isSignedIn && typeof getToken === 'function') {
        try {
          t = await getToken({ template: 'default' }).catch(() => null);
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

  // Periodically refresh token in background (optional)
  useEffect(() => {
    if (!authLoaded) return undefined;
    const id = setInterval(() => {
      refresh();
    }, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [authLoaded, refresh]);

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

    return { user, role, token, isAdmin, loading, refresh, signOut: async () => { try { await (typeof signOut === 'function' ? signOut() : Promise.resolve()); } catch {} } };
  }, [backendUser, clerkUser, token, loading, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// PUBLIC_INTERFACE
// useAuthContext provides access to AuthContext.
export function useAuthContext() {
  return useContext(AuthContext);
}

export default AuthContext;
