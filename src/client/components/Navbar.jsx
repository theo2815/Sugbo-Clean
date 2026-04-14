import React from 'react';

export default function Navbar({ isAdmin, onTogglePortal }) {
    return (
        <nav className="app-header" style={{ 
            padding: '10px 5%', 
            background: '#fff', 
            borderBottom: '4px solid #004a99',
            position: 'sticky',
            top: 0,
            zIndex: 100
        }}>
            <div className="logo-section">
                <h1 style={{ margin: 0, color: '#004a99' }}>
                    Sugbo<span style={{ color: '#4caf50' }}>Clean</span>
                </h1>
                <small style={{ color: '#666', display: 'block', marginTop: '-5px' }}>
                    Official LGU Cebu Sanitation Portal
                </small>
            </div>

            <div className="nav-actions" style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                <button 
                    className="nav-link-btn" 
                    onClick={onTogglePortal}
                    style={{
                        background: 'none',
                        border: '1px solid #004a99',
                        color: '#004a99',
                        padding: '5px 15px',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    {isAdmin ? 'Switch to Resident View' : 'Admin Login'}
                </button>
            </div>
        </nav>
    );
}