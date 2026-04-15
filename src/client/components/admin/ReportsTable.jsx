import React, { useState } from 'react';
import { Play, CheckCircle2, Inbox } from 'lucide-react';
import { updateReportStatus } from '../../../services/api';
import { COLORS, STATUS } from '../../../utils/constants';
import { formatDate } from '../../../utils/helpers';
import StatusPill from '../shared/StatusPill';
import EmptyState from '../shared/EmptyState';

const NEXT_STATUS = {
  [STATUS.PENDING]: { label: 'Start', next: STATUS.IN_PROGRESS, icon: Play, color: COLORS.status.inProgress },
  [STATUS.IN_PROGRESS]: { label: 'Resolve', next: STATUS.RESOLVED, icon: CheckCircle2, color: COLORS.status.resolved },
};

export default function ReportsTable({ reports, onStatusChange }) {
  const [updatingId, setUpdatingId] = useState(null);

  async function setStatus(report, newStatus) {
    setUpdatingId(report.sys_id);
    try {
      await updateReportStatus(report.sys_id, newStatus);
      if (onStatusChange) await onStatusChange();
    } finally {
      setUpdatingId(null);
    }
  }

  const sorted = reports.slice().sort(
    (a, b) => new Date(b.missed_date) - new Date(a.missed_date)
  );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h3 style={styles.title}>Reports</h3>
          <p style={styles.subtitle}>Most recent first. Click status to advance.</p>
        </div>
        <span style={styles.countPill}>{reports.length}</span>
      </div>

      {reports.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No reports match"
          message="Try clearing filters or search terms, or check back once residents file new reports."
        />
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Code</th>
                <th style={styles.th}>Barangay</th>
                <th style={styles.th}>Missed Date</th>
                <th style={styles.th}>Waste Type</th>
                <th style={styles.th}>Status</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((report) => {
                const next = NEXT_STATUS[report.status];
                const isUpdating = updatingId === report.sys_id;
                return (
                  <tr
                    key={report.sys_id}
                    style={styles.tr}
                    onMouseOver={(e) => (e.currentTarget.style.background = COLORS.bg.muted)}
                    onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ ...styles.td, ...styles.code }}>{report.report_code}</td>
                    <td style={styles.td}>{report.barangay}</td>
                    <td style={{ ...styles.td, color: COLORS.text.secondary }}>
                      {formatDate(report.missed_date)}
                    </td>
                    <td style={styles.td}>
                      <span style={styles.wasteTag}>{report.waste_type}</span>
                    </td>
                    <td style={styles.td}>
                      <StatusPill status={report.status} />
                    </td>
                    <td style={{ ...styles.td, textAlign: 'right' }}>
                      <div style={styles.actions}>
                        {next && (
                          <button
                            type="button"
                            onClick={() => setStatus(report, next.next)}
                            disabled={isUpdating}
                            style={{
                              ...styles.quickBtn,
                              borderColor: next.color,
                              color: next.color,
                              opacity: isUpdating ? 0.6 : 1,
                            }}
                            aria-label={`${next.label} ${report.report_code}`}
                          >
                            <next.icon size={13} />
                            {next.label}
                          </button>
                        )}
                        <select
                          value={report.status}
                          onChange={(e) => setStatus(report, e.target.value)}
                          disabled={isUpdating}
                          aria-label={`Change status for ${report.report_code}`}
                          style={styles.select}
                        >
                          {Object.values(STATUS).map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    background: COLORS.bg.card,
    borderRadius: 12,
    border: `1px solid ${COLORS.border}`,
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: `1px solid ${COLORS.border}`,
    gap: 12,
  },
  title: {
    margin: 0,
    fontSize: 16,
    fontWeight: 700,
    color: COLORS.text.primary,
  },
  subtitle: {
    margin: '2px 0 0',
    fontSize: 12,
    color: COLORS.text.muted,
  },
  countPill: {
    padding: '4px 10px',
    background: COLORS.bg.muted,
    color: COLORS.text.secondary,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
  },
  tableWrap: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: 760,
  },
  th: {
    textAlign: 'left',
    padding: '12px 16px',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: COLORS.text.muted,
    background: COLORS.bg.muted,
    borderBottom: `1px solid ${COLORS.border}`,
    position: 'sticky',
    top: 0,
  },
  tr: {
    transition: 'background 0.12s ease',
  },
  td: {
    padding: '14px 16px',
    borderBottom: `1px solid ${COLORS.border}`,
    fontSize: 14,
    color: COLORS.text.primary,
    verticalAlign: 'middle',
  },
  code: {
    fontFamily: 'monospace',
    fontWeight: 700,
    letterSpacing: 0.5,
  },
  wasteTag: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 6,
    background: COLORS.bg.muted,
    color: COLORS.text.secondary,
    fontSize: 12,
    fontWeight: 600,
  },
  actions: {
    display: 'inline-flex',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
  },
  quickBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '5px 10px',
    border: '1px solid',
    background: '#fff',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.12s ease',
  },
  select: {
    padding: '5px 8px',
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
    fontSize: 12,
    color: COLORS.text.secondary,
    background: '#fff',
    cursor: 'pointer',
  },
};
