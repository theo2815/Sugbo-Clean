import React from 'react';
import { Sparkles } from 'lucide-react';
import { SEVERITY_COLOR_MAP, COLORS } from '../../../utils/constants';

export default function SeverityPill({ level, size = 'md', showIcon = true }) {
  const sizes = {
    sm: { padding: '2px 8px', fontSize: 11, dot: 6, gap: 5, icon: 10 },
    md: { padding: '4px 10px', fontSize: 12, dot: 7, gap: 6, icon: 12 },
  };
  const s = sizes[size] || sizes.md;

  if (!level) {
    return (
      <span style={{ color: COLORS.text.muted, fontSize: s.fontSize }}>—</span>
    );
  }

  const color = SEVERITY_COLOR_MAP[level] || COLORS.text.muted;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: s.gap,
        padding: s.padding,
        borderRadius: 999,
        fontSize: s.fontSize,
        background: `${color}1A`,
        color,
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
      title="AI-generated severity — draft only, not ground truth"
    >
      {showIcon ? (
        <Sparkles size={s.icon} aria-hidden="true" />
      ) : (
        <span style={{
          width: s.dot,
          height: s.dot,
          borderRadius: '50%',
          background: color,
          display: 'inline-block',
        }} />
      )}
      {level}
    </span>
  );
}
