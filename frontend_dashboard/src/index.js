import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { ClerkProvider } from '@clerk/clerk-react';

// Wrap app with ClerkProvider using publishable key from env
const PUBLISHABLE_KEY = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  // eslint-disable-next-line no-console
  console.warn('REACT_APP_CLERK_PUBLISHABLE_KEY is not set. Clerk UI will not function until configured.');
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ClerkProvider
    publishableKey={PUBLISHABLE_KEY}
    navigate={(to) => {
      try {
        // Centralized navigation for Clerk hosted components
        window.history.pushState(null, '', to);
        window.dispatchEvent(new PopStateEvent('popstate'));
      } catch (e) {
        // eslint-disable-next-line no-console
        console.debug('[ClerkProvider:navigate] fallback replace to', to, e);
        window.location.replace(to);
      }
    }}
  >
    <App />
  </ClerkProvider>
);
