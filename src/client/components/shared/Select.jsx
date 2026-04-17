import React, { useCallback } from 'react';
import Dropdown from './Dropdown';

// Backwards-compatible wrapper around Dropdown. Existing callers pass an
// event-shaped onChange (`(e) => e.target.value`); we synthesise a minimal
// event so they keep working without per-file edits.
export default function Select({
  label,
  name,
  value,
  onChange,
  options = [],
  placeholder = '-- Select --',
  required = false,
  error,
  size = 'md',
  style,
  disabled,
}) {
  const handleChange = useCallback((nextValue) => {
    onChange?.({ target: { name, value: nextValue } });
  }, [onChange, name]);

  return (
    <Dropdown
      label={label ? `${label}${required ? ' *' : ''}` : undefined}
      name={name}
      value={value || null}
      onChange={handleChange}
      options={options}
      placeholder={placeholder}
      error={error}
      disabled={disabled}
      size={size}
      style={style}
    />
  );
}
