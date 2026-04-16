import React from 'react';
import { COLORS } from '../../../utils/constants';

export default function Skeleton({ height = 14, width = '100%', radius = 6, style }) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-block',
        width, height,
        borderRadius: radius,
        background: `linear-gradient(90deg, ${COLORS.bg.muted} 0%, ${COLORS.border} 50%, ${COLORS.bg.muted} 100%)`,
        backgroundSize: '200% 100%',
        animation: 'sc-skeleton 1.2s ease-in-out infinite',
        ...style,
      }}
    >
      <style>{`@keyframes sc-skeleton { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
    </span>
  );
}

export function SkeletonRows({ rows = 4, columns = 4 }) {
  return (
    <div role="status" aria-label="Loading" style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 12 }}>
          {Array.from({ length: columns }).map((__, c) => (
            <Skeleton key={c} height={16} />
          ))}
        </div>
      ))}
    </div>
  );
}
