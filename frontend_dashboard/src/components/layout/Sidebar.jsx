import React from "react";
import { NavLink } from "react-router-dom";

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-badge" />
        <span>User Analytics</span>
      </div>
      <nav className="nav">
        <NavLink to="/" end>
          <span>📊</span> <span>Dashboard</span>
        </NavLink>
        <NavLink to="/users">
          <span>👥</span> <span>Users</span>
        </NavLink>
        <NavLink to="/settings">
          <span>⚙️</span> <span>Settings</span>
        </NavLink>
      </nav>
    </aside>
  );
}
