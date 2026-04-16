import React, { useEffect, useState } from 'react';
import { X, Paperclip, Download } from 'lucide-react';
import { getReportAttachments } from '../../../services/api';
import { COLORS } from '../../../utils/constants';
import { formatDate } from '../../../utils/helpers';
import StatusPill from '../shared/StatusPill';

function formatBytes(n) {
  if (!n) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ReportDetailDrawer({ report, onClose }) {
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose?.(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!report) return null;

  return (
    <div role="dialog" aria-modal="true" aria-label="Report detail" style={styles.backdrop} onClick={onClose}>
      <aside style={styles.panel} onClick={(e) => e.stopPropagation()}>
        <header style={styles.header}>
          <div>
            <div style={styles.code}>{report.report_code}</div>
            <div style={{ marginTop: 4 }}><StatusPill status={report.status} /></div>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} style={styles.closeBtn}>
            <X size={18} />
          </button>
        </header>

        <dl style={styles.dl}>
          <Row label="Barangay" value={report.barangay} />
          <Row label="Waste Type" value={report.waste_type} />
          <Row label="Missed Date" value={formatDate(report.missed_date)} />
          <Row label="Email" value={report.email || '—'} />
          <Row label="Description" value={report.description || '—'} wide />
        </dl>

        <section>
          <h4 style={styles.sectionTitle}><Paperclip size={14} /> Attachments</h4>
          {loading && <p style={styles.muted}>Loading attachments…</p>}
          {error && <p role="alert" style={{ ...styles.muted, color: COLORS.error }}>{error}</p>}
          {!loading && !error && attachments.length === 0 && (
            <p style={styles.muted}>No photos attached to this report.</p>
          )}
          {attachments.map((a) => {
            const isImage = (a.content_type || '').startsWith('image/');
            return (
              <div key={a.sys_id} style={styles.attachment}>
                {isImage && (
                  <img
                    src={a.download_url}
                    alt={a.file_name}
                    style={styles.thumb}
                    loading="lazy"
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={styles.fileName}>{a.file_name}</div>
                  <div style={styles.muted}>{formatBytes(a.size_bytes)} · {a.content_type}</div>
                </div>
                <a href={a.download_url} target="_blank" rel="noreferrer" style={styles.dlBtn}>
                  <Download size={13} /> Open
                </a>
              </div>
            );
          })}
        </section>
      </aside>
    </div>
  );
}

function Row({ label, value, wide }) {
  return (
    <div style={{ gridColumn: wide ? '1 / -1' : 'auto' }}>
      <dt style={styles.dt}>{label}</dt>
      <dd style={styles.dd}>{value}</dd>
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
  muted: { margin: '4px 0', fontSize: 13, color: COLORS.text.muted },
  attachment: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: 10, border: `1px solid ${COLORS.border}`, borderRadius: 10,
    marginBottom: 8, background: COLORS.bg.page,
  },
  thumb: { width: 56, height: 56, objectFit: 'cover', borderRadius: 8, flexShrink: 0 },
  fileName: { fontSize: 13, fontWeight: 600, color: COLORS.text.primary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  dlBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '6px 10px', border: `1px solid ${COLORS.border}`, borderRadius: 8,
    color: COLORS.secondary, fontSize: 12, fontWeight: 600, textDecoration: 'none',
    background: COLORS.bg.card,
  },
};
