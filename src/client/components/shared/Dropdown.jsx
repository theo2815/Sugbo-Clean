import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { COLORS } from '../../../utils/constants';
import useClickOutside from '../../hooks/useClickOutside';

// Inject animation + focus styles once. Keyframes can't be expressed inline,
// and pseudo-classes (:hover, :focus-visible) need a stylesheet.
const STYLE_ID = 'sugbo-dropdown-styles';
if (typeof document !== 'undefined' && !document.getElementById(STYLE_ID)) {
  const tag = document.createElement('style');
  tag.id = STYLE_ID;
  tag.textContent = `
    @keyframes sugboDropdownIn {
      from { opacity: 0; transform: translateY(-4px) scale(0.98); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
    .sugbo-dd-panel {
      animation: sugboDropdownIn 140ms cubic-bezier(0.16, 1, 0.3, 1);
      transform-origin: top center;
    }
    .sugbo-dd-trigger:focus-visible {
      outline: 2px solid ${COLORS.primary};
      outline-offset: 2px;
    }
    .sugbo-dd-trigger:hover:not(:disabled) {
      border-color: ${COLORS.text.muted};
    }
    .sugbo-dd-option {
      transition: background-color 120ms ease, color 120ms ease;
    }
  `;
  document.head.appendChild(tag);
}

const SIZE_TOKENS = {
  sm: { padY: 8,  padX: 12, font: 13, radius: 10 },
  md: { padY: 10, padX: 14, font: 14, radius: 10 },
};

export default function Dropdown({
  options = [],
  value = null,
  onChange,
  placeholder = 'Select…',
  label,
  name,
  disabled = false,
  error,
  size = 'md',
  align = 'left',
  fullWidth = true,
  style,
  panelMaxHeight = 280,
}) {
  const tokens = SIZE_TOKENS[size] ?? SIZE_TOKENS.md;
  const reactId = useId();
  const listboxId = `${reactId}-listbox`;
  const labelId = label ? `${reactId}-label` : undefined;

  const rootRef = useRef(null);
  const panelRef = useRef(null);
  const optionRefs = useRef([]);

  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);

  const selectedIndex = useMemo(
    () => options.findIndex((o) => o.value === value),
    [options, value]
  );
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : null;

  const close = useCallback(() => setOpen(false), []);
  useClickOutside(rootRef, close, open);

  // When opening, seed the highlight on the current selection (or first
  // enabled option) so keyboard nav has a sensible starting point.
  useEffect(() => {
    if (!open) return;
    if (selectedIndex >= 0) {
      setHighlight(selectedIndex);
    } else {
      const first = options.findIndex((o) => !o.disabled);
      setHighlight(first);
    }
  }, [open, selectedIndex, options]);

  // Keep the highlighted option scrolled into view during keyboard nav.
  useEffect(() => {
    if (!open || highlight < 0) return;
    const node = optionRefs.current[highlight];
    if (node && typeof node.scrollIntoView === 'function') {
      node.scrollIntoView({ block: 'nearest' });
    }
  }, [highlight, open]);

  function moveHighlight(direction) {
    if (options.length === 0) return;
    let next = highlight;
    for (let i = 0; i < options.length; i += 1) {
      next = (next + direction + options.length) % options.length;
      if (!options[next]?.disabled) {
        setHighlight(next);
        return;
      }
    }
  }

  function selectIndex(index) {
    const opt = options[index];
    if (!opt || opt.disabled) return;
    onChange?.(opt.value, opt);
    setOpen(false);
    rootRef.current?.querySelector('.sugbo-dd-trigger')?.focus();
  }

  function onTriggerKeyDown(event) {
    if (disabled) return;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!open) setOpen(true);
        else moveHighlight(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (!open) setOpen(true);
        else moveHighlight(-1);
        break;
      case 'Home':
        if (open) {
          event.preventDefault();
          const first = options.findIndex((o) => !o.disabled);
          if (first >= 0) setHighlight(first);
        }
        break;
      case 'End':
        if (open) {
          event.preventDefault();
          for (let i = options.length - 1; i >= 0; i -= 1) {
            if (!options[i].disabled) { setHighlight(i); break; }
          }
        }
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (open && highlight >= 0) selectIndex(highlight);
        else setOpen(true);
        break;
      case 'Escape':
        if (open) {
          event.preventDefault();
          setOpen(false);
        }
        break;
      case 'Tab':
        if (open) setOpen(false);
        break;
      default:
        break;
    }
  }

  const triggerStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    width: fullWidth ? '100%' : 'auto',
    minWidth: size === 'sm' ? 120 : 160,
    padding: `${tokens.padY}px ${tokens.padX}px`,
    background: disabled ? COLORS.bg.muted : COLORS.bg.card,
    color: disabled ? COLORS.text.muted : COLORS.text.primary,
    border: `1px solid ${error ? COLORS.error : COLORS.border}`,
    borderRadius: tokens.radius,
    fontSize: tokens.font,
    fontWeight: 500,
    cursor: disabled ? 'not-allowed' : 'pointer',
    boxSizing: 'border-box',
    textAlign: 'left',
    transition: 'border-color 120ms ease, box-shadow 120ms ease',
    boxShadow: open ? `0 0 0 3px ${COLORS.primaryLight}` : 'none',
    borderColor: open ? COLORS.primary : (error ? COLORS.error : COLORS.border),
  };

  const panelStyle = {
    position: 'absolute',
    top: 'calc(100% + 6px)',
    left: align === 'left' ? 0 : 'auto',
    right: align === 'right' ? 0 : 'auto',
    minWidth: '100%',
    maxHeight: panelMaxHeight,
    overflowY: 'auto',
    background: COLORS.bg.card,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 12,
    boxShadow: '0 12px 32px rgba(15, 23, 42, 0.12), 0 2px 6px rgba(15, 23, 42, 0.06)',
    padding: 6,
    zIndex: 50,
    listStyle: 'none',
    margin: 0,
  };

  return (
    <div style={{ marginBottom: label || error ? 16 : 0, ...style }}>
      {label && (
        <label
          id={labelId}
          htmlFor={`${reactId}-trigger`}
          style={{
            display: 'block',
            marginBottom: 6,
            fontSize: 14,
            fontWeight: 500,
            color: COLORS.text.primary,
          }}
        >
          {label}
        </label>
      )}

      <div ref={rootRef} style={{ position: 'relative', width: fullWidth ? '100%' : 'auto' }}>
        <button
          id={`${reactId}-trigger`}
          type="button"
          className="sugbo-dd-trigger"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-labelledby={labelId}
          aria-activedescendant={open && highlight >= 0 ? `${reactId}-opt-${highlight}` : undefined}
          aria-invalid={Boolean(error) || undefined}
          disabled={disabled}
          onClick={() => !disabled && setOpen((v) => !v)}
          onKeyDown={onTriggerKeyDown}
          style={triggerStyle}
        >
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            color: selectedOption ? COLORS.text.primary : COLORS.text.muted,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {selectedOption?.icon}
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown
            size={16}
            style={{
              color: COLORS.text.muted,
              transition: 'transform 160ms ease',
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
              flexShrink: 0,
            }}
          />
        </button>

        {/* Hidden input lets the dropdown participate in native <form> submission. */}
        {name && (
          <input type="hidden" name={name} value={value ?? ''} />
        )}

        {open && (
          <ul
            ref={panelRef}
            id={listboxId}
            role="listbox"
            aria-labelledby={labelId}
            tabIndex={-1}
            className="sugbo-dd-panel"
            style={panelStyle}
          >
            {options.length === 0 && (
              <li style={{
                padding: '10px 12px',
                fontSize: 13,
                color: COLORS.text.muted,
              }}>
                No options
              </li>
            )}
            {options.map((opt, i) => {
              const isSelected = opt.value === value;
              const isHighlighted = i === highlight;
              return (
                <li
                  key={opt.value}
                  ref={(el) => { optionRefs.current[i] = el; }}
                  id={`${reactId}-opt-${i}`}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={opt.disabled || undefined}
                  className="sugbo-dd-option"
                  onMouseEnter={() => !opt.disabled && setHighlight(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectIndex(i)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '9px 10px',
                    borderRadius: 8,
                    cursor: opt.disabled ? 'not-allowed' : 'pointer',
                    fontSize: tokens.font,
                    color: opt.disabled ? COLORS.text.muted : COLORS.text.primary,
                    background: isHighlighted && !opt.disabled ? COLORS.bg.muted : 'transparent',
                    fontWeight: isSelected ? 600 : 500,
                    opacity: opt.disabled ? 0.6 : 1,
                  }}
                >
                  {opt.icon && (
                    <span style={{ display: 'inline-flex', flexShrink: 0 }}>{opt.icon}</span>
                  )}
                  <span style={{
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {opt.label}
                  </span>
                  {isSelected && (
                    <Check size={14} style={{ color: COLORS.primary, flexShrink: 0 }} />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {error && (
        <p style={{ margin: '4px 0 0', fontSize: 13, color: COLORS.error }}>{error}</p>
      )}
    </div>
  );
}
