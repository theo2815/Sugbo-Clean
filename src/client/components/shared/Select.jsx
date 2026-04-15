import React from 'react';
import { COLORS } from '../../../utils/constants';

export default function Select({
  label,
  name,
  value,
  onChange,
  options = [],
  placeholder = '-- Select --',
  required = false,
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
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        style={{
          width: '100%',
          padding: '10px 12px',
          border: `1px solid ${COLORS.border}`,
          borderRadius: 8,
          fontSize: 14,
          color: COLORS.text.primary,
          background: '#fff',
          boxSizing: 'border-box',
        }}
        {...rest}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
