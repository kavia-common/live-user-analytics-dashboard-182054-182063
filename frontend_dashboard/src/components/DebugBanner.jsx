import React, { useState, useEffect } from "react";
import "./DebugBanner.css";
import { wasBlockedByClient } from "../api/client";

/**
 * PUBLIC_INTERFACE
 * DebugBanner shows a non-intrusive banner when auth or connection issues are detected in dev.
 */
export default function DebugBanner() {
  const [visible, setVisible] = useState(false);
  const [issue, setIssue] = useState(null);

  useEffect(() => {
    // Check for common issues periodically
    const checkIssues = () => {
      const isBlocked = wasBlockedByClient();
      
      if (isBlocked) {
        setIssue({
          type: "blocked",
          message: "Ad blocker detected. Stats endpoints may be blocked. Using fallback data.",
          level: "warning"
        });
        setVisible(true);
      }
    };

    checkIssues();
    const interval = setInterval(checkIssues, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!visible || process.env.NODE_ENV === "production") return null;

  return (
    <div className={`debug-banner debug-banner--${issue?.level || "info"}`}>
      <div className="debug-banner__content">
        <span className="debug-banner__icon">
          {issue?.level === "error" ? "⚠️" : issue?.level === "warning" ? "⚡" : "ℹ️"}
        </span>
        <span className="debug-banner__message">{issue?.message}</span>
        <button 
          className="debug-banner__close" 
          onClick={() => setVisible(false)}
          aria-label="Close"
        >
          ×
        </button>
      </div>
    </div>
  );
}
