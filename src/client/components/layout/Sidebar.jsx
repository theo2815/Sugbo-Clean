import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, CalendarDays, Truck,
  MapPin, Recycle, BarChart3,
} from 'lucide-react';
import { COLORS } from '../../../utils/constants';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
  { icon: CalendarDays, label: 'Schedules', path: '/admin/schedules' },
  { icon: Truck, label: 'Haulers', path: '/admin/haulers' },
  { icon: MapPin, label: 'Route Stops', path: '/admin/route-stops' },
  { icon: Recycle, label: 'Waste Items', path: '/admin/waste-items' },
  { icon: BarChart3, label: 'Analytics', path: '/admin/analytics' },
];

export default function Sidebar() {
  return (
    <aside style={styles.sidebar}>
      <div style={styles.logoContainer}>
        <div style={styles.logoIcon}>
          <Recycle size={18} color="#fff" />
        </div>
        <div>
          <div style={styles.logoTitle}>SugboClean</div>
          <div style={styles.logoSub}>Admin</div>
        </div>
      </div>

      <div style={styles.sectionLabel}>MENU</div>
      <nav style={styles.nav}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
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
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: 230,
    background: COLORS.bg.card,
    borderRight: `1px solid ${COLORS.border}`,
    padding: '20px 14px',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
  },
  logoContainer: {
    display: 'flex',
    gap: 10,
    alignItems: 'center',
    marginBottom: 28,
    paddingBottom: 18,
    borderBottom: `1px solid ${COLORS.border}`,
  },
  logoIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    background: COLORS.primary,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  logoTitle: {
    fontWeight: 700,
    fontSize: 15,
    color: COLORS.text.primary,
    lineHeight: 1.2,
  },
  logoSub: {
    fontSize: 11,
    fontWeight: 600,
    color: COLORS.text.muted,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: COLORS.text.muted,
    letterSpacing: 1,
    marginBottom: 8,
    paddingLeft: 12,
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  navItem: {
    padding: '10px 12px',
    display: 'flex',
    gap: 10,
    alignItems: 'center',
    cursor: 'pointer',
    borderRadius: 10,
    fontSize: 14,
    transition: 'background 0.12s ease',
  },
};
