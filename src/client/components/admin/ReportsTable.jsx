import React, { useState, useEffect, useMemo } from 'react';
import { Play, CheckCircle2, Inbox, Trash2 } from 'lucide-react';
import { updateReportStatus, deleteReport } from '../../../services/api';
import { COLORS, STATUS } from '../../../utils/constants';
import { formatDate } from '../../../utils/helpers';
import StatusPill from '../shared/StatusPill';
import SeverityPill from '../shared/SeverityPill';
import LanguageBadge from '../shared/LanguageBadge';
import EmptyState from '../shared/EmptyState';
import Dropdown from '../shared/Dropdown';
import ConfirmDialog from '../shared/ConfirmDialog';
import Toast from '../shared/Toast';
import ReportDetailDrawer from './ReportDetailDrawer';

const STATUS_ORDER = [STATUS.PENDING, STATUS.IN_PROGRESS, STATUS.RESOLVED];
const STATUS_SORT_RANK = { [STATUS.PENDING]: 0, [STATUS.IN_PROGRESS]: 1, [STATUS.RESOLVED]: 2 };

function allowedStatusOptions(current) {
  const idx = STATUS_ORDER.indexOf(current);
  const from = idx === -1 ? 0 : idx;
  return STATUS_ORDER.slice(from).map((s) => ({ value: s, label: s }));
}

const NEXT_STATUS = {
  [STATUS.PENDING]: { label: 'Start', next: STATUS.IN_PROGRESS, icon: Play, color: COLORS.status.inProgress },
  [STATUS.IN_PROGRESS]: { label: 'Resolve', next: STATUS.RESOLVED, icon: CheckCircle2, color: COLORS.status.resolved },
};

export default function ReportsTable({ reports, onReportsChange }) {
  const [updatingId, setUpdatingId] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [statusError, setStatusError] = useState(null);
  const [selected, setSelected] = useState(() => new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(null);

  const sorted = useMemo(() => reports.slice().sort((a, b) => {
    const sa = STATUS_SORT_RANK[a.status] ?? 99;
    const sb = STATUS_SORT_RANK[b.status] ?? 99;
    if (sa !== sb) return sa - sb;
    return new Date(b.missed_date) - new Date(a.missed_date);
  }), [reports]);

  // Derive the open drawer's report from the live list so status updates re-render it.
  const detail = useMemo(
    () => (detailId ? reports.find((r) => r.sys_id === detailId) || null : null),
    [detailId, reports]
  );

  // Drop any selected ids that are no longer visible (filter change or post-reload).
  useEffect(() => {
    const visible = new Set(reports.map((r) => r.sys_id));
    setSelected((prev) => {
      let changed = false;
      const next = new Set();
      for (const id of prev) {
        if (visible.has(id)) next.add(id);
        else changed = true;
      }
      return changed ? next : prev;
    });
  }, [reports]);

  const allSelected = sorted.length > 0 && sorted.every((r) => selected.has(r.sys_id));
  const someSelected = selected.size > 0 && !allSelected;

  function toggleOne(sysId) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(sysId)) next.delete(sysId);
      else next.add(sysId);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => {
      if (sorted.every((r) => prev.has(r.sys_id))) return new Set();
      return new Set(sorted.map((r) => r.sys_id));
    });
  }

  function clearSelection() { setSelected(new Set()); }

  async function setStatus(report, newStatus) {
    setUpdatingId(report.sys_id);
    setStatusError(null);
    try {
      await updateReportStatus(report.sys_id, newStatus);
      if (onReportsChange) await onReportsChange();
    } catch (err) {
      setStatusError(err?.message || 'Failed to update status. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleBulkDelete() {
    const ids = Array.from(selected);
    setDeleting(true);
    const results = await Promise.allSettled(ids.map((id) => deleteReport(id)));
    const failed = results.filter((r) => r.status === 'rejected').length;
    setDeleting(false);
    setConfirmOpen(false);
    if (failed === 0) {
      setToast({ type: 'success', message: `Deleted ${ids.length} ${ids.length === 1 ? 'report' : 'reports'}.` });
    } else if (failed === ids.length) {
      setToast({ type: 'error', message: `Failed to delete ${failed} ${failed === 1 ? 'report' : 'reports'}. Please try again.` });
    } else {
      setToast({ type: 'error', message: `Deleted ${ids.length - failed}; ${failed} failed. Please retry the remaining.` });
    }
    clearSelection();
    if (onReportsChange) await onReportsChange();
  }

  return (
    <div style={styles.container}>
      {statusError && (
        <div role="alert" style={{
          padding: '10px 16px', background: '#FEF2F2', borderBottom: `1px solid ${COLORS.error}`,
          color: COLORS.error, fontSize: 13, display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', gap: 8,
        }}>
          <span>{statusError}</span>
          <button
            onClick={() => setStatusError(null)}
            style={{
              background: 'none', border: 'none', color: COLORS.error,
              cursor: 'pointer', fontWeight: 600, fontSize: 12,
            }}
          >
            Dismiss
          </button>
        </div>
      )}
      <div style={styles.header}>
        <div>
          <h3 style={styles.title}>Reports</h3>
          <p style={styles.subtitle}>Pending first, then In Progress, then Resolved. Click status to advance.</p>
        </div>
        <span style={styles.countPill}>{reports.length}</span>
      </div>

      {selected.size > 0 && (
        <div style={styles.bulkBar} role="region" aria-label="Bulk actions">
          <span style={styles.bulkCount}>
            {selected.size} selected
          </span>
          <div style={styles.bulkActions}>
            <button
              type="button"
              onClick={clearSelection}
              style={styles.bulkCancel}
              disabled={deleting}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              style={styles.bulkDelete}
              disabled={deleting}
              aria-label={`Delete ${selected.size} selected reports`}
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        </div>
      )}

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
                <th style={{ ...styles.th, ...styles.checkCol }}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => { if (el) el.indeterminate = someSelected; }}
                    onChange={toggleAll}
                    aria-label={allSelected ? 'Deselect all reports' : 'Select all reports'}
                    style={styles.checkbox}
                  />
                </th>
                <th style={styles.th}>Code</th>
                <th style={styles.th}>Barangay</th>
                <th style={styles.th}>Missed Date</th>
                <th style={styles.th}>Submitted</th>
                <th style={styles.th}>Waste Type</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>AI Severity</th>
                <th style={styles.th}>Language</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((report) => {
                const next = NEXT_STATUS[report.status];
                const isUpdating = updatingId === report.sys_id;
                const isChecked = selected.has(report.sys_id);
                return (
                  <tr
                    key={report.sys_id}
                    style={{
                      ...styles.tr,
                      background: isChecked ? COLORS.primaryLight : 'transparent',
                    }}
                    onMouseOver={(e) => {
                      if (!isChecked) e.currentTarget.style.background = COLORS.bg.muted;
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = isChecked ? COLORS.primaryLight : 'transparent';
                    }}
                  >
                    <td style={{ ...styles.td, ...styles.checkCol }}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleOne(report.sys_id)}
                        aria-label={`Select ${report.report_code}`}
                        style={styles.checkbox}
                      />
                    </td>
                    <td style={{ ...styles.td, ...styles.code }}>
                      <button
                        type="button"
                        onClick={() => setDetailId(report.sys_id)}
                        style={styles.codeBtn}
                        aria-label={`Open details for ${report.report_code}`}
                      >
                        {report.report_code}
                      </button>
                    </td>
                    <td style={styles.td}>{report.barangay}</td>
                    <td style={{ ...styles.td, color: COLORS.text.secondary }}>
                      {formatDate(report.missed_date)}
                    </td>
                    <td style={{ ...styles.td, color: COLORS.text.secondary }}>
                      {formatDate(report.created_on)}
                    </td>
                    <td style={styles.td}>
                      <span style={styles.wasteTag}>{report.waste_type}</span>
                    </td>
                    <td style={styles.td}>
                      <StatusPill status={report.status} />
                    </td>
                    <td style={styles.td}>
                      <SeverityPill level={report.ai_severity} size="sm" />
                    </td>
                    <td style={styles.td}>
                      <LanguageBadge lang={report.description_lang} size="sm" />
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
                        <Dropdown
                          options={allowedStatusOptions(report.status)}
                          value={report.status}
                          onChange={(v) => setStatus(report, v)}
                          disabled={isUpdating || report.status === STATUS.RESOLVED}
                          size="sm"
                          fullWidth={false}
                          align="right"
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ReportDetailDrawer
        report={detail}
        onClose={() => setDetailId(null)}
        onStatusChange={(newStatus) => detail && setStatus(detail, newStatus)}
        isUpdatingStatus={detail && updatingId === detail.sys_id}
      />

      <ConfirmDialog
        open={confirmOpen}
        title={`Delete ${selected.size} ${selected.size === 1 ? 'report' : 'reports'}?`}
        message="This permanently removes the selected reports from ServiceNow. This action cannot be undone."
        confirmLabel={deleting ? 'Deleting…' : `Delete ${selected.size}`}
        loading={deleting}
        onConfirm={handleBulkDelete}
        onCancel={() => setConfirmOpen(false)}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
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
  bulkBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 20px',
    background: COLORS.primaryLight,
    borderBottom: `1px solid ${COLORS.border}`,
    gap: 12,
    flexWrap: 'wrap',
  },
  bulkCount: {
    fontSize: 13,
    fontWeight: 600,
    color: COLORS.primaryDark,
  },
  bulkActions: {
    display: 'inline-flex',
    gap: 8,
    alignItems: 'center',
  },
  bulkCancel: {
    padding: '6px 12px',
    border: `1px solid ${COLORS.border}`,
    background: '#fff',
    color: COLORS.text.secondary,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  },
  bulkDelete: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 12px',
    border: `1px solid ${COLORS.error}`,
    background: COLORS.error,
    color: '#fff',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  },
  tableWrap: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: 1040,
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
  checkCol: {
    width: 40,
    padding: '12px 8px 12px 16px',
  },
  checkbox: {
    cursor: 'pointer',
    width: 16,
    height: 16,
    accentColor: COLORS.primary,
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
  codeBtn: {
    background: 'transparent',
    border: 'none',
    padding: 0,
    color: COLORS.secondary,
    font: 'inherit',
    cursor: 'pointer',
    textDecoration: 'underline dotted',
    textUnderlineOffset: 2,
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
};
