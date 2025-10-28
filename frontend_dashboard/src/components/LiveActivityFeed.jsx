import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import { useSocket } from "../hooks/useSocket";

// PUBLIC_INTERFACE
export default function LiveActivityFeed() {
  /** Shows a live-updating feed of activity events from Socket.io and recent API. */
  const [items, setItems] = useState([]);
  const { lastActivity } = useSocket();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await api.get("/activities/recent?limit=25");
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

  return (
    <div className="card">
      <h3>Live Activity</h3>
      <div className="feed">
        {items.map((it) => (
          <div key={it.id} className="feed-item">
            <div>
              <div className="type">{it.type}</div>
              <div className="meta">{it.page || "N/A"} • {new Date(it.occurredAt).toLocaleString()}</div>
            </div>
            <div className="badge">{(it.device?.deviceType || "unknown")} · {(it.location?.country || "unknown")}</div>
          </div>
        ))}
        {!items.length && <div className="badge">No activity yet</div>}
      </div>
    </div>
  );
}
