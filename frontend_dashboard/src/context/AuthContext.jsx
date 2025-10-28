import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, setAuthToken } from "../api/client";

// PUBLIC_INTERFACE
export const AuthContext = createContext(null);

/**
 * PUBLIC_INTERFACE
 * AuthProvider wraps the app with auth state and methods.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      setAuthToken(data.token);
      setUser(data.user);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e?.response?.data?.error || "Login failed" };
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email, password, name) => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/signup", { email, password, name });
      setAuthToken(data.token);
      setUser(data.user);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e?.response?.data?.error || "Signup failed" };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
  };

  const fetchMe = async () => {
    try {
      const { data } = await api.get("/auth/me");
      if (data?.user) {
        setUser(data.user);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token && !user) {
      fetchMe();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAdmin: user?.role === "admin",
      login,
      signup,
      logout,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// PUBLIC_INTERFACE
export function useAuth() {
  /** Returns the auth context value. */
  return useContext(AuthContext);
}
