import React from 'react';
import { COLORS } from '../../../utils/constants';

export default function Input({
  label,
  name,
  type = 'text',
  placeholder,
  value,
  onChange,
  required = false,
  error,
  style,
  ...rest
}) {
  return (
    <div style={{ marginBottom: 16, ...style }}>
      {label && (
        <label htmlFor={name} style={{
          display: 'block',
          marginBottom: 6,
          fontSize: 14,
          fontWeight: 500,
          color: COLORS.text.primary,
        }}>
          {label}{required && ' *'}
        </label>
      )}
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        style={{
          width: '100%',
          padding: '10px 12px',
          border: `1px solid ${error ? COLORS.error : COLORS.border}`,
          borderRadius: 8,
          fontSize: 14,
          color: COLORS.text.primary,
          boxSizing: 'border-box',
        }}
        {...rest}
      />
      {error && (
        <p style={{ margin: '4px 0 0', fontSize: 13, color: COLORS.error }}>{error}</p>
      )}
    </div>
  );
}
