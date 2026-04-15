import React from 'react';
import { ClipboardList, Clock, Loader, CheckCircle2 } from 'lucide-react';
import { COLORS } from '../../../utils/constants';

const metrics = [
  { key: 'total', label: 'Total Reports', icon: ClipboardList, color: COLORS.secondary, hint: 'All time' },
  { key: 'pending', label: 'Pending', icon: Clock, color: COLORS.status.pending, hint: 'Needs triage' },
  { key: 'inProgress', label: 'In Progress', icon: Loader, color: COLORS.status.inProgress, hint: 'Being handled' },
  { key: 'resolved', label: 'Resolved', icon: CheckCircle2, color: COLORS.status.resolved, hint: 'Completed' },
];

function MetricCard({ m, value, share }) {
  const Icon = m.icon;
  return (
    <div
      style={{
        position: 'relative',
        background: COLORS.bg.card,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 14,
        padding: 18,
        overflow: 'hidden',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 6px 18px rgba(15, 23, 42, 0.06)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: 3, background: m.color,
      }} />
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', gap: 12, marginTop: 4,
      }}>
        <div>
          <div style={{
            fontSize: 12, fontWeight: 600,
            color: COLORS.text.muted, letterSpacing: 0.4,
            textTransform: 'uppercase',
          }}>
            {m.label}
          </div>
          <div style={{
            fontSize: 30, fontWeight: 700,
            color: COLORS.text.primary, marginTop: 6,
            lineHeight: 1.1,
          }}>
            {value}
          </div>
        </div>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: `${m.color}1A`, color: m.color,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon size={20} />
        </div>
      </div>
      <div style={{
        marginTop: 12, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: 8,
      }}>
        <span style={{ fontSize: 12, color: COLORS.text.muted }}>{m.hint}</span>
        {share !== null && (
          <span style={{
            fontSize: 12, fontWeight: 600, color: m.color,
            background: `${m.color}14`, padding: '2px 8px', borderRadius: 999,
          }}>
            {share}%
          </span>
        )}
      </div>
    </div>
  );
}

export default function MetricsGrid({ reports }) {
  const counts = {
    total: reports.length,
    pending: reports.filter((r) => r.status === 'Pending').length,
    inProgress: reports.filter((r) => r.status === 'In Progress').length,
    resolved: reports.filter((r) => r.status === 'Resolved').length,
  };

  const share = (n) => counts.total ? Math.round((n / counts.total) * 100) : 0;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: 16,
    }}>
      {metrics.map((m) => (
        <MetricCard
          key={m.key}
          m={m}
          value={counts[m.key]}
          share={m.key === 'total' ? null : share(counts[m.key])}
        />
      ))}
    </div>
  );
}
