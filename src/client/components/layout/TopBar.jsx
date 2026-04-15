import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { COLORS } from '../../../utils/constants';
import Button from '../shared/Button';

export default function TopBar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <header style={styles.topbar}>
      <h3 style={{ margin: 0, color: COLORS.text.primary }}>Admin Dashboard</h3>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={styles.live}>
          <div style={styles.dot} />
          <span style={{ fontSize: 13, color: COLORS.text.muted }}>Live</span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          Logout
        </Button>
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
    padding: '0 20px',
    borderBottom: `1px solid ${COLORS.border}`,
    background: COLORS.bg.card,
  },
  live: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: COLORS.success,
  },
};
