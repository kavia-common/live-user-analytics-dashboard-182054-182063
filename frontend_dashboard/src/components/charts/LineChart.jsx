import React from "react";
import { LineChart as RLineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import Card from "../ui/Card";
import "./charts.css";

/**
 * PUBLIC_INTERFACE
 * LineChart renders a responsive line chart with theme-aware colors.
 * Handles empty/null data gracefully.
 */
export default function LineChart({ data, color = "#7C3AED", title = "Events over time", loading = false }) {
  const safe = Array.isArray(data) ? data : [];
  const formatted = safe.map(d => ({
    ...d,
    tsLabel: d?.ts ? new Date(d.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : d?.label || '',
    count: Number.isFinite(d?.count) ? d.count : 0,
  }));
  const isEmpty = formatted.length === 0;

  return (
    <Card className="chart-card" gradient padding="lg">
      <h3 className="chart-card__title">{title}</h3>
      <div style={{ width: "100%", height: 280, display: 'grid', placeItems: 'center' }}>
        {loading ? (
          <div className="chart-skeleton" style={{ width: '100%', height: '100%', borderRadius: 8 }} />
        ) : isEmpty ? (
          <div style={{ color: 'var(--text-secondary)' }}>No data to display.</div>
        ) : (
          <ResponsiveContainer>
            <RLineChart data={formatted}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(124, 58, 237, 0.1)" />
              <XAxis
                dataKey="tsLabel"
                stroke="var(--text-muted)"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke="var(--text-muted)"
                style={{ fontSize: '12px' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)'
                }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke={color}
                strokeWidth={3}
                dot={{ fill: color, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </RLineChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}
