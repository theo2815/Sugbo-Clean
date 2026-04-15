import React from 'react';
import { STATUS_COLOR_MAP } from '../../../utils/constants';

export default function StatusPill({ status, size = 'md' }) {
  const color = STATUS_COLOR_MAP[status] || '#94A3B8';

  const sizes = {
    sm: { padding: '2px 8px', fontSize: 11, dot: 6, gap: 5 },
    md: { padding: '4px 10px', fontSize: 12, dot: 7, gap: 6 },
  };
  const s = sizes[size] || sizes.md;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: s.gap,
        padding: s.padding,
        borderRadius: 999,
        fontSize: s.fontSize,
        background: `${color}1A`,
        color,
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{
        width: s.dot,
        height: s.dot,
        borderRadius: '50%',
        background: color,
        display: 'inline-block',
      }} />
      {status}
    </span>
  );
}
