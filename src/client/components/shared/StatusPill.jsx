import React from 'react';
import { STATUS_COLOR_MAP } from '../../../utils/constants';

export default function StatusPill({ status }) {
  const color = STATUS_COLOR_MAP[status] || '#94A3B8';

  return (
    <span style={{
      padding: '4px 10px',
      borderRadius: 12,
      fontSize: 12,
      background: `${color}20`,
      color: color,
      fontWeight: 500,
    }}>
      {status}
    </span>
  );
}
