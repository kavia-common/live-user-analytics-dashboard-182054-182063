import React from 'react';

export default function LiveFeed({ items = [] }) {
  return (
    <div className="card" style={{ padding: 12 }}>
      <div style={{ padding: '6px 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>⚡</span>
        <strong>Live Activity</strong>
        <span className="small" style={{ marginLeft: 'auto' }}>{items?.length || 0} events</span>
      </div>
      <div className="feed">
        {items?.length ? (
          items.map((it) => (
            <div key={it.id} className="card" style={{ padding: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="badge">{it.type}</span>
                <strong style={{ fontSize: 14 }}>{it.user}</strong>
                <span className="small" style={{ marginLeft: 'auto' }}>
                  {new Date(it.ts).toLocaleTimeString()}
                </span>
              </div>
              <div className="small" style={{ marginTop: 6 }}>{it.message}</div>
            </div>
          ))
        ) : (
          <div className="small" style={{ opacity: .7 }}>No live events yet.</div>
        )}
      </div>
    </div>
  );
}
