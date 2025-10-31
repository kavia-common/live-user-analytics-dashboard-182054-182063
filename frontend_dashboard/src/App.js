import React, { useEffect, useState } from "react";
import "./App.css";
import AppRouter from "./routes/AppRouter.jsx";
import { applyTheme, getStoredTheme, storeTheme } from "./utils/theme";

/**
 * PUBLIC_INTERFACE
 * Root App component that renders the application router and handles theme.
 */
function App() {
  const [theme, setTheme] = useState(getStoredTheme());

  useEffect(() => {
    applyTheme(theme);
    storeTheme(theme);
  }, [theme]);

  return (
    <div className={`App theme-${theme}`}>
      <AppRouter />
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
