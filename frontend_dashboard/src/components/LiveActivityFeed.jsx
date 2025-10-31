import React, { useCallback, useEffect, useRef, useState } from "react";
import "./LiveActivityFeed.css";
import apiClient from "../api/client";
import useSocket from "../hooks/useSocket";

/**
 * PUBLIC_INTERFACE
 * LiveActivityFeed
 * Subscribes to 'activity:new' and renders newest events at the top.
 * Loads an initial page of activities on mount. Debounces bursty inserts to reduce layout thrash.
 */
export default function LiveActivityFeed() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Buffer + debounce to handle bursts
  const bufferRef = useRef([]);
  const debounceTimerRef = useRef(null);

  const flushBuffer = useCallback(() => {
    if (!bufferRef.current.length) return;
    setEvents((prev) => {
      const merged = [...bufferRef.current, ...prev];
      return merged.slice(0, 100);
    });
    bufferRef.current = [];
  }, []);

  const enqueueEvent = useCallback(
    (payload) => {
      bufferRef.current.push(payload);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(flushBuffer, 250);
    },
    [flushBuffer]
  );

  const socketRef = useSocket({
    onEvent: (event, payload) => {
      if (event === "activity:new") {
        enqueueEvent(payload);
      }
    },
  });

  const loadInitial = useCallback(async () => {
    try {
      setLoading(true);
      // allow either /activities or /activities/recent depending on backend
      const res =
        (await apiClient.get("/activities?limit=30").catch(() => null)) ||
        (await apiClient.get("/activities/recent?limit=30").catch(() => null));

      const data =
        res?.data?.items || // newer API
        res?.data || // simple array fallback
        [];

      setEvents(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("[LiveActivityFeed] Failed to load initial activity", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitial();
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      bufferRef.current = [];
    };
  }, [loadInitial]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handler = (payload) => enqueueEvent(payload);
    socket.on("activity:new", handler);

    return () => {
      socket.off("activity:new", handler);
    };
  }, [socketRef, enqueueEvent]);

  if (loading) {
    return <div className="live-activity-feed">Loading activity…</div>;
  }

  if (!events.length) {
    return <div className="live-activity-feed">No recent activity.</div>;
  }

  return (
    <div className="live-activity-feed">
      {events.map((e, idx) => (
        <div key={e._id || e.id || `${e.type}-${e.timestamp || e.occurredAt}-${idx}`} className="feed-item">
          <div className="feed-item-header">
            <span className="feed-type">{e.type}</span>
            <span className="feed-time">
              {e.timestamp || e.occurredAt ? new Date(e.timestamp || e.occurredAt).toLocaleString() : ""}
            </span>
          </div>
          <div className="feed-body">
            <div className="feed-user">{e.user?.email || e.userId || e.user?.id}</div>
            <div className="feed-meta">
              <span>{e.device?.type || e.device?.deviceType}</span>
              <span>{e.location?.city || e.location?.country}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
