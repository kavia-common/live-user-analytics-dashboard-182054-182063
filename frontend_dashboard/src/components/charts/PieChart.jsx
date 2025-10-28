import React from "react";
import { PieChart as RPieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = ["#7C3AED", "#0D9488", "#F59E0B", "#10B981", "#EC4899", "#3B82F6", "#EF4444", "#8B5CF6"];

// PUBLIC_INTERFACE
export default function PieChart({ data, title = "Locations" }) {
  /** Renders a responsive pie chart. */
  const formatted = (data || []).map((d) => ({ name: d.country || d.label || "unknown", value: d.count ?? d.value }));
  return (
    <div className="card">
      <h3>{title}</h3>
      <div style={{ width: "100%", height: 260 }}>
        <ResponsiveContainer>
          <RPieChart>
            <Pie data={formatted} cx="50%" cy="50%" outerRadius={96} dataKey="value" nameKey="name" label>
              {formatted.map((_, i) => (
                <Cell key={`c-${i}`} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </RPieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
