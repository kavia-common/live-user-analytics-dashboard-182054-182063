import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { ClerkProvider } from '@clerk/clerk-react';
import { BrowserRouter } from 'react-router-dom';

/**
 * Wrap app with ClerkProvider using publishable key from env.
 * If Clerk is not configured in development, the UI will still render and API calls will
 * fall back to unauthenticated dev mocks for core dashboard views.
 */
const PUBLISHABLE_KEY = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;
const CLERK_PROXY_URL = process.env.REACT_APP_CLERK_PROXY_URL || undefined;
// Optional Clerk appearance or domain could be set via env without hardcoding

if (!PUBLISHABLE_KEY) {
  // eslint-disable-next-line no-console
  console.warn('REACT_APP_CLERK_PUBLISHABLE_KEY is not set. Clerk UI will not function until configured.');
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ClerkProvider
    publishableKey={PUBLISHABLE_KEY}
    proxyUrl={CLERK_PROXY_URL}
    navigate={(to) => {
      try {
        // Centralized navigation for Clerk hosted components.
        // Prefer Router-aware method by dispatching a popstate after pushState.
        window.history.pushState(null, '', to);
        window.dispatchEvent(new PopStateEvent('popstate'));
      } catch (e) {
        // eslint-disable-next-line no-console
        console.debug('[ClerkProvider:navigate] fallback replace to', to, e);
        window.location.replace(to);
      }
    }}
    // After sign in/sign up, Clerk will route to dashboard (root path).
    afterSignInUrl="/"
    afterSignUpUrl="/"
  >
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ClerkProvider>
);
