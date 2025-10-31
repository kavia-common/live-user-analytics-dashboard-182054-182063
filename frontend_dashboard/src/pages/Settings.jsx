import React, { useEffect, useState } from "react";
import { useAuthContext } from "../context/AuthContext";
import { trackPageView } from "../utils/activity";
import { applyTheme, getStoredTheme, storeTheme } from "../utils/theme";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Switch from "../components/ui/Switch";
import "./Settings.css";

// PUBLIC_INTERFACE
export default function Settings() {
  // Settings page with user profile (Clerk + backend role) and theme toggle
  const { user, role, profile, loading } = useAuthContext();
  const [mode, setMode] = useState(getStoredTheme() || 'light');

  useEffect(() => {
    applyTheme(mode);
    storeTheme(mode);
  }, [mode]);

  useEffect(() => {
    trackPageView("/settings");
  }, []);

  const toggleTheme = () => {
    setMode((prev) => (prev === "light" ? "dark" : "light"));
  };

  if (loading) {
    return (
      <div className="settings">
        <Card className="settings__card" padding="lg">
          <div className="settings__loading">Loading settings...</div>
        </Card>
      </div>
    );
  }

  const email = profile?.clerk?.email || profile?.user?.email || user?.email || "-";
  const name = profile?.clerk?.fullName || profile?.user?.name || user?.name || "-";
  const clerkId = profile?.clerk?.id;

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
            <div className="settings__value">{email}</div>
          </div>
          <div className="settings__field">
            <label className="settings__label">Name</label>
            <div className="settings__value">{name}</div>
          </div>
          <div className="settings__field">
            <label className="settings__label">Role</label>
            <Badge variant={role === "admin" ? "primary" : "default"}>{role || "user"}</Badge>
          </div>
          {clerkId && (
            <div className="settings__field">
              <label className="settings__label">Clerk ID</label>
              <div className="settings__value">{clerkId}</div>
            </div>
          )}
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
