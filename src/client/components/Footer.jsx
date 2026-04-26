import React from 'react';
import { COLORS } from '../../utils/constants';

export default function Footer() {
    return (
        <footer style={{
            marginTop: 'auto',
            padding: '20px 5%',
            background: COLORS.bg.muted,
            borderTop: `1px solid ${COLORS.border}`,
            textAlign: 'center',
        }}>
            <p style={{ margin: 0, fontWeight: 500, color: COLORS.text.primary }}>
                "Keeping Sugbo clean, one pickup at a time."
            </p>
            <div style={{ marginTop: 10, fontSize: '0.85rem', color: COLORS.text.muted }}>
                <p style={{ margin: '2px 0' }}>LGU Cebu City Sanitation Office | Support: (032) 123-4567</p>
                <p style={{ margin: '2px 0' }}>2026 SugboClean Project</p>
            </div>
        </footer>
    );
}
