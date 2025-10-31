import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { ClerkProvider } from '@clerk/clerk-react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// In development, allow app to render without Clerk publishable key by using a no-op provider.
function NoopClerkProvider({ children }) {
  return children;
}

/**
 * Wrap app with ClerkProvider using publishable key from env and provide AuthProvider.
 */
const PUBLISHABLE_KEY = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;
const CLERK_PROXY_URL = process.env.REACT_APP_CLERK_PROXY_URL || undefined;

if (!PUBLISHABLE_KEY && process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line no-console
  console.warn('REACT_APP_CLERK_PUBLISHABLE_KEY is not set. Running with NoopClerkProvider for development.');
}

const ProviderComponent = PUBLISHABLE_KEY ? ClerkProvider : NoopClerkProvider;

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ProviderComponent
    {...(PUBLISHABLE_KEY
      ? {
          publishableKey: PUBLISHABLE_KEY,
          proxyUrl: CLERK_PROXY_URL,
          navigate: (to) => {
            try {
              window.history.pushState(null, '', to);
              window.dispatchEvent(new PopStateEvent('popstate'));
            } catch (e) {
              // eslint-disable-next-line no-console
              console.debug('[ClerkProvider:navigate] fallback replace to', to, e);
              window.location.replace(to);
            }
          },
          afterSignInUrl: '/',
          afterSignUpUrl: '/',
        }
      : {})}
  >
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </ProviderComponent>
);
