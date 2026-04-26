import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, RefreshCw, Building2, CheckCircle2, Play,
  Sparkles, Files, Search, X, Inbox,
} from 'lucide-react';
import { getAllReports, updateReportStatus } from '../../services/api';
import { COLORS, STATUS } from '../../utils/constants';
import { formatDate } from '../../utils/helpers';
import StatusPill from '../../client/components/shared/StatusPill';
import SeverityPill from '../../client/components/shared/SeverityPill';
import EmptyState from '../../client/components/shared/EmptyState';
import Dropdown from '../../client/components/shared/Dropdown';
import ConfirmDialog from '../../client/components/shared/ConfirmDialog';
import Toast from '../../client/components/shared/Toast';
import { SkeletonRows } from '../../client/components/shared/Skeleton';
import ReportDetailDrawer from '../../client/components/admin/ReportDetailDrawer';

const NEXT_STATUS = {
  [STATUS.PENDING]: { label: 'Start', next: STATUS.IN_PROGRESS, icon: Play, color: COLORS.status.inProgress },
  [STATUS.IN_PROGRESS]: { label: 'Resolve', next: STATUS.RESOLVED, icon: CheckCircle2, color: COLORS.status.resolved },
};

const STATUS_FILTER_OPTIONS = [
  { value: 'ACTIVE', label: 'Active only' },
  { value: 'ALL', label: 'Include resolved' },
];

// Cluster = ≥2 reports sharing a root id (potential_duplicate_of_id || sys_id).
// Members are sorted newest-first by missed_date.
function deriveClusters(reports) {
  const groups = new Map();
  for (const r of reports) {
    const root = r.potential_duplicate_of_id || r.sys_id;
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(r);
  }
  const clusters = [];
  for (const [rootId, members] of groups) {
    if (members.length < 2) continue;
    members.sort((a, b) => new Date(b.missed_date) - new Date(a.missed_date));
    const reason = members.find((m) => m.duplicate_reason)?.duplicate_reason || '';
    clusters.push({
      id: rootId,
      members,
      reason,
      barangay: members[0].barangay || '—',
    });
  }
  return clusters;
}

function clusterIsActive(cluster) {
  return cluster.members.some((m) => m.status !== STATUS.RESOLVED);
}

export default function DuplicateReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [barangayFilter, setBarangayFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [detailId, setDetailId] = useState(null);
  const [updatingReportId, setUpdatingReportId] = useState(null);
  const [resolvingClusterId, setResolvingClusterId] = useState(null);
  const [confirmCluster, setConfirmCluster] = useState(null);
  const [toast, setToast] = useState(null);

  async function loadReports() {
    setError(null);
    try {
      const { result } = await getAllReports();
      setReports(result);
    } catch (err) {
      setError(err?.message || 'Failed to load reports. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadReports(); }, []);

  const clusters = useMemo(() => deriveClusters(reports), [reports]);

  const barangayOptions = useMemo(() => {
    const set = new Set(clusters.map((c) => c.barangay).filter(Boolean));
    return [
      { value: 'ALL', label: 'All barangays' },
      ...[...set].sort().map((b) => ({ value: b, label: b })),
    ];
  }, [clusters]);

  const filteredClusters = useMemo(() => {
    let out = clusters;
    if (statusFilter === 'ACTIVE') out = out.filter(clusterIsActive);
    if (barangayFilter !== 'ALL') out = out.filter((c) => c.barangay === barangayFilter);
    if (search.trim()) {
      const term = search.trim().toLowerCase();
      out = out.filter((c) => c.members.some((m) =>
        (m.report_code || '').toLowerCase().includes(term) ||
        (m.barangay || '').toLowerCase().includes(term)
      ));
    }
    return out;
  }, [clusters, statusFilter, barangayFilter, search]);

  const groupedByBarangay = useMemo(() => {
    const out = new Map();
    for (const c of filteredClusters) {
      if (!out.has(c.barangay)) out.set(c.barangay, []);
      out.get(c.barangay).push(c);
    }
    return [...out.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [filteredClusters]);

  const stats = useMemo(() => {
    let totalMembers = 0, pending = 0, inProgress = 0;
    for (const c of filteredClusters) {
      for (const m of c.members) {
        totalMembers++;
        if (m.status === STATUS.PENDING) pending++;
        else if (m.status === STATUS.IN_PROGRESS) inProgress++;
      }
    }
    return { clusters: filteredClusters.length, totalMembers, pending, inProgress };
  }, [filteredClusters]);

  const detail = useMemo(
    () => (detailId ? reports.find((r) => r.sys_id === detailId) || null : null),
    [detailId, reports]
  );

  async function handleStatusChange(report, newStatus) {
    setUpdatingReportId(report.sys_id);
    try {
      await updateReportStatus(report.sys_id, newStatus);
      window.dispatchEvent(new CustomEvent('sc:reports-changed'));
      await loadReports();
    } catch (err) {
      setToast({ type: 'error', message: err?.message || 'Failed to update status.' });
    } finally {
      setUpdatingReportId(null);
    }
  }

  async function handleResolveAllConfirm() {
    if (!confirmCluster) return;
    const activeMembers = confirmCluster.members.filter((m) => m.status !== STATUS.RESOLVED);
    setResolvingClusterId(confirmCluster.id);
    const results = await Promise.allSettled(
      activeMembers.map((m) => updateReportStatus(m.sys_id, STATUS.RESOLVED))
    );
    const failed = results.filter((r) => r.status === 'rejected').length;
    setResolvingClusterId(null);
    setConfirmCluster(null);
    if (failed === 0) {
      setToast({ type: 'success', message: `Resolved ${activeMembers.length} ${activeMembers.length === 1 ? 'report' : 'reports'}.` });
    } else if (failed === activeMembers.length) {
      setToast({ type: 'error', message: 'Failed to resolve cluster. Please try again.' });
    } else {
      setToast({ type: 'error', message: `Resolved ${activeMembers.length - failed}; ${failed} failed.` });
    }
    if (failed < activeMembers.length) {
      window.dispatchEvent(new CustomEvent('sc:reports-changed'));
    }
    await loadReports();
  }

  function clearFilters() {
    setSearch('');
    setBarangayFilter('ALL');
    setStatusFilter('ACTIVE');
  }

  const hasActiveFilters = search.trim() !== '' || barangayFilter !== 'ALL' || statusFilter !== 'ACTIVE';

  if (loading) {
    return (
      <div style={styles.page}>
        <PageHeader />
        <SkeletonRows rows={4} columns={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.page}>
        <PageHeader />
        <div role="alert" style={styles.errorBanner}>
          <span>{error}</span>
          <button onClick={loadReports} style={styles.errorRetry}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <PageHeader />

      <div style={styles.statStrip}>
        <Stat label="Clusters" value={stats.clusters} accent={COLORS.primary} />
        <Stat label="Reports" value={stats.totalMembers} accent={COLORS.text.primary} />
        <Stat label="Pending" value={stats.pending} accent={COLORS.status.pending} />
        <Stat label="In Progress" value={stats.inProgress} accent={COLORS.status.inProgress} />
      </div>

      <div style={styles.filterBar}>
        <div style={styles.searchWrap}>
          <Search size={14} style={styles.searchIcon} aria-hidden="true" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search SC-code or barangay…"
            aria-label="Search clusters"
            style={styles.searchInput}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Clear search"
              style={styles.searchClear}
            >
              <X size={14} />
            </button>
          )}
        </div>
        <Dropdown
          options={barangayOptions}
          value={barangayFilter}
          onChange={setBarangayFilter}
          size="sm"
          fullWidth={false}
        />
        <Dropdown
          options={STATUS_FILTER_OPTIONS}
          value={statusFilter}
          onChange={setStatusFilter}
          size="sm"
          fullWidth={false}
        />
        {hasActiveFilters && (
          <button type="button" onClick={clearFilters} style={styles.clearBtn}>
            Clear filters
          </button>
        )}
        <button
          type="button"
          onClick={loadReports}
          aria-label="Refresh"
          style={styles.refreshBtn}
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {filteredClusters.length === 0 ? (
        <EmptyState
          icon={hasActiveFilters ? Inbox : Files}
          title={hasActiveFilters ? 'No clusters match these filters' : 'No active duplicate clusters'}
          message={
            hasActiveFilters
              ? 'Try clearing filters or broadening your search.'
              : 'The AI flags clusters as residents submit related reports — check back later.'
          }
        />
      ) : (
        <div style={styles.sections}>
          {groupedByBarangay.map(([barangay, clustersInBarangay]) => {
            const reportsInBarangay = clustersInBarangay.reduce((sum, c) => sum + c.members.length, 0);
            return (
              <section key={barangay} style={styles.section}>
                <h2 style={styles.sectionHeader}>
                  <Building2 size={16} aria-hidden="true" style={{ color: COLORS.text.muted }} />
                  <span style={styles.sectionBarangay}>{barangay}</span>
                  <span style={styles.sectionMeta}>
                    · {clustersInBarangay.length} {clustersInBarangay.length === 1 ? 'cluster' : 'clusters'} · {reportsInBarangay} reports
                  </span>
                </h2>
                <div style={styles.cardList}>
                  {clustersInBarangay.map((cluster) => (
                    <ClusterCard
                      key={cluster.id}
                      cluster={cluster}
                      onJumpTo={setDetailId}
                      onStatusChange={handleStatusChange}
                      onResolveAll={() => setConfirmCluster(cluster)}
                      updatingReportId={updatingReportId}
                      isResolvingAll={resolvingClusterId === cluster.id}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <ReportDetailDrawer
        report={detail}
        onClose={() => setDetailId(null)}
        onStatusChange={(newStatus) => detail && handleStatusChange(detail, newStatus)}
        isUpdatingStatus={detail && updatingReportId === detail.sys_id}
        onJumpToReport={(targetSysId) => setDetailId(targetSysId)}
      />

      <ConfirmDialog
        open={!!confirmCluster}
        title={`Resolve cluster?`}
        message={
          confirmCluster
            ? `This marks ${confirmCluster.members.filter((m) => m.status !== STATUS.RESOLVED).length} active reports in ${confirmCluster.barangay} as Resolved. This cannot be undone.`
            : ''
        }
        confirmLabel={resolvingClusterId ? 'Resolving…' : 'Resolve all'}
        cancelLabel="Cancel"
        danger={false}
        loading={!!resolvingClusterId}
        onConfirm={handleResolveAllConfirm}
        onCancel={() => setConfirmCluster(null)}
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

function PageHeader() {
  return (
    <div style={styles.header}>
      <Link to="/admin/dashboard" style={styles.backLink}>
        <ArrowLeft size={14} aria-hidden="true" />
        Back to Reports
      </Link>
      <h1 style={styles.title}>Duplicate Reports</h1>
      <p style={styles.subtitle}>
        Reports the AI flagged as related, grouped by barangay. Triage and resolve clusters in one place.
      </p>
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div style={styles.stat}>
      <div style={{ ...styles.statValue, color: accent }}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  );
}

function ClusterCard({ cluster, onJumpTo, onStatusChange, onResolveAll, updatingReportId, isResolvingAll }) {
  const activeCount = cluster.members.filter((m) => m.status !== STATUS.RESOLVED).length;
  const allResolved = activeCount === 0;

  return (
    <article style={styles.clusterCard}>
      <div style={styles.clusterHeader}>
        <div style={styles.clusterTitle}>
          <Files size={14} aria-hidden="true" style={{ color: COLORS.text.muted }} />
          <span>{cluster.members.length} related {cluster.members.length === 1 ? 'report' : 'reports'}</span>
          {allResolved && <span style={styles.resolvedTag}>All resolved</span>}
        </div>
        <button
          type="button"
          onClick={onResolveAll}
          disabled={allResolved || isResolvingAll}
          style={{
            ...styles.resolveAllBtn,
            opacity: allResolved || isResolvingAll ? 0.5 : 1,
            cursor: allResolved || isResolvingAll ? 'default' : 'pointer',
          }}
          aria-label={`Resolve all ${activeCount} active reports in this cluster`}
        >
          <CheckCircle2 size={13} aria-hidden="true" />
          {isResolvingAll ? 'Resolving…' : `Resolve all (${activeCount})`}
        </button>
      </div>

      {cluster.reason && (
        <p style={styles.aiSummary}>
          <Sparkles size={12} aria-hidden="true" style={{ flexShrink: 0, marginTop: 3, color: COLORS.primary }} />
          <span>{cluster.reason}</span>
        </p>
      )}

      <ul style={styles.memberList}>
        {cluster.members.map((report) => {
          const next = NEXT_STATUS[report.status];
          const isUpdating = updatingReportId === report.sys_id;
          return (
            <li key={report.sys_id} style={styles.memberRow}>
              <div style={styles.memberMain}>
                <button
                  type="button"
                  onClick={() => onJumpTo(report.sys_id)}
                  style={styles.codeBtn}
                  aria-label={`Open details for ${report.report_code}`}
                >
                  {report.report_code}
                </button>
                <StatusPill status={report.status} />
                <SeverityPill level={report.ai_severity} size="sm" />
                <span style={styles.missedDate}>Missed {formatDate(report.missed_date)}</span>
              </div>
              <div style={styles.memberActions}>
                {next && (
                  <button
                    type="button"
                    onClick={() => onStatusChange(report, next.next)}
                    disabled={isUpdating}
                    style={{
                      ...styles.quickBtn,
                      borderColor: next.color,
                      color: next.color,
                      opacity: isUpdating ? 0.6 : 1,
                    }}
                    aria-label={`${next.label} ${report.report_code}`}
                  >
                    <next.icon size={13} aria-hidden="true" />
                    {next.label}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onJumpTo(report.sys_id)}
                  style={styles.viewBtn}
                  aria-label={`View ${report.report_code} detail`}
                >
                  View →
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </article>
  );
}

const styles = {
  page: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  backLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 13,
    fontWeight: 600,
    color: COLORS.secondary,
    textDecoration: 'none',
    width: 'fit-content',
    marginBottom: 4,
  },
  title: {
    margin: 0,
    fontSize: 22,
    fontWeight: 700,
    color: COLORS.text.primary,
  },
  subtitle: {
    margin: 0,
    fontSize: 13,
    color: COLORS.text.secondary,
    maxWidth: 640,
    lineHeight: 1.5,
  },
  statStrip: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: 12,
  },
  stat: {
    background: COLORS.bg.card,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 12,
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 700,
    lineHeight: 1.1,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: COLORS.text.muted,
  },
  filterBar: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
    padding: '12px 14px',
    background: COLORS.bg.card,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 12,
  },
  searchWrap: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    flex: '1 1 220px',
    maxWidth: 360,
  },
  searchIcon: {
    position: 'absolute',
    left: 10,
    color: COLORS.text.muted,
    pointerEvents: 'none',
  },
  searchInput: {
    width: '100%',
    padding: '8px 30px 8px 30px',
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
    fontSize: 13,
    color: COLORS.text.primary,
    background: COLORS.bg.card,
    outline: 'none',
    fontFamily: 'inherit',
  },
  searchClear: {
    position: 'absolute',
    right: 6,
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: COLORS.text.muted,
    padding: 4,
    display: 'inline-flex',
  },
  clearBtn: {
    padding: '6px 10px',
    border: 'none',
    background: 'transparent',
    color: COLORS.secondary,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  refreshBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 12px',
    border: `1px solid ${COLORS.border}`,
    background: COLORS.bg.card,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    color: COLORS.text.secondary,
    marginLeft: 'auto',
    fontFamily: 'inherit',
  },
  errorBanner: {
    padding: 14,
    border: `1px solid ${COLORS.error}`,
    background: '#FEF2F2',
    borderRadius: 10,
    color: COLORS.error,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
    fontSize: 14,
  },
  errorRetry: {
    padding: '6px 14px',
    borderRadius: 8,
    border: `1px solid ${COLORS.error}`,
    background: '#fff',
    color: COLORS.error,
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  sections: {
    display: 'flex',
    flexDirection: 'column',
    gap: 28,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    margin: 0,
    paddingBottom: 10,
    borderBottom: `1px solid ${COLORS.border}`,
    fontSize: 14,
    fontWeight: 700,
    color: COLORS.text.primary,
  },
  sectionBarangay: {
    color: COLORS.text.primary,
  },
  sectionMeta: {
    color: COLORS.text.muted,
    fontWeight: 500,
    fontSize: 13,
  },
  cardList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  clusterCard: {
    background: COLORS.bg.card,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 12,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  clusterHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    flexWrap: 'wrap',
  },
  clusterTitle: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13,
    fontWeight: 700,
    color: COLORS.text.primary,
  },
  resolvedTag: {
    padding: '2px 8px',
    borderRadius: 999,
    background: COLORS.primaryLight,
    color: COLORS.primaryDark,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  resolveAllBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 12px',
    border: `1px solid ${COLORS.status.resolved}`,
    background: COLORS.bg.card,
    color: COLORS.status.resolved,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    fontFamily: 'inherit',
  },
  aiSummary: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    margin: 0,
    padding: '10px 12px',
    background: COLORS.bg.page,
    borderRadius: 8,
    fontSize: 13,
    lineHeight: 1.5,
    color: COLORS.text.secondary,
    fontStyle: 'italic',
  },
  memberList: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  memberRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: '10px 12px',
    border: `1px solid ${COLORS.border}`,
    borderRadius: 10,
    background: COLORS.bg.page,
    flexWrap: 'wrap',
  },
  memberMain: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
    minWidth: 0,
  },
  memberActions: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  codeBtn: {
    background: 'transparent',
    border: 'none',
    padding: 0,
    color: COLORS.secondary,
    fontFamily: 'monospace',
    fontWeight: 700,
    fontSize: 13,
    letterSpacing: 0.5,
    cursor: 'pointer',
    textDecoration: 'underline dotted',
    textUnderlineOffset: 2,
  },
  missedDate: {
    fontSize: 12,
    color: COLORS.text.muted,
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
    fontFamily: 'inherit',
  },
  viewBtn: {
    padding: '5px 10px',
    border: `1px solid ${COLORS.border}`,
    background: COLORS.bg.card,
    color: COLORS.text.secondary,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
};
