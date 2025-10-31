import React, { useCallback, useEffect, useRef, useState } from "react";
import "./LiveActivityFeed.css";
import apiClient from "../api/client";
import useSocket from "../hooks/useSocket";

/**
 * PUBLIC_INTERFACE
 * LiveActivityFeed
 * Subscribes to 'activity:new' and renders newest events at the top.
 * Loads an initial page of activities on mount. Debounces bursty inserts.
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

  const { subscribe } = useSocket();

  const loadInitial = useCallback(async () => {
    try {
      setLoading(true);
      // allow either /activities or /activities/recent depending on backend
      const res =
        (await apiClient.get("/activities?limit=30").catch(() => null)) ||
        (await apiClient.get("/activities/recent?limit=30").catch(() => null));

      const data =
        res?.data?.items || // possible envelope
        res?.data || // raw array
        [];

      setEvents(Array.isArray(data) ? data : []);
    } catch (e) {
      // eslint-disable-next-line no-console
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
    // Subscribe using hook
    const unsubscribe = subscribe("activity:new", (payload) => enqueueEvent(payload));
    return () => {
      unsubscribe && unsubscribe();
    };
  }, [subscribe, enqueueEvent]);

  if (loading) {
    return <div className="live-activity-feed">Loading activity…</div>;
  }

  if (!events.length) {
    return <div className="live-activity-feed">No recent activity.</div>;
  }

  return (
    <div className="live-activity-feed">
      <div className="live-activity-header">Live Activity</div>
      <ul className="live-activity-list">
        {events.map((e, idx) => (
          <li key={e._id || e.id || `${e.type}-${e.timestamp || e.occurredAt}-${idx}`} className="live-activity-item">
            <div className="live-activity-title">{e.title || e.type || "Event"}</div>
            <div className="live-activity-meta">
              {(e.user && (e.user.email || e.user.id)) || e.userId || "anonymous"} •{" "}
              {e.timestamp || e.occurredAt ? new Date(e.timestamp || e.occurredAt).toLocaleString() : ""}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
