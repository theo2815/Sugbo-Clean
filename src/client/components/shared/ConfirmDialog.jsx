import React, { useEffect } from 'react';
import { COLORS } from '../../../utils/constants';
import Button from './Button';

export default function ConfirmDialog({
  open,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  danger = true,
  loading = false,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e) { if (e.key === 'Escape' && !loading) onCancel?.(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, loading, onCancel]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      style={styles.backdrop}
      onClick={() => !loading && onCancel?.()}
    >
      <div style={styles.card} onClick={(e) => e.stopPropagation()}>
        <h3 style={styles.title}>{title}</h3>
        {message && <p style={styles.message}>{message}</p>}
        <div style={styles.actions}>
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            size="sm"
            onClick={onConfirm}
            loading={loading}
            disabled={loading}
            style={danger ? { background: COLORS.error, borderColor: COLORS.error } : undefined}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    // 1200 to sit above the sticky Navbar (zIndex 1100). Matches ReportDetailDrawer.
    position: 'fixed', inset: 0, zIndex: 1200,
    background: 'rgba(15, 23, 42, 0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 16,
  },
  card: {
    background: COLORS.bg.card, borderRadius: 12,
    padding: '20px 22px', width: '100%', maxWidth: 420,
    boxShadow: '0 20px 48px rgba(15, 23, 42, 0.25)',
  },
  title: { margin: 0, fontSize: 17, color: COLORS.text.primary, fontWeight: 700 },
  message: { margin: '8px 0 18px', fontSize: 14, color: COLORS.text.secondary, lineHeight: 1.5 },
  actions: { display: 'flex', gap: 8, justifyContent: 'flex-end' },
};
