import React from 'react';

export default function ResidentHub({ onNavigate }) {
    const primaryActions = [
        { id: 'schedule', title: 'View My Schedule', icon: '📅', color: '#4caf50', desc: 'Check collection dates' },
        { id: 'report', title: 'Report Missed Pickup', icon: '⚠️', color: '#2196f3', desc: 'File a new report' },
        { id: 'track', title: 'Track My Report', icon: '🔍', color: '#ff9800', desc: 'Check report status' }
    ];

    const secondaryActions = [
        { id: 'guide', title: 'Waste Sorting Guide', icon: '♻️', desc: 'Learn how to sort' },
        { id: 'map', title: 'Hauler & Routes', icon: '🚚', desc: 'View truck paths' }
    ];

    return (
        <div className="resident-hub">
            <header style={{ marginBottom: '30px', textAlign: 'center' }}>
                <h2 style={{ color: '#2c3e50', fontSize: '1.8rem' }}>Maayong Adlaw!</h2>
                <p style={{ color: '#666' }}>How can SugboClean help you today?</p>
            </header>

            {/* Primary 3-Column Grid */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
                gap: '20px',
                marginBottom: '40px' 
            }}>
                {primaryActions.map(card => (
                    <div key={card.id} className="card" onClick={() => onNavigate(card.id)} 
                        style={{ cursor: 'pointer', borderTop: `6px solid ${card.color}`, textAlign: 'center' }}>
                        <span style={{ fontSize: '3rem' }}>{card.icon}</span>
                        <h3>{card.title}</h3>
                        <p style={{ fontSize: '14px', color: '#777' }}>{card.desc}</p>
                    </div>
                ))}
            </div>

            {/* Secondary 2-Column Grid */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
                gap: '20px' 
            }}>
                {secondaryActions.map(card => (
                    <div key={card.id} className="card" onClick={() => onNavigate(card.id)} 
                        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <span style={{ fontSize: '2rem' }}>{card.icon}</span>
                        <div>
                            <h4 style={{ margin: 0 }}>{card.title}</h4>
                            <p style={{ margin: 0, fontSize: '13px', color: '#777' }}>{card.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}