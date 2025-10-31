import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./Dashboard.css";
import StatCard from "../components/StatCard";
import LineChart from "../components/charts/LineChart";
import BarChart from "../components/charts/BarChart";
import PieChart from "../components/charts/PieChart";
import LiveActivityFeed from "../components/LiveActivityFeed";
import useSocket from "../hooks/useSocket";
import apiClient from "../api/client";

/**
 * PUBLIC_INTERFACE
 * Dashboard
 * Loads analytics stats (overview, timeseries, devices, locations) on mount.
 * Subscribes to `stats:update` via realtime socket and refreshes stats with debounced fetch
 * to avoid over-fetching on bursty updates.
 */
export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [timeseries, setTimeseries] = useState([]);
  const [devices, setDevices] = useState([]);
  const [locations, setLocations] = useState([]);

  const inFlightRef = useRef(false);
  const debounceTimerRef = useRef(null);

  const fetchStats = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      setLoading(true);
      const [ovr, ts, dev, loc] = await Promise.all([
        apiClient.get("/stats/overview").then((r) => r.data),
        apiClient.get("/stats/timeseries").then((r) => r.data),
        apiClient.get("/stats/devices").then((r) => r.data),
        apiClient.get("/stats/locations").then((r) => r.data),
      ]);
      setOverview(ovr || {});
      setTimeseries(ts || []);
      setDevices(dev || []);
      setLocations(loc || []);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("[Dashboard] Failed to fetch stats", e);
    } finally {
      setLoading(false);
      inFlightRef.current = false;
    }
  }, []);

  const debouncedRefresh = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      fetchStats();
    }, 500);
  }, [fetchStats]);

  // Initial load
  useEffect(() => {
    fetchStats();
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [fetchStats]);

  // Wire up socket events
  const { subscribe } = useSocket();

  useEffect(() => {
    const unsubscribe = subscribe("stats:update", () => {
      debouncedRefresh();
    });
    return () => {
      unsubscribe && unsubscribe();
    };
  }, [subscribe, debouncedRefresh]);

  const cards = useMemo(() => {
    const ov = overview || {};
    return [
      { label: "Active Sessions", value: ov.activeSessions ?? 0 },
      { label: "Users Online", value: ov.usersOnline ?? 0 },
      { label: "Page Views", value: ov.pageViews ?? 0 },
      { label: "Errors", value: ov.errors ?? 0 },
    ];
  }, [overview]);

  return (
    <div className="dashboard">
      <div className="stats-grid">
        {cards.map((c) => (
          <StatCard key={c.label} title={c.label} value={c.value} loading={loading} />
        ))}
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <LineChart data={timeseries} loading={loading} />
        </div>
        <div className="chart-card">
          <BarChart data={devices} loading={loading} />
        </div>
        <div className="chart-card">
          <PieChart data={locations} loading={loading} />
        </div>
      </div>

      <LiveActivityFeed />
    </div>
  );
}
