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
  const [loading, setLoading] = useState(true);
  const { lastStats } = useSocket();

  const fetchAll = async () => {
    try {
      setLoading(true);
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
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (lastStats) {
      setOverview((o) => ({ ...o, ...lastStats }));
    }
  }, [lastStats]);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p style={styles.loadingText}>Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div style={styles.dashboard}>
      {/* Header Section */}
      <div style={styles.dashboardHeader}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>Analytics Dashboard</h1>
          <p style={styles.subtitle}>Real-time monitoring and insights</p>
        </div>
        <div style={styles.headerActions}>
          <button style={styles.refreshButton} onClick={fetchAll} title="Refresh data">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={styles.statsGrid}>
        <StatCard 
          title="Active Sessions" 
          value={overview.activeSessions ?? 0}
          trend="live"
          icon="👥"
        />
        <StatCard 
          title="Events (60m)" 
          value={overview.eventsCount ?? 0}
          icon="📊"
        />
        <StatCard 
          title="Unique Users (60m)" 
          value={overview.uniqueUsers ?? 0}
          icon="👤"
        />
        <div style={styles.statCard}>
          <div style={styles.statHeader}>
            <div style={styles.statIcon}>🔗</div>
            <h3 style={styles.statTitle}>Connection Status</h3>
          </div>
          <div style={styles.connectionBadge}>
            <div style={styles.statusIndicator}></div>
            Realtime connected via Socket.io
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div style={styles.chartsSection}>
        <div style={styles.chartGrid}>
          <div style={{ ...styles.chartContainer, ...styles.fullWidth }}>
            <div style={styles.chartHeader}>
              <h3 style={styles.chartTitle}>Activity Over Time</h3>
              <span style={styles.chartSubtitle}>Last 60 minutes • 5min intervals</span>
            </div>
            <LineChart data={series} />
          </div>
          
          <div style={styles.chartContainer}>
            <div style={styles.chartHeader}>
              <h3 style={styles.chartTitle}>Devices & Browsers</h3>
            </div>
            <BarChart 
              data={devices.map(d => ({ 
                label: `${d.deviceType} · ${d.browser}`, 
                value: d.count 
              }))} 
            />
          </div>
          
          <div style={styles.chartContainer}>
            <div style={styles.chartHeader}>
              <h3 style={styles.chartTitle}>Top Countries</h3>
              <span style={styles.chartSubtitle}>User distribution</span>
            </div>
            <PieChart data={locations} />
          </div>
        </div>
      </div>

      {/* Live Activity Section */}
      <div style={styles.activitySection}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Live Activity Feed</h2>
          <div style={styles.liveIndicator}>
            <div style={styles.pulseDot}></div>
            LIVE
          </div>
        </div>
        <LiveActivityFeed />
      </div>
    </div>
  );
}

const styles = {
  dashboard: {
    padding: "24px",
    maxWidth: "1400px",
    margin: "0 auto",
    background: "#f8fafc",
    minHeight: "100vh",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif"
  },
  
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "60vh",
    gap: "16px"
  },
  
  loadingSpinner: {
    width: "40px",
    height: "40px",
    border: "4px solid #e2e8f0",
    borderLeft: "4px solid #3b82f6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite"
  },
  
  loadingText: {
    color: "#64748b",
    fontSize: "16px",
    margin: 0
  },
  
  dashboardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "32px"
  },
  
  headerContent: {
    flex: 1
  },
  
  title: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#1e293b",
    margin: "0 0 4px 0"
  },
  
  subtitle: {
    color: "#64748b",
    margin: 0,
    fontSize: "16px"
  },
  
  headerActions: {
    marginLeft: "auto"
  },
  
  refreshButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 16px",
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    color: "#475569",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s",
    fontFamily: "inherit",
    fontSize: "14px"
  },
  
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "20px",
    marginBottom: "32px"
  },
  
  statCard: {
    background: "white",
    padding: "24px",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    border: "1px solid #e2e8f0",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center"
  },
  
  statHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "16px"
  },
  
  statIcon: {
    fontSize: "20px"
  },
  
  statTitle: {
    margin: 0,
    fontSize: "14px",
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.05em"
  },
  
  connectionBadge: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 12px",
    background: "#f0f9ff",
    border: "1px solid #bae6fd",
    borderRadius: "6px",
    color: "#0369a1",
    fontSize: "14px",
    fontWeight: "500"
  },
  
  statusIndicator: {
    width: "8px",
    height: "8px",
    background: "#22c55e",
    borderRadius: "50%",
    animation: "pulse 2s infinite"
  },
  
  chartsSection: {
    marginBottom: "32px"
  },
  
  chartGrid: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: "20px"
  },
  
  chartContainer: {
    background: "white",
    padding: "24px",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    border: "1px solid #e2e8f0"
  },
  
  fullWidth: {
    gridColumn: "1 / -1"
  },
  
  chartHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "20px"
  },
  
  chartTitle: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "600",
    color: "#1e293b"
  },
  
  chartSubtitle: {
    color: "#64748b",
    fontSize: "14px"
  },
  
  activitySection: {
    background: "white",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    border: "1px solid #e2e8f0",
    overflow: "hidden"
  },
  
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "24px 24px 0",
    marginBottom: 0
  },
  
  sectionTitle: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "600",
    color: "#1e293b"
  },
  
  liveIndicator: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px 8px",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "4px",
    color: "#dc2626",
    fontSize: "12px",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.05em"
  },
  
  pulseDot: {
    width: "6px",
    height: "6px",
    background: "#dc2626",
    borderRadius: "50%",
    animation: "pulse 1.5s infinite"
  }
};

// Add global styles for animations
const styleSheet = document.styleSheets[0];
styleSheet.insertRule(`
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`, styleSheet.cssRules.length);

styleSheet.insertRule(`
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`, styleSheet.cssRules.length);

// Responsive styles
styleSheet.insertRule(`
  @media (max-width: 1024px) {
    .chart-grid {
      grid-template-columns: 1fr;
    }
    
    .chart-container.full-width {
      grid-column: 1;
    }
  }
`, styleSheet.cssRules.length);

styleSheet.insertRule(`
  @media (max-width: 768px) {
    .dashboard {
      padding: 16px;
    }
    
    .dashboard-header {
      flex-direction: column;
      gap: 16px;
    }
    
    .header-actions {
      margin-left: 0;
      align-self: stretch;
    }
    
    .btn-refresh {
      justify-content: center;
      width: 100%;
    }
    
    .stats-grid {
      grid-template-columns: 1fr;
    }
    
    .chart-header {
      flex-direction: column;
      gap: 8px;
      align-items: flex-start;
    }
    
    .chart-subtitle {
      margin-left: 0;
    }
  }
`, styleSheet.cssRules.length);