import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { applyTheme, getStoredTheme, storeTheme } from "../utils/theme";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Switch from "../components/ui/Switch";
import "./Settings.css";

// PUBLIC_INTERFACE
export default function Settings() {
  /** Settings page with user profile and theme toggle. */
  const { user } = useAuth();
  const [mode, setMode] = useState(getStoredTheme());

  useEffect(() => {
    applyTheme(mode);
    storeTheme(mode);
  }, [mode]);

  const toggleTheme = () => {
    setMode(prev => prev === "light" ? "dark" : "light");
  };

  return (
    <div className="settings">
      <header className="settings__header">
        <h1 className="settings__title">Settings</h1>
        <p className="settings__subtitle">Manage your preferences</p>
      </header>

      <Card className="settings__card" gradient padding="lg">
        <h3 className="settings__section-title">Profile Information</h3>
        <div className="settings__grid">
          <div className="settings__field">
            <label className="settings__label">Email</label>
            <div className="settings__value">{user?.email}</div>
          </div>
          <div className="settings__field">
            <label className="settings__label">Name</label>
            <div className="settings__value">{user?.name || "Not set"}</div>
          </div>
          <div className="settings__field">
            <label className="settings__label">Role</label>
            <Badge variant={user?.role === "admin" ? "primary" : "default"}>
              {user?.role}
            </Badge>
          </div>
        </div>
      </Card>

      <Card className="settings__card" gradient padding="lg">
        <h3 className="settings__section-title">Appearance</h3>
        <div className="settings__field settings__field--row">
          <div>
            <label className="settings__label">Theme</label>
            <p className="settings__description">
              Choose between light and dark mode
            </p>
          </div>
          <Switch 
            checked={mode === "dark"} 
            onChange={toggleTheme}
            aria-label="Toggle dark mode"
          />
        </div>
        <div className="settings__theme-preview">
          <span className="settings__theme-indicator" style={{ background: 'var(--primary)' }} />
          <span className="settings__theme-indicator" style={{ background: 'var(--secondary)' }} />
          <span className="settings__theme-indicator" style={{ background: 'var(--success)' }} />
          <span className="settings__theme-indicator" style={{ background: 'var(--error)' }} />
        </div>
      </Card>
    </div>
  );
}
