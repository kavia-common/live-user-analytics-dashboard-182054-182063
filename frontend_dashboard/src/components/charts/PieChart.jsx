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
 */
export default function PieChart({ data, title = "Locations" }) {
  const formatted = (data || []).map((d) => ({ 
    name: d.country || d.label || "unknown", 
    value: d.count ?? d.value 
  }));

  return (
    <Card className="chart-card" gradient padding="lg">
      <h3 className="chart-card__title">{title}</h3>
      <div style={{ width: "100%", height: 280 }}>
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
      </div>
    </Card>
  );
}
