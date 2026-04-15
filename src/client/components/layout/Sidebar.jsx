import React from 'react';
import { NavLink } from 'react-router-dom';
import { COLORS } from '../../../utils/constants';

const navItems = [
  { icon: '📊', label: 'Dashboard', path: '/admin/dashboard' },
  { icon: '📅', label: 'Schedules', path: '/admin/schedules' },
  { icon: '🚛', label: 'Haulers', path: '/admin/haulers' },
  { icon: '📍', label: 'Route Stops', path: '/admin/route-stops' },
  { icon: '♻️', label: 'Waste Items', path: '/admin/waste-items' },
  { icon: '📈', label: 'Analytics', path: '/admin/analytics' },
];

export default function Sidebar() {
  return (
    <aside style={styles.sidebar}>
      <div style={styles.logoContainer}>
        <span style={{ fontSize: 20 }}>&#9851;</span>
        <span style={{ fontWeight: 'bold', color: COLORS.primary }}>SugboClean</span>
      </div>

      <nav>
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            style={({ isActive }) => ({
              ...styles.navItem,
              background: isActive ? COLORS.primaryLight : 'transparent',
              color: isActive ? COLORS.primary : COLORS.text.secondary,
              fontWeight: isActive ? 600 : 400,
              textDecoration: 'none',
            })}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: 220,
    background: COLORS.bg.card,
    borderRight: `1px solid ${COLORS.border}`,
    padding: 16,
    flexShrink: 0,
  },
  logoContainer: {
    display: 'flex',
    gap: 10,
    alignItems: 'center',
    marginBottom: 30,
    paddingBottom: 16,
    borderBottom: `1px solid ${COLORS.border}`,
  },
  navItem: {
    padding: '10px 12px',
    display: 'flex',
    gap: 10,
    cursor: 'pointer',
    borderRadius: 8,
    marginBottom: 4,
    fontSize: 14,
  },
};
