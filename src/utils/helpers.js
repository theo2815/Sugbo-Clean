import { COLORS, STATUS_COLOR_MAP } from './constants';

export function formatDate(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatReportCode(code) {
  return code || '';
}

export function getStatusColor(status) {
  return STATUS_COLOR_MAP[status] || COLORS.text.muted;
}

export function getBinColor(binType) {
  return COLORS.bin[binType] || COLORS.text.muted;
}

// ServiceNow Glide time fields serialize as "1970-01-01 HH:MM:SS". Extract
// just "HH:MM" for display / <input type="time"> values.
export function fromGlideTime(val) {
  if (!val) return '';
  const m = String(val).match(/(\d{2}:\d{2})/);
  return m ? m[1] : val;
}

// <input type="time"> returns "HH:MM". The Glide time field needs "HH:MM:SS"
// or ServiceNow silently stores the default (00:00:00).
export function toGlideTime(val) {
  if (!val) return '';
  const s = String(val).trim();
  if (/^\d{2}:\d{2}$/.test(s)) return `${s}:00`;
  return s;
}

// Derive a stop's arrival time from its parent schedule's start time plus
// an offset in minutes. Returns 24-hour "HH:MM"; pipe through formatTime12h
// for display. Wraps around midnight so an overnight route stays sensible.
export function etaFromSchedule(timeWindowStart, offsetMinutes) {
  const hhmm = fromGlideTime(timeWindowStart);
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return hhmm;
  const total = h * 60 + m + (Number(offsetMinutes) || 0);
  const wrapped = ((total % 1440) + 1440) % 1440;
  const hh = String(Math.floor(wrapped / 60)).padStart(2, '0');
  const mm = String(wrapped % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

// Human-readable 12-hour display — "22:00" or "1970-01-01 22:00:00" → "10:00 PM".
// Use for read-only rendering; edit forms should stay on fromGlideTime so
// <input type="time"> gets its required 24-hour value.
export function formatTime12h(val) {
  const hhmm = fromGlideTime(val);
  if (!hhmm) return '';
  const [hStr, m] = hhmm.split(':');
  const h = Number(hStr);
  if (!Number.isFinite(h)) return hhmm;
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${period}`;
}

