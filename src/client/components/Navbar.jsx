import React from 'react';
import { COLORS } from '../../utils/constants';

export default function Navbar({ isAdmin, onTogglePortal }) {
    return (
        <nav className="app-header" style={{
            padding: '10px 5%',
            background: '#fff',
            borderBottom: `4px solid ${COLORS.secondary}`,
            position: 'sticky',
            top: 0,
            zIndex: 100
        }}>
            <div className="logo-section">
                <h1 style={{ margin: 0, color: COLORS.secondary }}>
                    Sugbo<span style={{ color: COLORS.primary }}>Clean</span>
                </h1>
                <small style={{ color: COLORS.text.muted, display: 'block', marginTop: '-5px' }}>
                    Official LGU Cebu Sanitation Portal
                </small>
            </div>

            <div className="nav-actions" style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                <button
                    className="nav-link-btn"
                    onClick={onTogglePortal}
                    style={{
                        background: 'none',
                        border: `1px solid ${COLORS.secondary}`,
                        color: COLORS.secondary,
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
