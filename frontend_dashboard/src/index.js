import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './main.css';
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import AppRouter from './routes/AppRouter';
import ErrorBoundary from './components/ErrorBoundary';

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
    {PUBLISHABLE_KEY ? (
      <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
        <BrowserRouter>
          <ErrorBoundary>
            <AppRouter />
          </ErrorBoundary>
        </BrowserRouter>
      </ClerkProvider>
    ) : (
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          padding: 24,
          background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(243,244,246,1))',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 720,
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 10px 25px rgba(0,0,0,0.06)',
            border: '1px solid rgba(0,0,0,0.06)',
            padding: 20,
          }}
        >
          <h2 style={{ marginTop: 0 }}>Configuration required</h2>
          <p style={{ marginBottom: 12 }}>
            Clerk authentication is not configured. Please set the environment variable
            <code style={{ marginLeft: 6, marginRight: 6 }}>REACT_APP_CLERK_PUBLISHABLE_KEY</code>
            and redeploy.
          </p>
          <p style={{ marginTop: 0, color: '#374151' }}>
            Alternatively, provide a runtime config object before the bundle:
          </p>
          <pre
            style={{
              margin: 0,
              padding: 12,
              background: '#F9FAFB',
              borderRadius: 8,
              overflowX: 'auto',
              fontSize: 12,
              color: '#6B7280',
            }}
          >{`<script>
  window.__CONFIG__ = {
    REACT_APP_CLERK_PUBLISHABLE_KEY: "pk_live_xxx",
    API_URL: "https://your-backend.example.com/api",
    SOCKET_URL: "https://your-backend.example.com",
    SOCKET_PATH: "/socket.io"
  };
</script>`}</pre>
        </div>
      </div>
    )}
  </React.StrictMode>
);
