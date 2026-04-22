import React, { useEffect, useState } from 'react';
import { X, Paperclip, Download, Play, CheckCircle2, Sparkles } from 'lucide-react';
import { getReportAttachments } from '../../../services/api';
import { COLORS, STATUS } from '../../../utils/constants';
import { formatDate } from '../../../utils/helpers';
import StatusPill from '../shared/StatusPill';
import SeverityPill from '../shared/SeverityPill';
import LanguageBadge, { LANGUAGE_LABELS } from '../shared/LanguageBadge';
import Dropdown from '../shared/Dropdown';
import ImageViewer from '../shared/ImageViewer';

const STATUS_ORDER = [STATUS.PENDING, STATUS.IN_PROGRESS, STATUS.RESOLVED];

function allowedStatusOptions(current) {
  const idx = STATUS_ORDER.indexOf(current);
  const from = idx === -1 ? 0 : idx;
  return STATUS_ORDER.slice(from).map((s) => ({ value: s, label: s }));
}

const NEXT_STATUS = {
  [STATUS.PENDING]: { label: 'Start', next: STATUS.IN_PROGRESS, icon: Play, color: COLORS.status.inProgress },
  [STATUS.IN_PROGRESS]: { label: 'Resolve', next: STATUS.RESOLVED, icon: CheckCircle2, color: COLORS.status.resolved },
};

function formatBytes(n) {
  if (!n) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ReportDetailDrawer({ report, onClose, onStatusChange, isUpdatingStatus }) {
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [viewerIndex, setViewerIndex] = useState(null);

  useEffect(() => {
    if (!report) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const { result } = await getReportAttachments(report.sys_id);
        if (!cancelled) setAttachments(result);
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Failed to load attachments.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [report]);

  // ESC closes the drawer — but not while ImageViewer is open (it owns ESC then).
  useEffect(() => {
    if (!report || viewerIndex !== null) return;
    function onKey(e) { if (e.key === 'Escape') onClose?.(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [report, viewerIndex, onClose]);

  if (!report) return null;

  const imageAttachments = attachments
    .filter((a) => (a.content_type || '').startsWith('image/'))
    .map((a) => ({ url: a.download_url, name: a.file_name, sys_id: a.sys_id }));

  const next = NEXT_STATUS[report.status];
  const isResolved = report.status === STATUS.RESOLVED;

  return (
    <>
      <div role="dialog" aria-modal="true" aria-label="Report detail" style={styles.backdrop} onClick={onClose}>
        <aside style={styles.panel} onClick={(e) => e.stopPropagation()}>
          <header style={styles.header}>
            <div>
              <div style={styles.code}>{report.report_code}</div>
              <div style={styles.headerPills}>
                <StatusPill status={report.status} />
                <LanguageBadge lang={report.description_lang} size="sm" />
              </div>
            </div>
            <button type="button" aria-label="Close" onClick={onClose} style={styles.closeBtn}>
              <X size={18} />
            </button>
          </header>

          <dl style={styles.dl}>
            <Row label="Barangay" value={report.barangay} />
            <Row label="Waste Type" value={report.waste_type} />
            <Row label="Missed Date" value={formatDate(report.missed_date)} />
            <Row label="Submitted" value={formatDate(report.created_on)} />
            <Row label="Email" value={report.email || '—'} wide breakAll />
            {report.description_lang && report.description_lang !== 'en' && report.description_en ? (
              <>
                <Row
                  label={`Original (${LANGUAGE_LABELS[report.description_lang] || 'Non-English'})`}
                  value={report.description || '—'}
                  wide
                  preserveLines
                />
                <Row
                  label="English Translation"
                  value={report.description_en}
                  wide
                  preserveLines
                />
              </>
            ) : (
              <Row label="Description" value={report.description || '—'} wide preserveLines />
            )}
          </dl>

          <section style={styles.aiSection}>
            <h4 style={styles.sectionTitle}><Sparkles size={14} /> AI Analysis</h4>
            {report.ai_severity || report.ai_summary ? (
              <>
                <div style={{ marginBottom: 8 }}>
                  <SeverityPill level={report.ai_severity} />
                </div>
                {report.ai_summary && (
                  <p style={styles.aiSummary}>{report.ai_summary}</p>
                )}
                <p style={styles.aiDisclaimer}>
                  AI-generated — draft only, not ground truth.
                </p>
              </>
            ) : (
              <p style={styles.muted}>No AI analysis yet. Classification runs automatically within a few seconds of submission.</p>
            )}
          </section>

          <section style={styles.actionsSection}>
            <h4 style={styles.sectionTitle}>Update Status</h4>
            <div style={styles.actionsRow}>
              {next && (
                <button
                  type="button"
                  onClick={() => onStatusChange?.(next.next)}
                  disabled={isUpdatingStatus}
                  style={{
                    ...styles.quickBtn,
                    borderColor: next.color,
                    color: next.color,
                    opacity: isUpdatingStatus ? 0.6 : 1,
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
                onChange={(v) => onStatusChange?.(v)}
                disabled={isUpdatingStatus || isResolved}
                size="sm"
                fullWidth={false}
              />
            </div>
            {isResolved && (
              <p style={styles.muted}>This report is resolved. Status is forward-only and cannot be changed.</p>
            )}
          </section>

          <section>
            <h4 style={styles.sectionTitle}><Paperclip size={14} /> Attachments</h4>
            {loading && <p style={styles.muted}>Loading attachments…</p>}
            {error && <p role="alert" style={{ ...styles.muted, color: COLORS.error }}>{error}</p>}
            {!loading && !error && attachments.length === 0 && (
              <p style={styles.muted}>No photos attached to this report.</p>
            )}
            {attachments.map((a) => {
              const isImage = (a.content_type || '').startsWith('image/');
              const imageIdx = isImage ? imageAttachments.findIndex((img) => img.sys_id === a.sys_id) : -1;
              return (
                <div key={a.sys_id} style={styles.attachment}>
                  {isImage && (
                    <button
                      type="button"
                      onClick={() => setViewerIndex(imageIdx)}
                      aria-label={`Preview ${a.file_name}`}
                      style={styles.thumbBtn}
                    >
                      <img src={a.download_url} alt={a.file_name} style={styles.thumb} loading="lazy" />
                    </button>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={styles.fileName}>{a.file_name}</div>
                    <div style={styles.muted}>{formatBytes(a.size_bytes)} · {a.content_type}</div>
                  </div>
                  <a href={a.download_url} target="_blank" rel="noreferrer" style={styles.dlBtn}>
                    <Download size={13} /> {isImage ? 'Download' : 'Open'}
                  </a>
                </div>
              );
            })}
          </section>
        </aside>
      </div>

      {viewerIndex !== null && (
        <ImageViewer
          images={imageAttachments}
          initialIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}
    </>
  );
}

function Row({ label, value, wide, preserveLines, breakAll }) {
  return (
    <div style={{ gridColumn: wide ? '1 / -1' : 'auto' }}>
      <dt style={styles.dt}>{label}</dt>
      <dd style={{
        ...styles.dd,
        ...(preserveLines ? { whiteSpace: 'pre-wrap' } : null),
        ...(breakAll ? { overflowWrap: 'anywhere' } : null),
      }}>{value}</dd>
    </div>
  );
}

const styles = {
  backdrop: {
    position: 'fixed', inset: 0, zIndex: 1000,
    background: 'rgba(15, 23, 42, 0.45)',
    display: 'flex', justifyContent: 'flex-end',
  },
  panel: {
    width: 'min(440px, 100%)',
    height: '100%',
    background: COLORS.bg.card,
    padding: 22,
    overflowY: 'auto',
    boxShadow: '-8px 0 24px rgba(15, 23, 42, 0.2)',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: 12, marginBottom: 18, paddingBottom: 14,
    borderBottom: `1px solid ${COLORS.border}`,
  },
  code: { fontFamily: 'monospace', fontWeight: 700, fontSize: 17, color: COLORS.text.primary, letterSpacing: 1 },
  headerPills: { marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  closeBtn: {
    background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 8,
    padding: 6, cursor: 'pointer', color: COLORS.text.secondary,
  },
  dl: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14,
    margin: '0 0 22px',
  },
  dt: { fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: COLORS.text.muted, marginBottom: 4 },
  dd: { margin: 0, fontSize: 14, color: COLORS.text.primary, wordBreak: 'break-word' },
  sectionTitle: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    margin: '0 0 10px', fontSize: 13, color: COLORS.text.secondary,
    textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700,
  },
  actionsSection: {
    margin: '0 0 22px', padding: '14px 14px 16px',
    border: `1px solid ${COLORS.border}`, borderRadius: 10,
    background: COLORS.bg.page,
  },
  aiSection: {
    margin: '0 0 22px', padding: '14px 14px 16px',
    border: `1px solid ${COLORS.border}`, borderRadius: 10,
    background: COLORS.bg.page,
  },
  aiSummary: {
    margin: '0 0 8px', fontSize: 13, lineHeight: 1.5,
    color: COLORS.text.primary,
    whiteSpace: 'pre-wrap', overflowWrap: 'anywhere',
  },
  aiDisclaimer: {
    margin: 0, fontSize: 11, color: COLORS.text.muted,
    fontStyle: 'italic',
  },
  actionsRow: {
    display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
  },
  quickBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '5px 10px', border: '1px solid', background: '#fff',
    borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
    transition: 'background 0.12s ease',
  },
  muted: { margin: '4px 0', fontSize: 13, color: COLORS.text.muted },
  attachment: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: 10, border: `1px solid ${COLORS.border}`, borderRadius: 10,
    marginBottom: 8, background: COLORS.bg.page,
  },
  thumbBtn: {
    padding: 0, border: 'none', background: 'transparent', cursor: 'pointer',
    borderRadius: 8, lineHeight: 0,
  },
  thumb: { width: 56, height: 56, objectFit: 'cover', borderRadius: 8, flexShrink: 0, display: 'block' },
  fileName: { fontSize: 13, fontWeight: 600, color: COLORS.text.primary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  dlBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '6px 10px', border: `1px solid ${COLORS.border}`, borderRadius: 8,
    color: COLORS.secondary, fontSize: 12, fontWeight: 600, textDecoration: 'none',
    background: COLORS.bg.card,
  },
};
