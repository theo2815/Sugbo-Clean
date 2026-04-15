import React from 'react';
import { COLORS } from '../../utils/constants';
import Card from './shared/Card';

export default function SugboLanding({ onViewChange }) {
    const mainActions = [
        { id: 'resident', title: 'Resident Services', icon: '🏠', color: COLORS.primary, desc: 'Schedules, Guides, and Reports' },
        { id: 'admin', title: 'LGU Admin Portal', icon: '📋', color: COLORS.secondary, desc: 'Manage Reports and Incidents' },
    ];

    return (
        <div style={{ textAlign: 'center', padding: '50px 20px' }}>
            <h1 style={{ color: COLORS.secondary, fontSize: '2.5rem', margin: 0 }}>
                Sugbo<span style={{ color: COLORS.primary }}>Clean</span>
            </h1>
            <p style={{ color: COLORS.text.muted, marginBottom: 40 }}>Select a portal to continue</p>

            <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
                {mainActions.map((action) => (
                    <Card
                        key={action.id}
                        accentColor={action.color}
                        onClick={() => onViewChange(action.id)}
                        style={{ width: 300, textAlign: 'center' }}
                    >
                        <span style={{ fontSize: '3rem' }}>{action.icon}</span>
                        <h3 style={{ margin: '15px 0', color: COLORS.text.primary }}>{action.title}</h3>
                        <p style={{ fontSize: 14, color: COLORS.text.muted, margin: 0 }}>{action.desc}</p>
                    </Card>
                ))}
            </div>
        </div>
    );
}
