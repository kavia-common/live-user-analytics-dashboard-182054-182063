import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import Users from "../pages/Users";
import Settings from "../pages/Settings";

function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, isAdmin } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (requireAdmin && !isAdmin) return <Navigate to="/" replace />;
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
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={<Login />}
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute requireAdmin>
              <AppLayout>
                <Users />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Settings />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
