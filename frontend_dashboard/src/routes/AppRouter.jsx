import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { SignedOut } from '@clerk/clerk-react';
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
  if (!user) return <div style={{ padding: 24 }}><LoadingScreen /></div>;
  if (requireAdmin && !isAdmin) {
    return <div style={{ padding: 24 }}>You do not have access to this page.</div>;
  }
  return children;
}

function NotFound() {
  return (
    <div style={{ display: 'grid', placeItems: 'center', height: '100vh', color: '#6b7280' }}>
      <div>
        <div style={{ fontSize: 20, fontWeight: 700 }}>404 - Not Found</div>
        <div style={{ fontSize: 14, marginTop: 6 }}>The page you are looking for doesn’t exist.</div>
      </div>
    </div>
  );
}

export default function AppRouter() {
  useActivityTracking();

  return (
    <Routes>
      {/* Public login route: show login only when signed out */}
      <Route
        path="/login"
        element={
          <SignedOut>
            <Login />
          </SignedOut>
        }
      />
      {/* Authenticated routes */}
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
      {/* Catch-all 404 without redirects */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
