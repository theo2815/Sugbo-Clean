import React from 'react';

export default function SugboLanding({ onViewChange }) {
    const mainActions = [
        { id: 'resident', title: 'Resident Services', icon: '🏠', color: '#4caf50', desc: 'Schedules, Guides, and Reports' },
        { id: 'admin', title: 'LGU Admin Portal', icon: '📋', color: '#004a99', desc: 'Manage Reports and Incidents' }
    ];

    return (
        <div className="page-container" style={{ textAlign: 'center', padding: '50px 20px' }}>
            <h1 style={{ color: '#004a99', fontSize: '2.5rem' }}>Sugbo<span>Clean</span></h1>
            <p style={{ color: '#666', marginBottom: '40px' }}>Select a portal to continue</p>
            
            <div style={{ 
                display: 'flex', 
                gap: '20px', 
                justifyContent: 'center', 
                flexWrap: 'wrap' 
            }}>
                {mainActions.map(action => (
                    <div 
                        key={action.id} 
                        className="card" 
                        onClick={() => onViewChange(action.id)}
                        style={{ 
                            cursor: 'pointer', 
                            width: '300px', 
                            padding: '30px', 
                            borderTop: `8px solid ${action.color}`,
                            transition: 'transform 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        <span style={{ fontSize: '3rem' }}>{action.icon}</span>
                        <h3 style={{ margin: '15px 0' }}>{action.title}</h3>
                        <p style={{ fontSize: '14px', color: '#777' }}>{action.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}