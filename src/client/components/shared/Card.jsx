import React from 'react';
import { COLORS } from '../../../utils/constants';

export default function Card({ children, accentColor, onClick, style }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: COLORS.bg.card,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 10,
        padding: 20,
        borderTop: accentColor ? `6px solid ${accentColor}` : undefined,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s, box-shadow 0.2s',
        boxSizing: 'border-box',
        ...style,
      }}
      onMouseOver={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
        }
      }}
      onMouseOut={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
    >
      {children}
    </div>
  );
}
