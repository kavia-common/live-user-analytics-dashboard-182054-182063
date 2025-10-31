import React from "react";
import { BarChart as RBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import Card from "../ui/Card";
import "./charts.css";

/**
 * PUBLIC_INTERFACE
 * BarChart renders a responsive bar chart with theme-aware colors.
 * Handles empty/null data gracefully.
 */
export default function BarChart({ data, color = "#0D9488", xKey = "label", yKey = "value", title = "Breakdown", loading = false }) {
  const safe = Array.isArray(data) ? data : [];
  const mapped = safe.map((d) => ({
    label: d?.deviceType ? `${d.deviceType}` : d?.label || d?.name || '',
    value: Number.isFinite(d?.count) ? d.count : (Number.isFinite(d?.value) ? d.value : 0),
  }));
  const isEmpty = mapped.length === 0;

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
            <RBarChart data={mapped}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(13, 148, 136, 0.1)" />
              <XAxis
                dataKey={xKey}
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
              <Bar
                dataKey={yKey}
                fill={color}
                radius={[8, 8, 0, 0]}
              />
            </RBarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}
