import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import { AuthProvider } from './context/AuthContext';

// PUBLIC_INTERFACE
// Entrypoint: Mounts a single ClerkProvider and a single BrowserRouter around the app.
const PUBLISHABLE_KEY = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  // Fail fast with a clear error to avoid rendering without a ClerkProvider.
  // Ensure the env var REACT_APP_CLERK_PUBLISHABLE_KEY is set in the environment.
  // Note: We do not read or write .env here per project guidelines.
  // eslint-disable-next-line no-console
  console.error('Missing REACT_APP_CLERK_PUBLISHABLE_KEY environment variable. Clerk requires a publishable key.');
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ClerkProvider
    publishableKey={PUBLISHABLE_KEY}
    afterSignInUrl="/"
    afterSignUpUrl="/"
  >
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </ClerkProvider>
);
