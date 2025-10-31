import React from 'react';

export default function StatCard({ label, value, delta, icon }) {
  return (
    <div className="card stat">
      <div className="label">{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <div className="value">{value ?? <span className="skeleton" style={{ width: 80, height: 24 }} />}</div>
        {icon ? <span className="small" aria-hidden>{icon}</span> : null}
      </div>
      {delta ? <div className="delta">{delta}</div> : <div className="small" style={{ opacity: .6 }}>—</div>}
    </div>
  );
}
