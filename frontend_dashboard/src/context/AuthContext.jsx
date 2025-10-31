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
    // Our backend exposes /api/auth/me (proxied by REACT_APP_API_URL base)
    const res = await api.get('/api/auth/me', { signal });
    return res?.data || null;
  } catch {
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

  const refresh = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const me = await fetchMe(controller.signal);
      setProfile(me);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
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
