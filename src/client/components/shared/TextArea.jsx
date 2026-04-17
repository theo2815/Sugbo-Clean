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
      <textarea
        id={name}
        name={name}
        rows={rows}
        placeholder={placeholder}
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
          resize: 'vertical',
          boxSizing: 'border-box',
        }}
        {...rest}
      />
    </div>
  );
}
