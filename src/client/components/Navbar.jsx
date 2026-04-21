import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Calendar, AlertTriangle, Search, Recycle, Menu, X } from 'lucide-react';
import { COLORS } from '../../utils/constants';
import logo from '../header-logo.png';

const RESIDENT_LINKS = [
    { to: '/schedule', label: 'View My Schedule', icon: Calendar },
    { to: '/report', label: 'Report Missed Pickup', icon: AlertTriangle },
    { to: '/track', label: 'Track My Report', icon: Search },
    { to: '/waste-guide', label: 'Waste Sorting Guide', icon: Recycle },

];

export default function Navbar({ isAdmin, onTogglePortal }) {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth <= 900);

    useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth <= 900);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    useEffect(() => {
        document.body.style.overflow = drawerOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [drawerOpen]);

    const linkBase = {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '8px 12px',
        borderRadius: 8,
        textDecoration: 'none',
        color: COLORS.text.secondary,
        fontWeight: 500,
        fontSize: 14,
        transition: 'background 0.15s, color 0.15s',
    };

    const renderLink = (link, onClick) => (
        <NavLink
            key={link.to}
            to={link.to}
            onClick={onClick}
            style={({ isActive }) => ({
                ...linkBase,
                color: isActive ? COLORS.primary : COLORS.text.secondary,
                background: isActive ? COLORS.primaryLight : 'transparent',
            })}
        >
            <link.icon size={16} />
            {link.label}
        </NavLink>
    );

    return (
        <>
            <nav className="app-header" style={{
                padding: '12px 5%',
                background: '#fff',
                borderBottom: `4px solid ${COLORS.secondary}`,
                position: 'sticky',
                top: 0,
                zIndex: 1100,
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}>
                <NavLink to="/" style={{ textDecoration: 'none' }}>
                    <div className="logo-section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <img 
                            src={logo} 
                            alt="SugboClean" 
                            style={{ height: '48px', objectFit: 'contain', marginBottom: '-4px', marginLeft: '-4px' }} 
                        />
                        <small style={{ color: COLORS.text.muted, display: 'block', lineHeight: 1 }}>
                            Official LGU Cebu Sanitation Portal
                        </small>
                    </div>
                </NavLink>

                {!isAdmin && !isMobile && (
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                        {RESIDENT_LINKS.map((link) => renderLink(link))}
                    </div>
                )}

                {!isAdmin && isMobile && (
                    <button
                        aria-label="Open menu"
                        onClick={() => setDrawerOpen(true)}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 8,
                            color: COLORS.secondary,
                        }}
                    >
                        <Menu size={28} />
                    </button>
                )}

                {isAdmin && (
                    <div className="nav-actions" style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        <button
                            className="nav-link-btn"
                            onClick={onTogglePortal}
                            style={{
                                background: 'none',
                                border: `1px solid ${COLORS.secondary}`,
                                color: COLORS.secondary,
                                padding: '6px 16px',
                                borderRadius: 20,
                                cursor: 'pointer',
                                fontWeight: 'bold',
                            }}
                        >
                            Back to Landing Page
                        </button>
                    </div>
                )}
            </nav>

            {drawerOpen && (
                <div
                    onClick={() => setDrawerOpen(false)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(15,23,42,0.45)',
                        zIndex: 1200,
                    }}
                >
                    <aside
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            height: '100%',
                            width: 'min(320px, 85vw)',
                            background: '#fff',
                            padding: 20,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 8,
                            boxShadow: '-4px 0 16px rgba(0,0,0,0.1)',
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <strong style={{ color: COLORS.text.primary }}>Menu</strong>
                            <button
                                aria-label="Close menu"
                                onClick={() => setDrawerOpen(false)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLORS.text.secondary }}
                            >
                                <X size={24} />
                            </button>
                        </div>
                        {RESIDENT_LINKS.map((link) => renderLink(link, () => setDrawerOpen(false)))}
                    </aside>
                </div>
            )}
        </>
    );
}
