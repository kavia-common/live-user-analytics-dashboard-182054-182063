import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { useAuth as useClerkAuth, useUser as useClerkUser } from "@clerk/clerk-react";

// PUBLIC_INTERFACE
export const AuthContext = createContext(null);

// Internal singleton to allow api client to retrieve Clerk token without circular imports
let tokenProviderRef = { current: null };

/**
 * PUBLIC_INTERFACE
 * getClerkTokenProvider returns a function that yields a fresh Clerk JWT.
 */
export function getClerkTokenProvider() {
  return tokenProviderRef.current;
}

/**
 * PUBLIC_INTERFACE
 * AuthProvider sources auth state from Clerk and augments with backend role.
 */
export function AuthProvider({ children }) {
  const { isSignedIn, getToken, signOut, isLoaded: clerkAuthLoaded } = useClerkAuth();
  const { user: clerkUser, isLoaded: clerkUserLoaded } = useClerkUser();
  const [role, setRole] = useState("user");
  const [fetchingRole, setFetchingRole] = useState(false);

  // expose token provider for API client
  useEffect(() => {
    tokenProviderRef.current = async () => {
      try {
        const t = await getToken({ template: "default" });
        // eslint-disable-next-line no-console
        console.debug("[AuthProvider] getToken ->", t ? `...(len=${String(t).length})` : "null");
        return t;
      } catch (e) {
        // eslint-disable-next-line no-console
        console.debug("[AuthProvider] getToken error", e);
        return null;
      }
    };
    return () => {
      tokenProviderRef.current = null;
    };
  }, [getToken]);

  // Fetch role from backend /api/auth/me (source of truth)
  useEffect(() => {
    const loadRole = async () => {
      if (!isSignedIn) {
        setRole("user");
        return;
      }
      setFetchingRole(true);
      try {
        // Ensure Clerk is loaded before calling backend
        const tokenCheck = await tokenProviderRef.current?.();
        // eslint-disable-next-line no-console
        console.debug("[AuthProvider] Clerk loaded:", { clerkAuthLoaded, clerkUserLoaded, hasToken: !!tokenCheck });
        const { data } = await api.get("/auth/me");
        // eslint-disable-next-line no-console
        console.debug("[AuthProvider] /api/auth/me ->", data);
        if (data?.user?.role) {
          setRole(data.user.role);
        } else {
          const adminEmails = (process.env.REACT_APP_ADMIN_EMAILS || "")
            .split(",")
            .map((s) => s.trim().toLowerCase())
            .filter(Boolean);
          const email = clerkUser?.primaryEmailAddress?.emailAddress?.toLowerCase?.();
          setRole(email && adminEmails.includes(email) ? "admin" : "user");
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.debug("[AuthProvider] /api/auth/me failed, inferring role from env", e);
        const adminEmails = (process.env.REACT_APP_ADMIN_EMAILS || "")
          .split(",")
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean);
        const email = clerkUser?.primaryEmailAddress?.emailAddress?.toLowerCase?.();
        setRole(email && adminEmails.includes(email) ? "admin" : "user");
      } finally {
        setFetchingRole(false);
      }
    };
    if (clerkAuthLoaded && clerkUserLoaded) {
      loadRole();
    } else if (process.env.NODE_ENV !== "production") {
      // Dev fallback: allow UI to render with inferred role even if Clerk hasn't fully loaded
      const adminEmails = (process.env.REACT_APP_ADMIN_EMAILS || "")
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
      const email = clerkUser?.primaryEmailAddress?.emailAddress?.toLowerCase?.();
      setRole(email && adminEmails.includes(email) ? "admin" : "user");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, clerkAuthLoaded, clerkUserLoaded]);

  const value = useMemo(
    () => ({
      isAuthenticated: !!isSignedIn,
      user: clerkUser
        ? {
            id: clerkUser.id,
            email: clerkUser.primaryEmailAddress?.emailAddress || "",
            name: clerkUser.fullName || clerkUser.username || "",
            role,
          }
        : null,
      isAdmin: role === "admin",
      loading: !clerkAuthLoaded || !clerkUserLoaded || fetchingRole,
      logout: () => signOut().catch(() => {}),
      // PUBLIC_INTERFACE
      async getToken() {
        /** Returns a fresh Clerk session JWT. */
        try {
          const t = await getToken({ template: "default" });
          return t || null;
        } catch {
          return null;
        }
      },
    }),
    [isSignedIn, clerkUser, role, fetchingRole, getToken, signOut, clerkAuthLoaded, clerkUserLoaded]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// PUBLIC_INTERFACE
export function useAuth() {
  /** Returns the auth context value. */
  return useContext(AuthContext);
}
