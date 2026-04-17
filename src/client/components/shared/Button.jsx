import React from 'react';
import { COLORS } from '../../../utils/constants';

const variantStyles = {
  primary: {
    background: COLORS.primary,
    color: '#fff',
    border: 'none',
  },
  secondary: {
    background: COLORS.secondary,
    color: '#fff',
    border: 'none',
  },
  outline: {
    background: 'transparent',
    color: COLORS.secondary,
    border: `1px solid ${COLORS.secondary}`,
  },
  danger: {
    background: COLORS.error,
    color: '#fff',
    border: 'none',
  },
  ghost: {
    background: 'transparent',
    color: COLORS.text.secondary,
    border: 'none',
  },
};

const sizeStyles = {
  sm: { padding: '6px 12px', fontSize: 13 },
  md: { padding: '10px 18px', fontSize: 14 },
  lg: { padding: '12px 24px', fontSize: 16 },
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  type = 'button',
  onClick,
  style,
  ...rest
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      style={{
        ...variantStyles[variant],
        ...sizeStyles[size],
        borderRadius: 8,
        fontWeight: 600,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'opacity 0.2s',
        ...style,
      }}
      {...rest}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
}
