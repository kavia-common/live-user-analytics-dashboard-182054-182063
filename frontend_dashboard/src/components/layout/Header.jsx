import React from "react";
import { useAuth } from "../../context/AuthContext";

export default function Header() {
  const { user, logout } = useAuth();
  return (
    <header className="header">
      <input className="search" placeholder="Search (stub)..." />
      <div className="user">
        <span className="badge">{user?.email || "Account"}</span>
        <button className="btn ghost" onClick={logout}>Logout</button>
      </div>
    </header>
  );
}
