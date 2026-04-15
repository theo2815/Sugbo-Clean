import React from 'react';
import { updateReportStatus } from '../../../services/api';
import { COLORS, STATUS } from '../../../utils/constants';
import { formatDate } from '../../../utils/helpers';
import StatusPill from '../shared/StatusPill';

export default function ReportsTable({ reports, onStatusChange }) {
  async function handleStatusChange(report, newStatus) {
    await updateReportStatus(report.sys_id, newStatus);
    if (onStatusChange) onStatusChange();
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Reports ({reports.length})</h3>

      {reports.length === 0 ? (
        <p style={{ textAlign: 'center', color: COLORS.text.muted, padding: 30 }}>
          No reports found. Adjust your filters or check back later.
        </p>
      ) : (
        <div>
          {reports
            .slice()
            .sort((a, b) => new Date(b.missed_date) - new Date(a.missed_date))
            .map((report) => (
              <div key={report.sys_id} style={styles.row}>
                <div style={styles.left}>
                  <span style={styles.code}>{report.report_code}</span>
                  <span style={styles.barangay}>{report.barangay}</span>
                  <span style={styles.date}>{formatDate(report.missed_date)}</span>
                  <span style={styles.waste}>{report.waste_type}</span>
                </div>
                <div style={styles.right}>
                  <StatusPill status={report.status} />
                  <select
                    value={report.status}
                    onChange={(e) => handleStatusChange(report, e.target.value)}
                    aria-label={`Change status for ${report.report_code}`}
                    style={styles.select}
                  >
                    {Object.values(STATUS).map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    background: COLORS.bg.card,
    padding: 16,
    borderRadius: 10,
    border: `1px solid ${COLORS.border}`,
  },
  title: {
    marginBottom: 12,
    marginTop: 0,
    fontSize: 16,
    fontWeight: 600,
    color: COLORS.text.primary,
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 8px',
    borderBottom: `1px solid ${COLORS.bg.muted}`,
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  left: {
    display: 'flex',
    gap: 16,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  code: {
    fontFamily: 'monospace',
    fontSize: 13,
    color: COLORS.text.primary,
    fontWeight: 600,
  },
  barangay: {
    color: COLORS.text.secondary,
    fontSize: 14,
  },
  date: {
    color: COLORS.text.muted,
    fontSize: 13,
  },
  waste: {
    color: COLORS.text.muted,
    fontSize: 13,
  },
  select: {
    padding: '4px 8px',
    border: `1px solid ${COLORS.border}`,
    borderRadius: 6,
    fontSize: 12,
    color: COLORS.text.secondary,
  },
};
