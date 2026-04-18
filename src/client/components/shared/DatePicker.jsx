import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { COLORS } from '../../../utils/constants';
import useClickOutside from '../../hooks/useClickOutside';

// Inject animation + focus styles once. Keyframes and pseudo-classes can't be
// inlined; everything else stays inline to match the codebase style.
const STYLE_ID = 'sugbo-datepicker-styles';
if (typeof document !== 'undefined' && !document.getElementById(STYLE_ID)) {
  const tag = document.createElement('style');
  tag.id = STYLE_ID;
  tag.textContent = `
    @keyframes sugboDatePickerIn {
      from { opacity: 0; transform: translateY(-4px) scale(0.98); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
    .sugbo-dp-panel {
      animation: sugboDatePickerIn 140ms cubic-bezier(0.16, 1, 0.3, 1);
      transform-origin: top center;
    }
    .sugbo-dp-trigger:focus-within {
      border-color: ${COLORS.primary};
      box-shadow: 0 0 0 3px ${COLORS.primaryLight};
    }
    .sugbo-dp-trigger:hover:not([data-disabled="true"]) {
      border-color: ${COLORS.text.muted};
    }
    .sugbo-dp-day {
      transition: background-color 100ms ease, color 100ms ease, transform 80ms ease;
    }
    .sugbo-dp-day:not([data-disabled="true"]):hover {
      background-color: ${COLORS.bg.muted};
    }
    .sugbo-dp-day[data-selected="true"] {
      transform: scale(1.04);
    }
    .sugbo-dp-nav-btn {
      transition: background-color 120ms ease;
    }
    .sugbo-dp-nav-btn:hover:not(:disabled) {
      background-color: ${COLORS.bg.muted};
    }
    .sugbo-dp-action-btn:hover:not(:disabled) {
      color: ${COLORS.primaryDark};
    }
  `;
  document.head.appendChild(tag);
}

const SIZE_TOKENS = {
  sm: { padY: 8,  padX: 10, font: 13, radius: 10 },
  md: { padY: 10, padX: 12, font: 14, radius: 10 },
};

const WEEKDAY_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// ── Date helpers (kept local; only DatePicker uses them) ───────────────
// Everything works in local time on purpose: ISO `YYYY-MM-DD` is treated as a
// calendar date, not a UTC instant, so time zones don't shift the day.
function pad2(n) { return String(n).padStart(2, '0'); }
function toISO(date) {
  if (!date) return '';
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}
function parseISO(iso) {
  if (!iso || typeof iso !== 'string') return null;
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}
function parseManual(text) {
  if (!text) return null;
  // Accept M/D/YYYY or MM/DD/YYYY
  const m = text.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const month = Number(m[1]);
  const day = Number(m[2]);
  const year = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const d = new Date(year, month - 1, day);
  // Round-trip check rejects e.g. 02/30/2026.
  if (d.getMonth() !== month - 1 || d.getDate() !== day) return null;
  return d;
}
function formatDisplay(iso) {
  const d = parseISO(iso);
  if (!d) return '';
  return `${pad2(d.getMonth() + 1)}/${pad2(d.getDate())}/${d.getFullYear()}`;
}
function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
function isSameDay(a, b) {
  return a && b
    && a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}
function clampDate(date, min, max) {
  if (min && date < min) return min;
  if (max && date > max) return max;
  return date;
}
function isOutOfRange(date, min, max) {
  if (min && date < min) return true;
  if (max && date > max) return true;
  return false;
}
function rangeMessage(date, min, max) {
  if (min && date < min) return `Date must be on or after ${formatDisplay(toISO(min))}`;
  if (max && date > max) return `Date must be on or before ${formatDisplay(toISO(max))}`;
  return 'Date is out of range';
}
function buildMonthGrid(viewYear, viewMonth) {
  // Always 6 rows × 7 cols so panel height never jumps.
  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const startWeekday = firstOfMonth.getDay();
  const gridStart = new Date(viewYear, viewMonth, 1 - startWeekday);
  const cells = [];
  for (let i = 0; i < 42; i += 1) {
    const d = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
    cells.push(d);
  }
  return cells;
}

export default function DatePicker({
  value = '',
  onChange,
  min,
  max,
  label,
  name,
  placeholder = 'mm/dd/yyyy',
  disabled = false,
  required = false,
  error,
  size = 'md',
  align = 'left',
  fullWidth = true,
  clearable = true,
  showToday = true,
  style,
}) {
  const tokens = SIZE_TOKENS[size] ?? SIZE_TOKENS.md;
  const reactId = useId();
  const panelId = `${reactId}-panel`;
  const inputId = `${reactId}-input`;

  const minDate = useMemo(() => (min ? startOfDay(parseISO(min)) : null), [min]);
  const maxDate = useMemo(() => (max ? startOfDay(parseISO(max)) : null), [max]);

  const valueDate = useMemo(() => parseISO(value), [value]);
  const today = useMemo(() => startOfDay(new Date()), []);

  const rootRef = useRef(null);
  const inputRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(formatDisplay(value));
  // Local validation error from manual typing. Shown ahead of caller's `error`
  // so the immediate feedback wins; cleared on next keystroke or successful commit.
  const [localError, setLocalError] = useState(null);
  // Month being viewed in the calendar (independent of the selected value
  // so users can browse months without committing).
  const initialView = valueDate || clampDate(today, minDate, maxDate);
  const [viewYear, setViewYear] = useState(initialView.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialView.getMonth());
  // Keyboard-focused day inside the grid (Date object). Distinct from `value`.
  const [focusDate, setFocusDate] = useState(initialView);

  // Keep the visible draft in sync when `value` changes from the outside.
  useEffect(() => {
    setDraft(formatDisplay(value));
    setLocalError(null);
  }, [value]);

  // When opening, snap the calendar to the current value (or today, clamped).
  useEffect(() => {
    if (!open) return;
    const target = valueDate || clampDate(today, minDate, maxDate);
    setViewYear(target.getFullYear());
    setViewMonth(target.getMonth());
    setFocusDate(target);
  }, [open, valueDate, today, minDate, maxDate]);

  const close = useCallback(() => setOpen(false), []);
  useClickOutside(rootRef, close, open);

  const days = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  // ── Navigation helpers ───────────────────────────────────────────────
  const navigateMonth = useCallback((delta) => {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  }, [viewYear, viewMonth]);

  const moveFocus = useCallback((deltaDays) => {
    const next = new Date(focusDate.getFullYear(), focusDate.getMonth(), focusDate.getDate() + deltaDays);
    setFocusDate(next);
    if (next.getMonth() !== viewMonth || next.getFullYear() !== viewYear) {
      setViewYear(next.getFullYear());
      setViewMonth(next.getMonth());
    }
  }, [focusDate, viewMonth, viewYear]);

  function commit(date) {
    if (!date || isOutOfRange(date, minDate, maxDate)) return;
    const iso = toISO(date);
    onChange?.(iso);
    setDraft(formatDisplay(iso));
    setLocalError(null);
    setOpen(false);
    inputRef.current?.focus();
  }

  function clear() {
    onChange?.('');
    setDraft('');
    setLocalError(null);
    setOpen(false);
    inputRef.current?.focus();
  }

  function selectToday() {
    const t = clampDate(today, minDate, maxDate);
    if (isOutOfRange(t, minDate, maxDate)) return;
    commit(t);
  }

  // ── Manual input handlers ────────────────────────────────────────────
  function onInputChange(e) {
    setDraft(e.target.value);
    if (localError) setLocalError(null);
  }
  function onInputBlur() {
    if (draft === '') {
      setLocalError(null);
      if (value) onChange?.('');
      return;
    }
    const parsed = parseManual(draft);
    if (!parsed) {
      setLocalError('Invalid date — use mm/dd/yyyy');
      return;
    }
    if (isOutOfRange(parsed, minDate, maxDate)) {
      setLocalError(rangeMessage(parsed, minDate, maxDate));
      return;
    }
    setLocalError(null);
    const iso = toISO(parsed);
    if (iso !== value) onChange?.(iso);
    setDraft(formatDisplay(iso));
  }
  function onInputKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      onInputBlur();
      setOpen(false);
    } else if (e.key === 'ArrowDown' && !open) {
      e.preventDefault();
      setOpen(true);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      // Discard the bad draft and snap back to the committed value.
      setDraft(formatDisplay(value));
      setLocalError(null);
      if (open) setOpen(false);
    }
  }

  // ── Calendar keyboard nav (when focused inside the grid) ─────────────
  function onGridKeyDown(e) {
    switch (e.key) {
      case 'ArrowLeft':  e.preventDefault(); moveFocus(-1); break;
      case 'ArrowRight': e.preventDefault(); moveFocus(1);  break;
      case 'ArrowUp':    e.preventDefault(); moveFocus(-7); break;
      case 'ArrowDown':  e.preventDefault(); moveFocus(7);  break;
      case 'Home':       e.preventDefault(); moveFocus(-focusDate.getDay()); break;
      case 'End':        e.preventDefault(); moveFocus(6 - focusDate.getDay()); break;
      case 'PageUp':
        e.preventDefault();
        navigateMonth(e.shiftKey ? -12 : -1);
        break;
      case 'PageDown':
        e.preventDefault();
        navigateMonth(e.shiftKey ? 12 : 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (!isOutOfRange(focusDate, minDate, maxDate)) commit(focusDate);
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        inputRef.current?.focus();
        break;
      default: break;
    }
  }

  const prevMonthDisabled = minDate
    ? new Date(viewYear, viewMonth, 0) < minDate
    : false;
  const nextMonthDisabled = maxDate
    ? new Date(viewYear, viewMonth + 1, 1) > maxDate
    : false;

  const displayError = localError || error;

  const triggerStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    width: fullWidth ? '100%' : 'auto',
    minWidth: size === 'sm' ? 140 : 180,
    padding: `${tokens.padY}px ${tokens.padX}px`,
    background: disabled ? COLORS.bg.muted : COLORS.bg.card,
    border: `1px solid ${displayError ? COLORS.error : COLORS.border}`,
    borderRadius: tokens.radius,
    boxSizing: 'border-box',
    transition: 'border-color 120ms ease, box-shadow 120ms ease',
    cursor: disabled ? 'not-allowed' : 'text',
  };

  const panelStyle = {
    position: 'absolute',
    top: 'calc(100% + 6px)',
    left: align === 'left' ? 0 : 'auto',
    right: align === 'right' ? 0 : 'auto',
    width: 280,
    background: COLORS.bg.card,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 12,
    boxShadow: '0 12px 32px rgba(15, 23, 42, 0.12), 0 2px 6px rgba(15, 23, 42, 0.06)',
    padding: 12,
    zIndex: 50,
  };

  return (
    <div style={{ marginBottom: label || displayError ? 16 : 0, ...style }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            display: 'block',
            marginBottom: 6,
            fontSize: 14,
            fontWeight: 500,
            color: COLORS.text.primary,
          }}
        >
          {label}{required ? ' *' : ''}
        </label>
      )}

      <div ref={rootRef} style={{ position: 'relative', width: fullWidth ? '100%' : 'auto' }}>
        <div className="sugbo-dp-trigger" data-disabled={disabled} style={triggerStyle}>
          <input
            ref={inputRef}
            id={inputId}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder={placeholder}
            value={draft}
            disabled={disabled}
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-controls={panelId}
            aria-invalid={Boolean(displayError) || undefined}
            required={required}
            onChange={onInputChange}
            onBlur={onInputBlur}
            onKeyDown={onInputKeyDown}
            style={{
              flex: 1,
              minWidth: 0,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: tokens.font,
              color: disabled ? COLORS.text.muted : COLORS.text.primary,
              padding: 0,
            }}
          />
          {/* Submit ISO value (not the visible MM/DD/YYYY draft) for native forms. */}
          {name && <input type="hidden" name={name} value={value || ''} />}
          <button
            type="button"
            onClick={() => !disabled && setOpen((v) => !v)}
            disabled={disabled}
            aria-label={open ? 'Close calendar' : 'Open calendar'}
            tabIndex={-1}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 4,
              border: 'none',
              background: 'transparent',
              color: disabled ? COLORS.text.muted : COLORS.text.secondary,
              cursor: disabled ? 'not-allowed' : 'pointer',
              borderRadius: 6,
            }}
          >
            <Calendar size={16} />
          </button>
        </div>

        {open && (
          <div
            id={panelId}
            role="dialog"
            aria-modal="false"
            aria-label="Choose date"
            className="sugbo-dp-panel"
            onKeyDown={onGridKeyDown}
            style={panelStyle}
          >
            {/* Header — month/year + nav */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}>
              <div style={{
                fontSize: 14,
                fontWeight: 700,
                color: COLORS.text.primary,
              }}>
                {MONTH_NAMES[viewMonth]} {viewYear}
              </div>
              <div style={{ display: 'flex', gap: 2 }}>
                <button
                  type="button"
                  className="sugbo-dp-nav-btn"
                  onClick={() => navigateMonth(-1)}
                  disabled={prevMonthDisabled}
                  aria-label="Previous month"
                  style={navBtnStyle(prevMonthDisabled)}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  className="sugbo-dp-nav-btn"
                  onClick={() => navigateMonth(1)}
                  disabled={nextMonthDisabled}
                  aria-label="Next month"
                  style={navBtnStyle(nextMonthDisabled)}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Weekday header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 2,
              marginBottom: 4,
            }}>
              {WEEKDAY_SHORT.map((wd) => (
                <div
                  key={wd}
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: COLORS.text.muted,
                    textAlign: 'center',
                    padding: '4px 0',
                  }}
                >
                  {wd}
                </div>
              ))}
            </div>

            {/* Day grid */}
            <div
              role="grid"
              aria-label={`${MONTH_NAMES[viewMonth]} ${viewYear}`}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: 2,
              }}
            >
              {days.map((d) => {
                const inMonth = d.getMonth() === viewMonth;
                const isSelected = isSameDay(d, valueDate);
                const isFocused = isSameDay(d, focusDate);
                const isToday = isSameDay(d, today);
                const dayDisabled = isOutOfRange(d, minDate, maxDate);
                return (
                  <button
                    key={d.getTime()}
                    type="button"
                    role="gridcell"
                    tabIndex={isFocused ? 0 : -1}
                    aria-selected={isSelected}
                    aria-disabled={dayDisabled || undefined}
                    aria-current={isToday ? 'date' : undefined}
                    disabled={dayDisabled}
                    data-selected={isSelected}
                    data-disabled={dayDisabled}
                    className="sugbo-dp-day"
                    onClick={() => commit(d)}
                    onMouseEnter={() => !dayDisabled && setFocusDate(d)}
                    style={{
                      height: 32,
                      borderRadius: 8,
                      border: isToday && !isSelected ? `1px solid ${COLORS.primary}` : '1px solid transparent',
                      background: isSelected ? COLORS.primary : 'transparent',
                      color: isSelected
                        ? '#fff'
                        : dayDisabled
                          ? COLORS.text.muted
                          : inMonth
                            ? COLORS.text.primary
                            : COLORS.text.muted,
                      fontSize: 13,
                      fontWeight: isSelected ? 700 : (isToday ? 600 : 500),
                      cursor: dayDisabled ? 'not-allowed' : 'pointer',
                      opacity: dayDisabled ? 0.45 : (inMonth ? 1 : 0.55),
                      padding: 0,
                      outline: isFocused && !isSelected ? `2px solid ${COLORS.primaryLight}` : 'none',
                      outlineOffset: -2,
                    }}
                  >
                    {d.getDate()}
                  </button>
                );
              })}
            </div>

            {/* Footer — Clear + Today */}
            {(clearable || showToday) && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 10,
                paddingTop: 10,
                borderTop: `1px solid ${COLORS.border}`,
              }}>
                {clearable ? (
                  <button
                    type="button"
                    className="sugbo-dp-action-btn"
                    onClick={clear}
                    disabled={!value}
                    style={actionBtnStyle(!value)}
                  >
                    Clear
                  </button>
                ) : <span />}
                {showToday && (
                  <button
                    type="button"
                    className="sugbo-dp-action-btn"
                    onClick={selectToday}
                    disabled={isOutOfRange(today, minDate, maxDate)}
                    style={actionBtnStyle(isOutOfRange(today, minDate, maxDate))}
                  >
                    Today
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {displayError && (
        <p
          role="alert"
          style={{ margin: '4px 0 0', fontSize: 13, color: COLORS.error }}
        >
          {displayError}
        </p>
      )}
    </div>
  );
}

function navBtnStyle(disabled) {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    border: 'none',
    borderRadius: 6,
    background: 'transparent',
    color: disabled ? COLORS.text.muted : COLORS.text.secondary,
    cursor: disabled ? 'not-allowed' : 'pointer',
  };
}

function actionBtnStyle(disabled) {
  return {
    background: 'transparent',
    border: 'none',
    padding: 0,
    fontSize: 13,
    fontWeight: 600,
    color: disabled ? COLORS.text.muted : COLORS.primary,
    cursor: disabled ? 'not-allowed' : 'pointer',
  };
}
