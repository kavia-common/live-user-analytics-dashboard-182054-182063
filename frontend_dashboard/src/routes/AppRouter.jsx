import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import App from '../App';
import Dashboard from '../pages/Dashboard';
import Users from '../pages/Users';
import Settings from '../pages/Settings';
import SignInPage from '../pages/Auth/SignInPage';
import SignUpPage from '../pages/Auth/SignUpPage';
import ErrorBoundary from '../components/ErrorBoundary';

export default function AppRouter() {
  return (
    <Suspense
      fallback={
        <div className="centered">
          <div className="auth-card">
            <div className="skeleton" style={{ width: 280, height: 20, marginBottom: 12 }} />
            <div className="skeleton" style={{ width: 420, height: 120 }} />
          </div>
        </div>
      }
    >
      <ErrorBoundary>
        <Routes>
          <Route
            path="/"
            element={
              <>
                <SignedIn>
                  <App><Dashboard /></App>
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            }
          />
          <Route
            path="/users"
            element={
              <>
                <SignedIn>
                  <App><Users /></App>
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            }
          />
          <Route
            path="/settings"
            element={
              <>
                <SignedIn>
                  <App><Settings /></App>
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            }
          />
          <Route path="/sign-in/*" element={<SignInPage />} />
          <Route path="/sign-up/*" element={<SignUpPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ErrorBoundary>
    </Suspense>
  );
}
