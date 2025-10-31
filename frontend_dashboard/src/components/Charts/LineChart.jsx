import React from 'react';

export default function LineChart({ data = [], height = 200 }) {
  const padding = 24;
  const width = 480;
  const w = width - padding * 2;
  const h = height - padding * 2;

  const values = data.map(d => d.value);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = max - min || 1;

  const points = data.map((d, i) => {
    const x = padding + (i / Math.max(1, data.length - 1)) * w;
    const y = padding + h - ((d.value - min) / span) * h;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="card" style={{ padding: 12 }}>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(124,58,237,0.6)" />
            <stop offset="100%" stopColor="rgba(124,58,237,0.05)" />
          </linearGradient>
        </defs>
        <polyline
          fill="none"
          stroke="url(#lg)"
          strokeWidth="3"
          points={points}
        />
      </svg>
    </div>
  );
}
