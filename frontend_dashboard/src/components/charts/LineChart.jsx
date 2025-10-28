import React from "react";
import { LineChart as RLineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

// PUBLIC_INTERFACE
export default function LineChart({ data, color = "#7C3AED" }) {
  /** Renders a responsive line chart. */
  const formatted = (data || []).map(d => ({ ...d, tsLabel: new Date(d.ts).toLocaleTimeString() }));
  return (
    <div className="card">
      <h3>Events over time</h3>
      <div style={{ width: "100%", height: 260 }}>
        <ResponsiveContainer>
          <RLineChart data={formatted}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
            <XAxis dataKey="tsLabel" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke={color} strokeWidth={2} dot={false} />
          </RLineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
