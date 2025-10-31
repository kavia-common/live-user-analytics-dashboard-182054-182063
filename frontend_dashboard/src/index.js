import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import { AuthProvider } from './context/AuthContext';

// PUBLIC_INTERFACE
// Entrypoint: Mounts ClerkProvider around the app with routing enabled.
// Reads Clerk publishable key from environment.
const PUBLISHABLE_KEY =
  // Standard CRA variable
  process.env.REACT_APP_CLERK_PUBLISHABLE_KEY ||
  // Some orchestrators may map namespaced vars into plain CRA env
  process.env.REACT_APP_REACT_APP_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  // Helpful warning to aid debugging during setup without breaking the app.
  // Ensure REACT_APP_CLERK_PUBLISHABLE_KEY is set in the environment (.env).
  // eslint-disable-next-line no-console
  console.warn(
    'Warning: REACT_APP_CLERK_PUBLISHABLE_KEY is not set. Clerk authentication will not function correctly.'
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} navigate={(to) => window.history.pushState(null, '', to)}>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ClerkProvider>
  </React.StrictMode>
);
