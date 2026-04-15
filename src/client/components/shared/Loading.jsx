import React from 'react';
import { COLORS } from '../../../utils/constants';

export default function Loading({ message = 'Loading...' }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40,
      color: COLORS.text.muted,
    }}>
      <div style={{
        width: 32,
        height: 32,
        border: `3px solid ${COLORS.border}`,
        borderTop: `3px solid ${COLORS.primary}`,
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
        marginBottom: 12,
      }} />
      <p style={{ margin: 0, fontSize: 14 }}>{message}</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
