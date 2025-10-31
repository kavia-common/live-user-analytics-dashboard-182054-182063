import React from 'react';
import Sidebar from './components/Layout/Sidebar';
import Topbar from './components/Layout/Topbar';
import './main.css';

export default function App({ children }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div>
        <Topbar />
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
