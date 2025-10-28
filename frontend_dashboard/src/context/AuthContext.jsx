import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api/client";
import { useAuth as useClerkAuth, useUser as useClerkUser, SignOutButton } from "@clerk/clerk-react";

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
  const { isSignedIn, getToken, signOut } = useClerkAuth();
  const { user: clerkUser, isLoaded } = useClerkUser();
  const [role, setRole] = useState("user");
  const [fetchingRole, setFetchingRole] = useState(false);

  // expose token provider for API client
  useEffect(() => {
    tokenProviderRef.current = async () => {
      try {
        // default template
        return await getToken({ template: "default" });
      } catch {
        return null;
      }
    };
    return () => { tokenProviderRef.current = null; };
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
        const { data } = await api.get("/auth/me");
        if (data?.user?.role) {
          setRole(data.user.role);
        } else {
          // fallback: infer from ADMIN_EMAILS env (client-only gating)
          const adminEmails = (process.env.REACT_APP_ADMIN_EMAILS || "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
          const email = clerkUser?.primaryEmailAddress?.emailAddress?.toLowerCase?.();
          setRole(email && adminEmails.includes(email) ? "admin" : "user");
        }
      } catch {
        // fallback if backend not reachable
        const adminEmails = (process.env.REACT_APP_ADMIN_EMAILS || "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
        const email = clerkUser?.primaryEmailAddress?.emailAddress?.toLowerCase?.();
        setRole(email && adminEmails.includes(email) ? "admin" : "user");
      } finally {
        setFetchingRole(false);
      }
    };
    loadRole();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, isLoaded]);

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
      loading: !isLoaded || fetchingRole,
      logout: () => signOut().catch(() => {}),
      // PUBLIC_INTERFACE
      async getToken() {
        /** Returns a fresh Clerk session JWT. */
        try {
          return await getToken({ template: "default" });
        } catch {
          return null;
        }
      },
    }),
    [isSignedIn, isLoaded, clerkUser, role, fetchingRole, getToken, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// PUBLIC_INTERFACE
export function useAuth() {
  /** Returns the auth context value. */
  return useContext(AuthContext);
}
