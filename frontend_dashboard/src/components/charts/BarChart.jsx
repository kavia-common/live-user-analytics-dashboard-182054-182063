import React from "react";
import { BarChart as RBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

// PUBLIC_INTERFACE
export default function BarChart({ data, color = "#0D9488", xKey = "label", yKey = "value", title = "Breakdown" }) {
  /** Renders a responsive bar chart. */
  const mapped = (data || []).map((d) => ({ label: d.deviceType ? `${d.deviceType}` : d.label, value: d.count ?? d.value }));
  return (
    <div className="card">
      <h3>{title}</h3>
      <div style={{ width: "100%", height: 260 }}>
        <ResponsiveContainer>
          <RBarChart data={mapped}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            <Bar dataKey={yKey} fill={color} radius={[6, 6, 0, 0]} />
          </RBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
