import React from 'react';
import { COLORS } from '../../../utils/constants';
import BackButton from './BackButton';

export default function PageHeader({
    icon: Icon,
    title,
    subtitle,
    accent = COLORS.primary,
    backTo = '/',
    backLabel = 'Back to Home',
    actions,
}) {
    return (
        <header style={{ marginBottom: 24 }}>
            <BackButton to={backTo} label={backLabel} />
            <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 16,
                flexWrap: 'wrap',
            }}>
                {Icon && (
                    <div style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        background: `${accent}1A`,
                        color: accent,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}>
                        <Icon size={24} />
                    </div>
                )}
                <div style={{ flex: 1, minWidth: 220 }}>
                    <h1 style={{
                        margin: 0,
                        fontSize: 'clamp(1.4rem, 2.6vw, 1.75rem)',
                        color: COLORS.text.primary,
                        lineHeight: 1.2,
                        fontWeight: 700,
                    }}>
                        {title}
                    </h1>
                    {subtitle && (
                        <p style={{
                            margin: '6px 0 0',
                            color: COLORS.text.secondary,
                            fontSize: 14,
                            lineHeight: 1.5,
                        }}>
                            {subtitle}
                        </p>
                    )}
                </div>
                {actions && <div style={{ marginLeft: 'auto' }}>{actions}</div>}
            </div>
        </header>
    );
}
