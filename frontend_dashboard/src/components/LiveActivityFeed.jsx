import React, { useEffect, useState } from "react";
import apiClient from "../api/client";
import { useSocket } from "../hooks/useSocket";
import Card from "./ui/Card";
import Badge from "./ui/Badge";
import "./LiveActivityFeed.css";

/**
 * PUBLIC_INTERFACE
 * LiveActivityFeed shows a live-updating feed of activity events with enhanced styling.
 */
export default function LiveActivityFeed() {
  const [items, setItems] = useState([]);
  const { lastActivity } = useSocket();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await apiClient.get("/activities/recent?limit=25");
        if (mounted) setItems(data.items || []);
      } catch {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (lastActivity) {
      setItems((prev) => [lastActivity, ...prev].slice(0, 50));
    }
  }, [lastActivity]);

  const getActivityIcon = (type) => {
    const icons = {
      login: "🔐",
      logout: "👋",
      page_view: "👁️",
      click: "🖱️",
      navigation: "🧭"
    };
    return icons[type] || "📌";
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card className="live-activity-feed" padding="lg">
      <div className="live-activity-feed__header">
        <h3 className="live-activity-feed__title">
          <span className="live-pulse" />
          Live Activity Feed
        </h3>
        <Badge variant="primary" size="sm">{items.length} events</Badge>
      </div>
      
      <div className="live-activity-feed__list">
        {items.map((it, idx) => (
          <div key={`${it.id}-${idx}`} className="activity-item">
            <span className="activity-item__icon">{getActivityIcon(it.type)}</span>
            <div className="activity-item__content">
              <div className="activity-item__header">
                <span className="activity-item__type">{it.type.replace('_', ' ')}</span>
                <span className="activity-item__time">{formatTime(it.occurredAt)}</span>
              </div>
              <div className="activity-item__meta">
                {it.page && <span className="activity-item__page">{it.page}</span>}
                <div className="activity-item__badges">
                  {it.device?.deviceType && (
                    <Badge variant="default" size="sm">{it.device.deviceType}</Badge>
                  )}
                  {it.location?.country && (
                    <Badge variant="default" size="sm">{it.location.country}</Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        {!items.length && (
          <div className="activity-item--empty">
            <span>📭</span>
            <span>No activity yet</span>
          </div>
        )}
      </div>
    </Card>
  );
}
