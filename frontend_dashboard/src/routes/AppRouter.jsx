import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import Users from '../pages/Users';
import Settings from '../pages/Settings';
import Login from '../pages/Login';
import { useAuthContext } from '../context/AuthContext';
import { useActivityTracking } from '../hooks/useActivityTracking';

/**
 * AppRouter handles top-level routing with guarded navigation that avoids loops.
 * Uses isSignedIn (derived from user presence) and current path to only navigate
 * when the destination differs, preventing circular redirects and render churn.
 */
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

export default function AppRouter() {
  const location = useLocation();
  const navigate = useNavigate();
  const { loading, user } = useAuthContext();
  const isSignedIn = !!user;

  // Temporarily keep activity tracking hook; it is internally no-op stubbed elsewhere if disabled
  useActivityTracking(true);

  useEffect(() => {
    if (loading) return;
    const path = location.pathname;

    if (isSignedIn) {
      if (path === '/login' || path === '/') {
        navigate('/dashboard', { replace: true });
      }
    } else {
      if (!path.startsWith('/login')) {
        navigate('/login', { replace: true });
      }
    }
  }, [isSignedIn, loading, navigate, location.pathname]);

  if (loading) return <LoadingScreen />;

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route
        path="/login"
        element={isSignedIn ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route
        path="/dashboard"
        element={isSignedIn ? <Dashboard /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/users"
        element={isSignedIn ? <Users /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/settings"
        element={isSignedIn ? <Settings /> : <Navigate to="/login" replace />}
      />
      <Route path="*" element={<Navigate to={isSignedIn ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
}
