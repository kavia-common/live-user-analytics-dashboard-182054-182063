import React from "react";
import { useAuthContext } from "../../context/AuthContext";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import "./Header.css";

// PUBLIC_INTERFACE
export default function Header() {
  /** Header component with search, user info, and logout button. */
  const { user, signOut } = useAuthContext();

  return (
    <header className="header">
      <input 
        className="search" 
        placeholder="Search analytics..." 
        aria-label="Search"
      />
      <div className="user">
        <Badge variant="primary" icon="👤">
          {user?.email || "Account"}
        </Badge>
        <Button variant="ghost" size="sm" onClick={signOut}>
          Logout
        </Button>
      </div>
    </header>
  );
}
