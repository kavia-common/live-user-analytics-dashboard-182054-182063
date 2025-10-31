import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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
    // Do not throw; return null to avoid breaking UI on 500s
    return null;
  }
}

/**
 * PUBLIC_INTERFACE
 * AuthProvider fetches backend profile and exposes user, role, isAdmin, loading, and refresh.
 */
export function AuthProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const abortRef = useRef(null);
  const initializedRef = useRef(false);

  const refresh = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const me = await fetchMe(controller.signal);
      setProfile(me);
    } catch {
      // swallow errors, keep profile as null
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Run once on mount
    if (!initializedRef.current) {
      initializedRef.current = true;
      refresh();
    }
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [refresh]);

  const value = useMemo(() => {
    const email =
      profile?.clerk?.email ||
      profile?.user?.email ||
      profile?.email ||
      null;
    const id =
      profile?.clerk?.id ||
      profile?.user?.id ||
      profile?._id ||
      null;
    const role =
      profile?.role ||
      profile?.user?.role ||
      (deriveAdminFromEmail(email) ? 'admin' : 'user');
    const isAdmin = role === 'admin';
    const user = (email || id) ? { id, email, name: profile?.user?.name || profile?.name } : null;

    return {
      user,
      role,
      isAdmin,
      loading,
      refresh,
      profile,
    };
  }, [profile, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// PUBLIC_INTERFACE
// useAuthContext returns current auth context value
export function useAuthContext() {
  return useContext(AuthContext);
}

export default AuthContext;
