import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import StatCard from "../components/StatCard";
import LineChart from "../components/charts/LineChart";
import BarChart from "../components/charts/BarChart";
import PieChart from "../components/charts/PieChart";
import LiveActivityFeed from "../components/LiveActivityFeed";
import { useSocket } from "../hooks/useSocket";

export default function Dashboard() {
  const [overview, setOverview] = useState({ activeSessions: 0, eventsCount: 0, uniqueUsers: 0 });
  const [series, setSeries] = useState([]);
  const [devices, setDevices] = useState([]);
  const [locations, setLocations] = useState([]);
  const { lastStats } = useSocket();

  const fetchAll = async () => {
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
  };

  useEffect(() => {
    fetchAll().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live minimal updates from socket
  useEffect(() => {
    if (lastStats) {
      setOverview((o) => ({ ...o, ...lastStats }));
    }
  }, [lastStats]);

  return (
    <div className="dashboard">
      <div className="grid stats">
        <StatCard title="Active Sessions" value={overview.activeSessions ?? 0} />
        <StatCard title="Events (60m)" value={overview.eventsCount ?? 0} />
        <StatCard title="Unique Users (60m)" value={overview.uniqueUsers ?? 0} />
        <div className="card">
          <h3>Status</h3>
          <div className="badge">Realtime connected via Socket.io</div>
        </div>
      </div>

      <div className="section">
        <div className="grid">
          <LineChart data={series} />
          <BarChart title="Devices" data={devices.map(d => ({ label: `${d.deviceType} · ${d.browser}`, value: d.count }))} />
        </div>
        <PieChart title="Top Countries" data={locations} />
      </div>

      <div className="section" style={{ gridTemplateColumns: "1fr" }}>
        <LiveActivityFeed />
      </div>
    </div>
  );
}
