import React, { useState } from "react";
import apiClient from "../api/client";
import { useAuthContext } from "../context/AuthContext";
import "./EmptyState.css";

/**
 * PUBLIC_INTERFACE
 * EmptyState displays when dashboard has no data, with seed option for admins in dev.
 */
export default function EmptyState({ onDataSeeded }) {
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState(null);
  const { isAdmin } = useAuthContext();
  const isDev = process.env.NODE_ENV !== "production";

  const handleSeed = async () => {
    setSeeding(true);
    setError(null);
    try {
      await apiClient.post("/activities/seed");
      // eslint-disable-next-line no-console
      console.log("[EmptyState] Sample data seeded successfully");
      // Give backend a moment to process
      setTimeout(() => {
        setSeeding(false);
        if (onDataSeeded) onDataSeeded();
      }, 1000);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to seed data. Check backend logs.");
      setSeeding(false);
      // eslint-disable-next-line no-console
      console.error("[EmptyState] Seed failed:", err);
    }
  };

  return (
    <div className="empty-state">
      <div className="empty-state__content">
        <div className="empty-state__icon">📊</div>
        <h2 className="empty-state__title">No Activity Data Yet</h2>
        <p className="empty-state__description">
          Your dashboard is ready! Start by navigating through the app to generate activity events,
          or wait for users to interact with your application.
        </p>
        
        {isDev && isAdmin && (
          <div className="empty-state__actions">
            <button 
              className="empty-state__seed-btn"
              onClick={handleSeed}
              disabled={seeding}
            >
              {seeding ? "Seeding..." : "🌱 Generate Sample Data"}
            </button>
            <p className="empty-state__hint">
              Click to create sample sessions and activity events (dev/admin only)
            </p>
          </div>
        )}

        {error && (
          <div className="empty-state__error">
            <span className="empty-state__error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {!isDev && (
          <div className="empty-state__production-hint">
            <p>💡 Activity will appear here once users start interacting with your app.</p>
          </div>
        )}
      </div>
    </div>
  );
}
