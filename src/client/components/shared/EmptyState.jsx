import React from 'react';
import { COLORS } from '../../../utils/constants';

export default function EmptyState({
    icon: Icon,
    title,
    message,
    action,
    tone = 'muted',
}) {
    const tones = {
        muted: { bg: COLORS.bg.muted, color: COLORS.text.muted },
        info: { bg: COLORS.secondaryLight, color: COLORS.secondary },
        warn: { bg: '#FEF3C7', color: COLORS.warning },
    };
    const t = tones[tone] || tones.muted;

    return (
        <div
            role="status"
            style={{
                textAlign: 'center',
                padding: '32px 20px',
                border: `1px dashed ${COLORS.border}`,
                borderRadius: 12,
                background: COLORS.bg.card,
            }}
        >
            {Icon && (
                <div style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: t.bg,
                    color: t.color,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 12,
                }}>
                    <Icon size={26} />
                </div>
            )}
            {title && (
                <h3 style={{ margin: '0 0 6px', color: COLORS.text.primary, fontSize: '1.05rem' }}>
                    {title}
                </h3>
            )}
            {message && (
                <p style={{ margin: 0, color: COLORS.text.secondary, fontSize: 14, lineHeight: 1.5 }}>
                    {message}
                </p>
            )}
            {action && <div style={{ marginTop: 16 }}>{action}</div>}
        </div>
    );
}
