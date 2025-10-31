import React, { useState, useEffect } from "react";
import "./DebugBanner.css";

/**
 * PUBLIC_INTERFACE
 * DebugBanner shows a non-intrusive banner in development.
 * Currently displays nothing by default; can be extended to watch other app signals.
 */
export default function DebugBanner() {
  const [visible, setVisible] = useState(false);
  const [issue, setIssue] = useState(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      // Placeholder: no automatic checks for now.
      // To manually show in development, setVisible(true) and set an issue message.
      // setIssue({ type: "info", message: "Development mode active.", level: "info" });
      // setVisible(true);
    }
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
