import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import StatCard from "../components/StatCard";
import LineChart from "../components/charts/LineChart";
import BarChart from "../components/charts/BarChart";
import PieChart from "../components/charts/PieChart";
import LiveActivityFeed from "../components/LiveActivityFeed";
import { useSocket } from "../hooks/useSocket";
import "./Dashboard.css";

// PUBLIC_INTERFACE
export default function Dashboard() {
  /** Main dashboard page with KPIs, charts, and live activity feed. */
  const [overview, setOverview] = useState({ activeSessions: 0, eventsCount: 0, uniqueUsers: 0 });
  const [series, setSeries] = useState([]);
  const [devices, setDevices] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { lastStats } = useSocket();

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [ov, ts, dev, loc] = await Promise.all([
        api.get("/stats/overview?sinceMinutes=60"),
        api.get("/stats/timeseries?intervalMinutes=5&totalMinutes=60"),
        api.get("/stats/devices?sinceMinutes=60"),
        api.get("/stats/locations?sinceMinutes=60"),
      ]);
      setOverview(ov.data);
      setSeries(ts.data.series || []);
      setDevices(dev.data.devices || []);
      setLocations(loc.data.locations || []);
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live minimal updates from socket
  useEffect(() => {
    if (lastStats) {
      setOverview((o) => ({ ...o, ...lastStats }));
    }
  }, [lastStats]);

  if (loading) {
    return (
      <div className="dashboard">
        <div className="dashboard__loading">
          <span className="dashboard__spinner" />
          <span>Loading dashboard data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <h1 className="dashboard__title">Dashboard</h1>
        <p className="dashboard__subtitle">Real-time analytics overview</p>
      </header>

      <div className="grid stats">
        <StatCard 
          title="Active Sessions" 
          value={overview.activeSessions ?? 0}
          icon="🔗"
        />
        <StatCard 
          title="Events (Last Hour)" 
          value={overview.eventsCount ?? 0}
          icon="⚡"
        />
        <StatCard 
          title="Unique Users" 
          value={overview.uniqueUsers ?? 0}
          icon="👤"
        />
        <StatCard 
          title="Window" 
          value={`${overview.windowMinutes ?? 60}m`}
          icon="⏱️"
        />
      </div>

      <div className="section">
        <div className="dashboard__charts">
          <LineChart data={series} />
          <BarChart 
            title="Device & Browser" 
            data={devices.map(d => ({ 
              label: `${d.deviceType} · ${d.browser}`, 
              value: d.count 
            }))} 
          />
        </div>
        <PieChart title="Top Countries" data={locations} />
      </div>

      <div className="dashboard__feed-section">
        <LiveActivityFeed />
      </div>
    </div>
  );
}
