import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, RefreshCw } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { COLORS } from '../../../utils/constants';

export default function TopBar({ title = 'Dashboard', onRefresh }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <header style={styles.topbar}>
      <h2 style={styles.title}>{title}</h2>

      <div style={styles.actions}>
        <div style={styles.live}>
          <div style={styles.dot} />
          <span style={styles.liveLabel}>Live</span>
        </div>

        {onRefresh && (
          <button type="button" onClick={onRefresh} style={styles.iconBtn} aria-label="Refresh data">
            <RefreshCw size={16} />
          </button>
        )}

        <button type="button" onClick={handleLogout} style={styles.logoutBtn}>
          <LogOut size={15} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}

const styles = {
  topbar: {
    height: 60,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 24px',
    borderBottom: `1px solid ${COLORS.border}`,
    background: COLORS.bg.card,
    flexShrink: 0,
  },
  title: {
    margin: 0,
    fontSize: 17,
    fontWeight: 700,
    color: COLORS.text.primary,
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  live: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '5px 10px',
    background: `${COLORS.success}14`,
    borderRadius: 999,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: COLORS.success,
    animation: 'pulse 2s infinite',
  },
  liveLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: COLORS.success,
  },
  iconBtn: {
    width: 36,
    height: 36,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: `1px solid ${COLORS.border}`,
    borderRadius: 10,
    background: '#fff',
    cursor: 'pointer',
    color: COLORS.text.secondary,
    transition: 'background 0.12s ease',
  },
  logoutBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '7px 14px',
    border: `1px solid ${COLORS.border}`,
    borderRadius: 10,
    background: '#fff',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    color: COLORS.text.secondary,
    transition: 'background 0.12s ease',
  },
};
