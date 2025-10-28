import React from "react";
import Card from "./ui/Card";
import Badge from "./ui/Badge";
import "./StatCard.css";

/**
 * PUBLIC_INTERFACE
 * StatCard displays a KPI value with optional trend, icon, and gradient accent.
 */
export default function StatCard({ title, value, trend, icon = "📊", change }) {
  const trendValue = trend ?? change;
  const isPositive = trendValue != null && trendValue >= 0;
  
  return (
    <Card className="stat-card" gradient hover>
      <div className="stat-card__header">
        <span className="stat-card__icon">{icon}</span>
        <h3 className="stat-card__title">{title}</h3>
      </div>
      <div className="stat-card__value">{value.toLocaleString?.() ?? value}</div>
      {trendValue != null && (
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
