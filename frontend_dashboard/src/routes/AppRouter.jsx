import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SignedIn, SignedOut, SignUp } from '@clerk/clerk-react';
import Dashboard from '../pages/Dashboard';
import Users from '../pages/Users';
import Settings from '../pages/Settings';
import Login from '../pages/Login';
import '../styles/theme.css';

/**
 * PUBLIC_INTERFACE
 * AppRouter defines application routing and uses Clerk auth guards.
 * - /login: visible when SignedOut, redirects to /dashboard when SignedIn
 * - /sign-up: optional sign up route visible when SignedOut
 * - Protected routes (/dashboard, /users, /settings) require SignedIn
 */
export default function AppRouter() {
  return (
    <Router>
      <Routes>
        {/* Login route */}
        <Route
          path="/login"
          element={
            <>
              <SignedIn>
                <Navigate to="/dashboard" replace />
              </SignedIn>
              <SignedOut>
                <Login />
              </SignedOut>
            </>
          }
        />
        {/* Optional sign-up route */}
        <Route
          path="/sign-up"
          element={
            <>
              <SignedIn>
                <Navigate to="/dashboard" replace />
              </SignedIn>
              <SignedOut>
                <div
                  style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(243,244,246,1))',
                    padding: '2rem',
                  }}
                >
                  <div style={{ padding: '1rem', borderRadius: '16px', backdropFilter: 'blur(8px)' }}>
                    <SignUp routing="path" path="/sign-up" signInUrl="/login" />
                  </div>
                </div>
              </SignedOut>
            </>
          }
        />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <SignedIn>
              <Dashboard />
            </SignedIn>
          }
        />
        <Route
          path="/users"
          element={
            <SignedIn>
              <Users />
            </SignedIn>
          }
        />
        <Route
          path="/settings"
          element={
            <SignedIn>
              <Settings />
            </SignedIn>
          }
        />

        {/* Root and fallback */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}
