import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './main.css';
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import AppRouter from './routes/AppRouter';

const PUBLISHABLE_KEY =
  process.env.REACT_APP_CLERK_PUBLISHABLE_KEY ||
  process.env.REACT_APP_REACT_APP_CLERK_PUBLISHABLE_KEY ||
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
