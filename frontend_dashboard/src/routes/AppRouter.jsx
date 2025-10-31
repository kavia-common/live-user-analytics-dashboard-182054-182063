import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SignedIn, SignedOut } from '@clerk/clerk-react';
import Dashboard from '../pages/Dashboard';
import Users from '../pages/Users';
import Settings from '../pages/Settings';
import Login from '../pages/Login';
import { useAuthContext } from '../context/AuthContext';
import { useActivityTracking } from '../hooks/useActivityTracking';

function LoadingScreen() {
  return (
    <div style={{ display: 'grid', placeItems: 'center', height: '100vh', color: '#6b7280' }}>
      <div>
        <div style={{ fontSize: 18, fontWeight: 600 }}>Loading...</div>
        <div style={{ fontSize: 14, marginTop: 6 }}>Preparing your dashboard</div>
      </div>
    </div>
  );
}

function ProtectedRoute({ children, requireAdmin = false }) {
  const { loading, user, isAdmin } = useAuthContext();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (requireAdmin && !isAdmin) return <Navigate to="/" replace />;
  return children;
}

export default function AppRouter() {
  const { loading } = useAuthContext();
  useActivityTracking();

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            <>
              <SignedOut>
                <Login />
              </SignedOut>
              <SignedIn>
                <Navigate to="/" replace />
              </SignedIn>
            </>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute requireAdmin>
              <Users />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to={loading ? '/login' : '/'} replace />} />
      </Routes>
    </Router>
  );
}
