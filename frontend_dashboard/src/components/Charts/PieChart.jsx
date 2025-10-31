import React from 'react';

export default function PieChart({ data = [], size = 220 }) {
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
  const radius = size / 2;
  let acc = 0;

  return (
    <div className="card" style={{ padding: 12, display: 'grid', placeItems: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {data.map((d, i) => {
          const startAngle = (acc / total) * 2 * Math.PI;
          const endAngle = ((acc + d.value) / total) * 2 * Math.PI;
          acc += d.value;
          const x1 = radius + radius * Math.cos(startAngle);
          const y1 = radius + radius * Math.sin(startAngle);
          const x2 = radius + radius * Math.cos(endAngle);
          const y2 = radius + radius * Math.sin(endAngle);
          const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
          const path = `M ${radius} ${radius} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
          const colors = ['#7C3AED', '#0D9488', '#8B5CF6', '#06B6D4', '#EF4444'];
          return <path key={i} d={path} fill={colors[i % colors.length]} opacity="0.85" />;
        })}
      </svg>
    </div>
  );
}
