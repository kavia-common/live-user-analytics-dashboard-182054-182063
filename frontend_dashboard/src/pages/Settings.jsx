import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { applyTheme, getStoredTheme, storeTheme } from "../utils/theme";

export default function Settings() {
  const { user } = useAuth();
  const [mode, setMode] = useState(getStoredTheme());

  useEffect(() => {
    applyTheme(mode);
    storeTheme(mode);
  }, [mode]);

  return (
    <div className="card">
      <h3>Settings</h3>
      <div style={{ display: "grid", gap: 12 }}>
        <div><strong>Email:</strong> {user?.email}</div>
        <div><strong>Role:</strong> <span className="badge">{user?.role}</span></div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <strong>Theme:</strong>
          <button className="btn ghost" onClick={() => setMode("light")} disabled={mode === "light"}>Light</button>
          <button className="btn ghost" onClick={() => setMode("dark")} disabled={mode === "dark"}>Dark</button>
        </div>
      </div>
    </div>
  );
}
