import React from 'react';
import { COLORS } from '../../../utils/constants';

export default function TextArea({
  label,
  name,
  rows = 3,
  placeholder,
  value,
  onChange,
  required = false,
  maxLength,
  style,
  ...rest
}) {
  const len = typeof value === 'string' ? value.length : 0;
  const nearLimit = maxLength && len >= maxLength * 0.9;

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
      <textarea
        id={name}
        name={name}
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        maxLength={maxLength}
        style={{
          width: '100%',
          padding: '10px 12px',
          border: `1px solid ${COLORS.border}`,
          borderRadius: 8,
          fontSize: 14,
          color: COLORS.text.primary,
          resize: 'vertical',
          boxSizing: 'border-box',
        }}
        {...rest}
      />
      {maxLength && (
        <div style={{
          textAlign: 'right',
          fontSize: 12,
          marginTop: 4,
          color: nearLimit ? COLORS.error : COLORS.text.muted,
          fontWeight: nearLimit ? 600 : 400,
        }}>
          {len} / {maxLength}
        </div>
      )}
    </div>
  );
}
