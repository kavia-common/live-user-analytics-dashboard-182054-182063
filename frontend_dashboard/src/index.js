import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Try to require ClerkProvider; if unavailable, use a Noop provider
let ProviderComponent = React.Fragment;
let providerProps = {};
try {
  // eslint-disable-next-line global-require
  const { ClerkProvider } = require('@clerk/clerk-react');
  const publishableKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;
  if (ClerkProvider && publishableKey) {
    ProviderComponent = ClerkProvider;
    providerProps = {
      publishableKey,
      afterSignInUrl: '/',
      afterSignUpUrl: '/',
      navigate: (to) => {
        try {
          window.history.pushState(null, '', to);
          window.dispatchEvent(new PopStateEvent('popstate'));
        } catch {
          window.location.assign(to);
        }
      },
    };
  }
} catch {
  // no clerk installed, continue with fragment provider
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ProviderComponent {...providerProps}>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </ProviderComponent>
);
