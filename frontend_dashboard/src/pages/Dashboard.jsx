import React from 'react';
import StatCard from '../components/Stats/StatCard';
import LineChart from '../components/Charts/LineChart';
import BarChart from '../components/Charts/BarChart';
import PieChart from '../components/Charts/PieChart';
import LiveFeed from '../components/Feed/LiveFeed';
import { apiGet } from '../utils/apiClient';
import { useBackendHealth } from '../hooks/useBackendHealth';
import { useSocket } from '../hooks/useSocket';
import { fallbackStats, fallbackLineData, fallbackBarData, fallbackPieData, fallbackFeed } from '../utils/fallbackData';

export default function Dashboard() {
  const { healthy } = useBackendHealth();
  const { socket, connected } = useSocket('/analytics');

  const [stats, setStats] = React.useState(fallbackStats);
  const [line, setLine] = React.useState(fallbackLineData);
  const [bar, setBar] = React.useState(fallbackBarData);
  const [pie, setPie] = React.useState(fallbackPieData);
  const [feed, setFeed] = React.useState(fallbackFeed);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [s, l, b, p] = await Promise.all([
          apiGet('/stats/summary'),
          apiGet('/stats/line'),
          apiGet('/stats/bars'),
          apiGet('/stats/pie'),
        ]);
        if (!cancelled) {
          setStats({
            logins: s.logins, pageViews: s.pageViews, activeSessions: s.activeSessions,
            deltaLogins: s.deltaLogins, deltaPageViews: s.deltaPageViews, deltaActiveSessions: s.deltaActiveSessions
          });
          setLine(l?.points || fallbackLineData);
          setBar(b?.bars || fallbackBarData);
          setPie(p?.slices || fallbackPieData);
        }
      } catch (e) {
        // keep fallbacks
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  React.useEffect(() => {
    if (!socket) return;
    const onStats = (payload) => setStats((prev) => ({ ...prev, ...payload }));
    const onEvent = (evt) => setFeed((f) => [{ id: evt.id || String(Date.now()), ...evt }, ...f].slice(0, 40));

    socket.on && socket.on('stats:update', onStats);
    socket.on && socket.on('activity', onEvent);

    return () => {
      socket.off && socket.off('stats:update', onStats);
      socket.off && socket.off('activity', onEvent);
    };
  }, [socket]);

  return (
    <div style={{ display: 'grid' }}>
      {!healthy && (
        <div className="banner" style={{ marginBottom: 12 }}>
          Backend offline - showing live UI with placeholders. Some data may be simulated.
        </div>
      )}
      <div className="grid cols-3">
        <StatCard label="Logins" value={stats.logins} delta={stats.deltaLogins} icon="🔐" />
        <StatCard label="Page Views" value={stats.pageViews} delta={stats.deltaPageViews} icon="👁️" />
        <StatCard label="Active Sessions" value={stats.activeSessions} delta={stats.deltaActiveSessions} icon="🟢" />
      </div>

      <div className="grid cols-2" style={{ marginTop: 16 }}>
        <div className="grid" style={{ gap: 16 }}>
          <LineChart data={line} />
          <BarChart data={bar} />
        </div>
        <div className="grid" style={{ gap: 16 }}>
          <PieChart data={pie} />
          <LiveFeed items={feed} />
        </div>
      </div>

      <div className="small" style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
        <span className="badge">{connected ? 'Socket: Connected' : 'Socket: Offline'}</span>
        {loading ? <span>Loading analytics…</span> : <span>Updated in real-time.</span>}
      </div>
    </div>
  );
}
