import React from 'react';
import { COLORS, BIN_COLOR_MAP } from '../../../utils/constants';

export default function BinColorTag({ binType }) {
  const hex = COLORS.bin[binType] || COLORS.text.muted;
  const colorName = BIN_COLOR_MAP[binType] || binType;

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
