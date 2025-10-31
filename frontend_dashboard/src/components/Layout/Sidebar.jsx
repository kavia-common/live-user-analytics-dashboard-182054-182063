import React from 'react';
import { NavLink } from 'react-router-dom';

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand" style={{ marginBottom: 12 }}>
        <div className="brand-badge">UA</div>
        Violet Dreams
      </div>
      <nav className="nav">
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : undefined)}>
          <span>📊</span> Dashboard
        </NavLink>
        <NavLink to="/users" className={({ isActive }) => (isActive ? 'active' : undefined)}>
          <span>👥</span> Users
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => (isActive ? 'active' : undefined)}>
          <span>⚙️</span> Settings
        </NavLink>
      </nav>
      <div style={{ marginTop: 18 }} className="small">
        <div className="badge">Realtime</div> updates via Socket.io
      </div>
    </aside>
  );
}
