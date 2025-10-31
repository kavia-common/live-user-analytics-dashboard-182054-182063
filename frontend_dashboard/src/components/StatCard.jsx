import React from "react";
import Card from "./ui/Card";
import Badge from "./ui/Badge";
import "./StatCard.css";

/**
 * PUBLIC_INTERFACE
 * StatCard displays a KPI value with optional trend, icon, and gradient accent.
 * Handles loading and empty states gracefully.
 */
export default function StatCard({
  title,
  value,
  trend,
  icon = "📊",
  change,
  loading = false,
  placeholder = "—",
}) {
  const trendValue = trend ?? change;
  const isPositive = trendValue != null && trendValue >= 0;

  const isEmpty = value === null || value === undefined || value === "" || Number.isNaN(value);

  const renderValue = () => {
    if (loading) return <span className="stat-card__skeleton" />;
    if (isEmpty) return <span className="stat-card__placeholder">{placeholder}</span>;
    return value?.toLocaleString?.() ?? String(value);
  };

  return (
    <Card className="stat-card" gradient hover>
      <div className="stat-card__header">
        <span className="stat-card__icon">{icon}</span>
        <h3 className="stat-card__title">{title}</h3>
      </div>
      <div className="stat-card__value">{renderValue()}</div>
      {trendValue != null && !loading && (
        <Badge
          variant={isPositive ? "success" : "error"}
          size="sm"
          icon={isPositive ? "↗" : "↘"}
        >
          {Math.abs(trendValue)}% vs last hour
        </Badge>
      )}
    </Card>
  );
}
