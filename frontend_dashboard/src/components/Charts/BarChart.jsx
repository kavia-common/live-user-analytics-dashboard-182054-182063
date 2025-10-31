import React from 'react';

export default function BarChart({ data = [], height = 200 }) {
  const padding = 24;
  const width = 480;
  const w = width - padding * 2;
  const h = height - padding * 2;

  const values = data.map(d => d.value);
  const max = Math.max(...values, 1);

  const barWidth = w / Math.max(1, data.length);
  return (
    <div className="card" style={{ padding: 12 }}>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        {data.map((d, i) => {
          const bh = (d.value / max) * h;
          const x = padding + i * barWidth + 4;
          const y = padding + h - bh;
          const bw = barWidth - 8;
          return (
            <rect key={i} x={x} y={y} width={bw} height={bh} rx="6" fill="rgba(13,148,136,0.7)" />
          );
        })}
      </svg>
    </div>
  );
}
