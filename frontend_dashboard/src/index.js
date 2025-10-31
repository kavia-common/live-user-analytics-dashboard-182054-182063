import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { ClerkProvider } from '@clerk/clerk-react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

function NoopClerkProvider({ children }) {
  return children;
}

// PUBLIC_INTERFACE
// initClerkProviderProps derives props for ClerkProvider from environment.
function initClerkProviderProps() {
  const publishableKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;
  const proxyUrl = process.env.REACT_APP_CLERK_PROXY_URL || undefined;

  if (!publishableKey && process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.warn(
      'REACT_APP_CLERK_PUBLISHABLE_KEY is not set. Running with NoopClerkProvider for development.'
    );
  }

  if (!publishableKey) return { ProviderComponent: NoopClerkProvider, props: {} };

  return {
    ProviderComponent: ClerkProvider,
    props: {
      publishableKey,
      proxyUrl,
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
    },
  };
}

const { ProviderComponent, props } = initClerkProviderProps();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ProviderComponent {...props}>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </ProviderComponent>
);
