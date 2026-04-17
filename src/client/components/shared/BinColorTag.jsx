import React from 'react';
import { COLORS, BIN_COLOR_MAP } from '../../../utils/constants';

function titleCase(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : str;
}

export default function BinColorTag({ binType }) {
  const key = titleCase(binType);
  const hex = COLORS.bin[key] || COLORS.text.muted;
  const colorName = BIN_COLOR_MAP[key] || key;

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '4px 10px',
      borderRadius: 12,
      fontSize: 12,
      fontWeight: 600,
      background: `${hex}15`,
      color: hex,
    }}>
      <span style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: hex,
      }} />
      {colorName} Bin
    </span>
  );
}
