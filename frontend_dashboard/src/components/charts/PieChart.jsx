import React from "react";
import { PieChart as RPieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import Card from "../ui/Card";
import "./charts.css";

const VIOLET_DREAMS_COLORS = [
  "#7C3AED", // primary
  "#0D9488", // secondary
  "#9333EA", // purple variant
  "#14B8A6", // teal variant
  "#A855F7", // light purple
  "#10B981", // green
  "#3B82F6", // blue
  "#EC4899"  // pink
];

/**
 * PUBLIC_INTERFACE
 * PieChart renders a responsive pie chart with Violet Dreams color palette.
 * Handles empty/null data gracefully.
 */
export default function PieChart({ data, title = "Locations", loading = false }) {
  const safe = Array.isArray(data) ? data : [];
  const formatted = safe.map((d) => ({
    name: d?.country || d?.label || d?.name || "unknown",
    value: Number.isFinite(d?.count) ? d.count : (Number.isFinite(d?.value) ? d.value : 0),
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
            <RPieChart>
              <Pie
                data={formatted}
                cx="50%"
                cy="50%"
                outerRadius={90}
                dataKey="value"
                nameKey="name"
                label={(entry) => entry.name}
                labelLine={{ stroke: 'var(--text-muted)', strokeWidth: 1 }}
              >
                {formatted.map((_, i) => (
                  <Cell key={`c-${i}`} fill={VIOLET_DREAMS_COLORS[i % VIOLET_DREAMS_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)'
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                wrapperStyle={{ fontSize: '12px' }}
              />
            </RPieChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}
