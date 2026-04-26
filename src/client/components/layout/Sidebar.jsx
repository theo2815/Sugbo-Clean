import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Truck, MapPin, Building2, Recycle, BarChart3, Files,
} from 'lucide-react';
import { COLORS, STATUS } from '../../../utils/constants';
import { getAllReports } from '../../../services/api';

// Active cluster = ≥2 reports sharing a root id (potential_duplicate_of_id || sys_id),
// where at least one member is not Resolved. Count is a discovery hint on the
// nav entry, not authoritative — DuplicateReportsPage does its own derivation.
function deriveActiveClusterCount(reports) {
  const groups = new Map();
  for (const r of reports) {
    const root = r.potential_duplicate_of_id || r.sys_id;
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(r);
  }
  let count = 0;
  for (const members of groups.values()) {
    if (members.length < 2) continue;
    if (members.some((m) => m.status !== STATUS.RESOLVED)) count++;
  }
  return count;
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
  { icon: Files, label: 'Duplicate Reports', path: '/admin/duplicate-reports', showBadge: true },
  { icon: MapPin, label: 'Routes', path: '/admin/schedules' },
  { icon: Truck, label: 'Haulers', path: '/admin/haulers' },
  { icon: Building2, label: 'Barangays', path: '/admin/barangays' },
  { icon: Recycle, label: 'Waste Items', path: '/admin/waste-items' },
  { icon: BarChart3, label: 'Analytics', path: '/admin/analytics' },
];

export default function Sidebar() {
  const [clusterCount, setClusterCount] = useState(0);

  // Fetch on mount; refetch when any page dispatches sc:reports-changed
  // after a status update or delete. Avoids polling and avoids re-fetching
  // on every nav within /admin.
  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      try {
        const { result } = await getAllReports();
        if (!cancelled) setClusterCount(deriveActiveClusterCount(result));
      } catch {
        // Soft fail — badge stays at last known value.
      }
    }
    refresh();
    function onChange() { refresh(); }
    window.addEventListener('sc:reports-changed', onChange);
    return () => {
      cancelled = true;
      window.removeEventListener('sc:reports-changed', onChange);
    };
  }, []);

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
          const showBadge = item.showBadge && clusterCount > 0;
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
              <span style={{ flex: 1 }}>{item.label}</span>
              {showBadge && (
                <span style={styles.badge} aria-label={`${clusterCount} active duplicate ${clusterCount === 1 ? 'cluster' : 'clusters'}`}>
                  {clusterCount}
                </span>
              )}
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
    // Stay in view as the page scrolls. 80px matches the sticky Navbar height.
    position: 'sticky',
    top: 80,
    alignSelf: 'flex-start',
    // Always fill at least the viewport so the white background never gets cut
    // short on pages where main content is taller than the nav list.
    minHeight: 'calc(100vh - 80px)',
    maxHeight: 'calc(100vh - 80px)',
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
  badge: {
    minWidth: 20,
    height: 20,
    padding: '0 6px',
    borderRadius: 999,
    background: COLORS.warning,
    color: '#fff',
    fontSize: 11,
    fontWeight: 700,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
  },
};
