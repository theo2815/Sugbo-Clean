import React from 'react';
import { useNavigate } from 'react-router-dom';
import { COLORS } from '../../utils/constants';
import Card from './shared/Card';

const ROUTES = {
    schedule: '/schedule',
    report: '/report',
    track: '/track',
    guide: '/waste-guide',
    haulers: '/haulers',
    map: '/route-map',
};

export default function ResidentHub() {
    const navigate = useNavigate();

    const primaryActions = [
        { id: 'schedule', title: 'View My Schedule', icon: '📅', color: COLORS.primary, desc: 'Check collection dates' },
        { id: 'report', title: 'Report Missed Pickup', icon: '⚠️', color: COLORS.secondary, desc: 'File a new report' },
        { id: 'track', title: 'Track My Report', icon: '🔍', color: COLORS.status.pending, desc: 'Check report status' },
    ];

    const secondaryActions = [
        { id: 'guide', title: 'Waste Sorting Guide', icon: '♻️', desc: 'Learn how to sort' },
        { id: 'haulers', title: 'Hauler Directory', icon: '🚛', desc: 'Contacts & routes' },
    ];

    return (
        <div style={{ padding: 20, maxWidth: 960, margin: '0 auto' }}>
            <header style={{ marginBottom: 30, textAlign: 'center' }}>
                <h2 style={{ color: COLORS.text.primary, fontSize: '1.8rem' }}>Maayong Adlaw!</h2>
                <p style={{ color: COLORS.text.muted }}>How can SugboClean help you today?</p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, marginBottom: 40 }}>
                {primaryActions.map((card) => (
                    <Card key={card.id} accentColor={card.color} onClick={() => navigate(ROUTES[card.id])} style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '3rem' }}>{card.icon}</span>
                        <h3 style={{ color: COLORS.text.primary }}>{card.title}</h3>
                        <p style={{ fontSize: 14, color: COLORS.text.muted, margin: 0 }}>{card.desc}</p>
                    </Card>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
                {secondaryActions.map((card) => (
                    <Card key={card.id} onClick={() => navigate(ROUTES[card.id])} style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                        <span style={{ fontSize: '2rem' }}>{card.icon}</span>
                        <div>
                            <h4 style={{ margin: 0, color: COLORS.text.primary }}>{card.title}</h4>
                            <p style={{ margin: 0, fontSize: 13, color: COLORS.text.muted }}>{card.desc}</p>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
