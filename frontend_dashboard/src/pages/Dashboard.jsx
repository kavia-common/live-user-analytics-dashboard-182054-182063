import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import { useSocket } from "../hooks/useSocket";

const StatCard = ({ title, value, icon, trend }) => (
  <div className="stat-card">
    <div className="stat-header">
      <span className="stat-title">{title}</span>
      {icon && <span className="stat-icon">{icon}</span>}
    </div>
    <div className="stat-value">{value.toLocaleString()}</div>
    {trend && (
      <div className={`stat-trend ${trend > 0 ? 'positive' : 'negative'}`}>
        {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
      </div>
    )}
  </div>
);

const LineChart = ({ data }) => {
  const max = Math.max(...data.map(d => d.events), 1);
  return (
    <div className="chart-card">
      <h3 className="chart-title">Events Timeline (Last 60 min)</h3>
      <div className="line-chart">
        <svg width="100%" height="200" viewBox="0 0 600 200" preserveAspectRatio="none">
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgb(99, 102, 241)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="rgb(99, 102, 241)" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <path
            d={data.map((d, i) => {
              const x = (i / (data.length - 1)) * 600;
              const y = 200 - (d.events / max) * 180;
              return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
            }).join(' ')}
            fill="none"
            stroke="rgb(99, 102, 241)"
            strokeWidth="3"
          />
          <path
            d={data.map((d, i) => {
              const x = (i / (data.length - 1)) * 600;
              const y = 200 - (d.events / max) * 180;
              return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
            }).join(' ') + ' L 600 200 L 0 200 Z'}
            fill="url(#lineGradient)"
          />
        </svg>
        <div className="chart-labels">
          {data.filter((_, i) => i % 3 === 0).map((d, i) => (
            <span key={i} className="chart-label">{d.time}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

const BarChart = ({ title, data }) => {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="chart-card">
      <h3 className="chart-title">{title}</h3>
      <div className="bar-chart">
        {data.map((item, i) => (
          <div key={i} className="bar-item">
            <div className="bar-label">{item.label}</div>
            <div className="bar-container">
              <div 
                className="bar-fill" 
                style={{ width: `${(item.value / max) * 100}%` }}
              >
                <span className="bar-value">{item.value}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const PieChart = ({ title, data }) => {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];
  
  return (
    <div className="chart-card">
      <h3 className="chart-title">{title}</h3>
      <div className="pie-chart-container">
        <div className="pie-legend">
          {data.map((item, i) => (
            <div key={i} className="legend-item">
              <span className="legend-dot" style={{ backgroundColor: colors[i % colors.length] }}></span>
              <span className="legend-label">{item.country}</span>
              <span className="legend-value">{((item.count / total) * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const LiveActivityFeed = ({ activities = [] }) => {
  return (
    <div className="chart-card">
      <h3 className="chart-title">
        <span>Live Activity Feed</span>
        <span className="live-indicator">● LIVE</span>
      </h3>
      <div className="activity-feed">
        {activities.length === 0 ? (
          <div className="activity-empty">No recent activity</div>
        ) : (
          activities.map((activity, i) => (
            <div key={i} className="activity-item">
              <div className="activity-avatar">{activity.user?.slice(-2) || '??'}</div>
              <div className="activity-details">
                <div className="activity-main">
                  <span className="activity-user">{activity.user}</span>
                  <span className="activity-action">{activity.action}</span>
                  <span className="activity-page">{activity.page}</span>
                </div>
                <div className="activity-time">{activity.time}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default function Dashboard() {
  const [overview, setOverview] = useState({ activeSessions: 0, eventsCount: 0, uniqueUsers: 0 });
  const [series, setSeries] = useState([]);
  const [devices, setDevices] = useState([]);
  const [locations, setLocations] = useState([]);
  const [activities, setActivities] = useState([]);
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
  }, []);

  useEffect(() => {
    if (lastStats) {
      setOverview((o) => ({ ...o, ...lastStats }));
    }
  }, [lastStats]);

  return (
    <div className="dashboard">
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        .dashboard {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 2rem;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 1.5rem;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15);
        }

        .stat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .stat-title {
          font-size: 0.875rem;
          color: #64748b;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .stat-icon {
          font-size: 1.25rem;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 0.5rem;
        }

        .stat-trend {
          font-size: 0.875rem;
          font-weight: 600;
        }

        .stat-trend.positive { color: #10b981; }
        .stat-trend.negative { color: #ef4444; }

        .status-card {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 0.75rem;
        }

        .status-icon {
          font-size: 2rem;
        }

        .status-badge {
          background: rgba(255, 255, 255, 0.2);
          padding: 0.5rem 1rem;
          border-radius: 24px;
          font-size: 0.875rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .pulse {
          width: 8px;
          height: 8px;
          background: #10b981;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }

        .charts-section {
          margin-bottom: 2rem;
        }

        .charts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .chart-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 1.5rem;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }

        .chart-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .live-indicator {
          color: #ef4444;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 1px;
          animation: pulse 2s infinite;
        }

        .line-chart {
          position: relative;
        }

        .chart-labels {
          display: flex;
          justify-content: space-between;
          margin-top: 0.5rem;
          font-size: 0.75rem;
          color: #64748b;
        }

        .bar-chart {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .bar-item {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .bar-label {
          font-size: 0.875rem;
          color: #475569;
          font-weight: 500;
        }

        .bar-container {
          background: #f1f5f9;
          border-radius: 8px;
          height: 32px;
          overflow: hidden;
        }

        .bar-fill {
          background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%);
          height: 100%;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding-right: 0.75rem;
          transition: width 0.8s ease;
          min-width: 60px;
        }

        .bar-value {
          color: white;
          font-size: 0.875rem;
          font-weight: 600;
        }

        .pie-chart-container {
          display: flex;
          justify-content: center;
        }

        .pie-legend {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          width: 100%;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem;
          border-radius: 8px;
          transition: background 0.2s;
        }

        .legend-item:hover {
          background: #f8fafc;
        }

        .legend-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .legend-label {
          flex: 1;
          font-size: 0.875rem;
          color: #475569;
          font-weight: 500;
        }

        .legend-value {
          font-size: 0.875rem;
          color: #1e293b;
          font-weight: 600;
        }

        .activity-feed {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          max-height: 400px;
          overflow-y: auto;
        }

        .activity-item {
          display: flex;
          gap: 1rem;
          padding: 0.75rem;
          background: #f8fafc;
          border-radius: 12px;
          transition: background 0.2s;
        }

        .activity-item:hover {
          background: #f1f5f9;
        }

        .activity-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          font-size: 0.875rem;
          flex-shrink: 0;
        }

        .activity-details {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .activity-main {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          align-items: center;
        }

        .activity-user {
          font-weight: 600;
          color: #1e293b;
          font-size: 0.875rem;
        }

        .activity-action {
          background: #dbeafe;
          color: #1e40af;
          padding: 0.125rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .activity-page {
          color: #64748b;
          font-size: 0.875rem;
        }

        .activity-time {
          font-size: 0.75rem;
          color: #94a3b8;
        }

        .activity-empty {
          text-align: center;
          padding: 2rem;
          color: #94a3b8;
          font-size: 0.875rem;
        }

        @media (max-width: 768px) {
          .dashboard { padding: 1rem; }
          .stats-grid { grid-template-columns: 1fr; }
          .charts-grid { grid-template-columns: 1fr; }
          .stat-value { font-size: 1.75rem; }
        }
      `}</style>

      <div className="stats-grid">
        <StatCard 
          title="Active Sessions" 
          value={overview.activeSessions ?? 0}
          icon="👥"
          trend={12}
        />
        <StatCard 
          title="Events (60m)" 
          value={overview.eventsCount ?? 0}
          icon="📊"
          trend={8}
        />
        <StatCard 
          title="Unique Users" 
          value={overview.uniqueUsers ?? 0}
          icon="🌍"
          trend={-3}
        />
        <div className="stat-card status-card">
          <div className="status-icon">⚡</div>
          <div className="status-badge">
            <span className="pulse"></span>
            Connected via Socket.io
          </div>
        </div>
      </div>

      <div className="charts-section">
        <div className="charts-grid">
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

      <LiveActivityFeed activities={activities} />
    </div>
  );
}