import React from "react";

// PUBLIC_INTERFACE
export default function StatCard({ title, value, trend }) {
  /** Displays a KPI value with optional trend badge. */
  return (
    <div className="card">
      <h3>{title}</h3>
      <div className="value">{value}</div>
      {trend != null && <div className="badge">Last hour: {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}%</div>}
    </div>
  );
}
