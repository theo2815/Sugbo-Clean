import React from 'react';
import { COLORS } from '../../../utils/constants';

const metrics = [
  { key: 'total', label: 'Total Reports', color: COLORS.secondary },
  { key: 'pending', label: 'Pending', color: COLORS.status.pending },
  { key: 'inProgress', label: 'In Progress', color: COLORS.status.inProgress },
  { key: 'resolved', label: 'Resolved', color: COLORS.status.resolved },
];

export default function MetricsGrid({ reports }) {
  const counts = {
    total: reports.length,
    pending: reports.filter((r) => r.status === 'Pending').length,
    inProgress: reports.filter((r) => r.status === 'In Progress').length,
    resolved: reports.filter((r) => r.status === 'Resolved').length,
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16, margin: '20px 0' }}>
      {metrics.map((m) => (
        <div key={m.key} style={{
          background: COLORS.bg.card,
          border: `1px solid ${COLORS.border}`,
          borderTop: `4px solid ${m.color}`,
          borderRadius: 10,
          padding: 16,
        }}>
          <h2 style={{ margin: 0, fontSize: 26, color: COLORS.text.primary }}>{counts[m.key]}</h2>
          <p style={{ margin: '4px 0 0', color: COLORS.text.muted, fontSize: 13 }}>{m.label}</p>
        </div>
      ))}
    </div>
  );
}
