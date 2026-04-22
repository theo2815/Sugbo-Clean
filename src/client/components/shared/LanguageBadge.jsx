import React from 'react';
import { Languages } from 'lucide-react';
import { COLORS } from '../../../utils/constants';

export const LANGUAGE_LABELS = {
  ceb: 'Cebuano',
  tl: 'Filipino',
  mixed: 'Mixed',
};

export default function LanguageBadge({ lang, size = 'md' }) {
  const label = LANGUAGE_LABELS[lang];
  if (!label) return null;

  const sizes = {
    sm: { padding: '2px 8px', fontSize: 11, gap: 5, icon: 10 },
    md: { padding: '4px 10px', fontSize: 12, gap: 6, icon: 12 },
  };
  const s = sizes[size] || sizes.md;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: s.gap,
        padding: s.padding,
        borderRadius: 999,
        fontSize: s.fontSize,
        background: `${COLORS.secondary}1A`,
        color: COLORS.secondaryDark,
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
      title={`AI-detected language: ${label}. Admin view shows an English translation.`}
    >
      <Languages size={s.icon} aria-hidden="true" />
      {label}
    </span>
  );
}
