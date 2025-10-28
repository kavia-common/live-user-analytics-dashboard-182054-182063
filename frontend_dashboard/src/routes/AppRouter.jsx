import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import Dashboard from "../pages/Dashboard";
import Users from "../pages/Users";
import Settings from "../pages/Settings";
import { SignIn, SignUp } from "@clerk/clerk-react";

function ProtectedRoute({ children, requireAdmin = false }) {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated) return <Navigate to="/sign-in" replace />;
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
        <Route path="/sign-in" element={
          <div className="login-wrap"><div className="login-card"><SignIn routing="path" path="/sign-in" /></div></div>
        } />
        <Route path="/sign-up" element={
          <div className="login-wrap"><div className="login-card"><SignUp routing="path" path="/sign-up" /></div></div>
        } />
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
