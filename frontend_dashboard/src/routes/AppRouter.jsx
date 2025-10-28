import React, { useEffect } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useActivityTracking } from "../hooks/useActivityTracking";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import Dashboard from "../pages/Dashboard";
import Users from "../pages/Users";
import Settings from "../pages/Settings";
import { SignIn, SignUp, SignedIn, SignedOut, RedirectToSignIn, useAuth as useClerkAuth } from "@clerk/clerk-react";

function DebugRedirectLogger({ label }) {
  const loc = useLocation();
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.debug(`[Router:${label}] location`, { pathname: loc.pathname, search: loc.search });
  }, [loc, label]);
  return null;
}

function ProtectedRoute({ children, requireAdmin = false }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const { isLoaded } = useClerkAuth();
  const location = useLocation();

  // Wait for Clerk to load before deciding
  if (!isLoaded || loading) {
    return <div className="badge">Loading session...</div>;
  }

  if (!isAuthenticated) {
    // eslint-disable-next-line no-console
    console.debug("[ProtectedRoute] Not authenticated, redirecting to /sign-in", { from: location.pathname });
    return <RedirectToSignIn redirectUrl={window.location.pathname} />;
  }
  if (requireAdmin && !isAdmin) {
    // eslint-disable-next-line no-console
    console.debug("[ProtectedRoute] Requires admin, user is not admin -> redirect /");
    return <Navigate to="/" replace />;
  }
  return children;
}

function AppLayout({ children }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="content">
        <Header />
        <main className="main">{children}</main>
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
export default function AppRouter() {
  /** AppRouter defines all routes and guards. */
  // Enable automatic activity tracking for all route changes
  useActivityTracking();
  
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();
  const { isLoaded } = useClerkAuth();

  useEffect(() => {
    // Redirect authenticated users from auth pages to dashboard
    if (isLoaded && !loading) {
      const p = window.location.pathname;
      if (isAuthenticated && (p === "/sign-in" || p === "/sign-up")) {
        // eslint-disable-next-line no-console
        console.debug("[AppRouter] Authenticated on auth page, navigating to /");
        navigate("/", { replace: true });
      }
    }
  }, [isAuthenticated, isLoaded, loading, navigate]);

  return (
    <>
      <DebugRedirectLogger label="root" />
      <Routes>
        <Route
          path="/sign-in"
          element={
            <SignedOut>
              <div className="login-wrap">
                <div className="login-card">
                  <SignIn
                    routing="path"
                    path="/sign-in"
                    redirectUrl="/"
                    afterSignInUrl="/"
                    signUpUrl="/sign-up"
                  />
                </div>
              </div>
            </SignedOut>
          }
        />
        <Route
          path="/sign-up"
          element={
            <SignedOut>
              <div className="login-wrap">
                <div className="login-card">
                  <SignUp
                    routing="path"
                    path="/sign-up"
                    redirectUrl="/"
                    afterSignUpUrl="/"
                    signInUrl="/sign-in"
                  />
                </div>
              </div>
            </SignedOut>
          }
        />
        <Route
          path="/"
          element={
            <SignedIn>
              <ProtectedRoute>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </ProtectedRoute>
            </SignedIn>
          }
        />
        <Route
          path="/users"
          element={
            <SignedIn>
              <ProtectedRoute requireAdmin>
                <AppLayout>
                  <Users />
                </AppLayout>
              </ProtectedRoute>
            </SignedIn>
          }
        />
        <Route
          path="/settings"
          element={
            <SignedIn>
              <ProtectedRoute>
                <AppLayout>
                  <Settings />
                </AppLayout>
              </ProtectedRoute>
            </SignedIn>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <SignedOut>
        {/* Global fallback for any protected path when signed out */}
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}
