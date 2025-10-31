import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './main.css';
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import AppRouter from './routes/AppRouter';

/**
 * Provide a minimal runtime config shim so downstream code can safely read window.__CONFIG__.
 * Hosting can override by injecting <script>window.__CONFIG__={...}</script> before the bundle.
 */
(function ensureRuntimeConfigShim() {
  if (typeof window !== 'undefined') {
    window.__CONFIG__ = window.__CONFIG__ || {};
  }
})();

const PUBLISHABLE_KEY =
  process.env.REACT_APP_CLERK_PUBLISHABLE_KEY ||
  process.env.REACT_APP_REACT_APP_CLERK_PUBLISHABLE_KEY ||
  (typeof window !== 'undefined' && (window.__CONFIG__.REACT_APP_CLERK_PUBLISHABLE_KEY || window.__CONFIG__.CLERK_PUBLISHABLE_KEY)) ||
  '';

if (!PUBLISHABLE_KEY) {
  console.warn('CLERK publishable key missing. Set REACT_APP_CLERK_PUBLISHABLE_KEY to enable authentication.');
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </ClerkProvider>
  </React.StrictMode>
);
