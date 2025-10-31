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
      setOverview(ovr);
      setTimeseries(ts);
      setDevices(dev);
      setLocations(loc);
    } catch (e) {
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

  // Wire up socket events and catch-all handler
  const socketRef = useSocket({
    onConnect: () => {
      debouncedRefresh();
    },
    onDisconnect: () => {},
    onEvent: (eventName) => {
      if (eventName === "stats:update") {
        debouncedRefresh();
      }
    },
  });

  // Direct subscription as a safeguard
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handler = () => debouncedRefresh();
    socket.on("stats:update", handler);

    return () => {
      socket.off("stats:update", handler);
    };
  }, [socketRef, debouncedRefresh]);

  const cards = useMemo(() => {
    if (!overview) return [];
    return [
      { label: "Active Users", value: overview.activeUsers || 0 },
      { label: "Total Sessions", value: overview.totalSessions || 0 },
      { label: "Page Views", value: overview.pageViews || 0 },
      { label: "Conversion Rate", value: `${overview.conversionRate || 0}%` },
    ];
  }, [overview]);

  return (
    <div className="dashboard-container">
      <div className="stats-grid">
        {cards.map((c) => (
          <StatCard key={c.label} label={c.label} value={c.value} loading={loading} />
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

      <div className="live-feed-card">
        <LiveActivityFeed />
      </div>
    </div>
  );
}
