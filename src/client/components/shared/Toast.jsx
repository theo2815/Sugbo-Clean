import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { COLORS } from '../../../utils/constants';

const STYLES = {
  success: { bg: '#F0FDF4', border: COLORS.success, color: '#166534', Icon: CheckCircle2 },
  error: { bg: '#FEF2F2', border: COLORS.error, color: '#991B1B', Icon: AlertCircle },
};

export default function Toast({ message, type = 'success', duration = 3000, onClose }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const s = STYLES[type] || STYLES.success;

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '12px 16px',
      background: s.bg,
      border: `1px solid ${s.border}`,
      borderRadius: 10,
      boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
      fontSize: 14, fontWeight: 500, color: s.color,
      maxWidth: 380,
      animation: 'toast-slide-in 0.25s ease-out',
    }}>
      <s.Icon size={18} style={{ flexShrink: 0 }} />
      <span style={{ flex: 1 }}>{message}</span>
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss"
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: s.color, padding: 2, display: 'inline-flex',
          opacity: 0.6,
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
