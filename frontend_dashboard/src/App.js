import React, { useEffect, useMemo, useState } from "react";
import "./App.css";
import AppRouter from "./routes/AppRouter.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { applyTheme, getStoredTheme, storeTheme } from "./utils/theme";
import { wasBlockedByClient } from "./api/client";

// PUBLIC_INTERFACE
function App() {
  const [theme, setTheme] = useState(getStoredTheme());

  useEffect(() => {
    applyTheme(theme);
    storeTheme(theme);
  }, [theme]);

  const [showBlockBanner, setShowBlockBanner] = useState(false);

  useEffect(() => {
    const i = setInterval(() => {
      if (wasBlockedByClient()) {
        setShowBlockBanner(true);
        clearInterval(i);
      }
    }, 500);
    return () => clearInterval(i);
  }, []);

  return (
    <div className={`App theme-${theme}`}>
      <AuthProvider>
        {showBlockBanner && (
          <div
            role="status"
            aria-live="polite"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              background: "linear-gradient(90deg, #fde68a, #fca5a5)",
              color: "#111827",
              padding: "8px 14px",
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              zIndex: 1000,
              borderBottom: "1px solid rgba(0,0,0,0.1)",
            }}
          >
            <span>
              Some API requests appear to be blocked by a browser extension (e.g., ad blocker).
              If charts don't load, disable the extension for this site or use a different path via REACT_APP_API_URL.
            </span>
            <button className="btn ghost" onClick={() => setShowBlockBanner(false)}>Dismiss</button>
          </div>
        )}
        <AppRouter />
      </AuthProvider>
      <button
        className="theme-fab"
        onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
        aria-label="Toggle dark mode"
        title="Toggle dark mode"
      >
        {theme === "light" ? "🌙" : "☀️"}
      </button>
    </div>
  );
}

export default App;
