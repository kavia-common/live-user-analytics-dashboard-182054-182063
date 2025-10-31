import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useAuth } from '@clerk/clerk-react';
import api from '../api/client';

// PUBLIC_INTERFACE
// AuthContextValue shape exposed to the app components.
const AuthContext = createContext({
  user: null,
  role: null,
  isAdmin: false,
  loading: true,
  refresh: async () => {},
});

/**
 * Derive admin from allowed emails list if backend role is missing.
 */
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
    // Use axios instance baseURL ('/api' by default) and call '/auth/me' to avoid double '/api/api'
    const res = await api.get('/auth/me', { signal });
    return res?.data || null;
  } catch (e) {
    // Return null on failure so we can fallback to Clerk without breaking UI
    return null;
  }
}

/**
 * PUBLIC_INTERFACE
 * AuthProvider fetches backend profile and exposes user, role, isAdmin, loading, and refresh.
 * It gracefully falls back to Clerk if backend is unavailable and always clears loading.
 */
export function AuthProvider({ children }) {
  const { isLoaded, isSignedIn, user: clerkUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const abortRef = useRef(null);
  const didUnmountRef = useRef(false);
  const lastClerkStateRef = useRef({ isLoaded: undefined, isSignedIn: undefined });

  const safeSetState = useCallback((setter) => {
    if (!didUnmountRef.current) {
      setter();
    }
  }, []);

  const refresh = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    safeSetState(() => setLoading(true));
    try {
      const me = await fetchMe(controller.signal);
      // me may be null if backend is down; store as null and let memo derive from Clerk
      safeSetState(() => setProfile(me));
    } catch {
      safeSetState(() => setProfile(null));
    } finally {
      safeSetState(() => setLoading(false));
    }
  }, [safeSetState]);

  // Effect: Wait for Clerk to finish loading before fetching backend profile.
  useEffect(() => {
    const changed =
      lastClerkStateRef.current.isLoaded !== isLoaded ||
      lastClerkStateRef.current.isSignedIn !== isSignedIn;
    if (!changed) return;
    lastClerkStateRef.current = { isLoaded, isSignedIn };

    if (!isLoaded) {
      // Clerk not initialized; hold loading to avoid flicker
      safeSetState(() => setLoading(true));
      return;
    }
    // If signed out, clear profile and set loading false
    if (!isSignedIn) {
      safeSetState(() => setProfile(null));
      safeSetState(() => setLoading(false));
      return;
    }
    // Signed in and Clerk loaded: fetch backend profile
    refresh();
  }, [isLoaded, isSignedIn, refresh, safeSetState]);

  // Cleanup to avoid setState on unmount
  useEffect(() => {
    didUnmountRef.current = false;
    return () => {
      didUnmountRef.current = true;
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  const value = useMemo(() => {
    // Prefer backend identity when available; otherwise fallback to Clerk user
    const clerkEmail =
      clerkUser?.primaryEmailAddress?.emailAddress ||
      clerkUser?.emailAddresses?.[0]?.emailAddress;
    const backendEmail = profile?.clerk?.email || profile?.user?.email || profile?.email || null;
    const email = backendEmail || clerkEmail || null;

    const id =
      profile?.clerk?.id ||
      profile?.user?.id ||
      profile?._id ||
      clerkUser?.id ||
      null;

    const role =
      profile?.role ||
      profile?.user?.role ||
      (deriveAdminFromEmail(email) ? 'admin' : 'user');

    const isAdmin = role === 'admin';
    const user = (email || id)
      ? { id, email, name: profile?.user?.name || profile?.name || clerkUser?.fullName }
      : null;

    return {
      user,
      role,
      isAdmin,
      loading,
      refresh,
      profile,
    };
  }, [profile, loading, clerkUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// PUBLIC_INTERFACE
// useAuthContext returns current auth context value
export function useAuthContext() {
  return useContext(AuthContext);
}

export default AuthContext;
