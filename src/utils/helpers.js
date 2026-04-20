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

function hhmmToMinutes(val) {
  const hhmm = fromGlideTime(val);
  if (!hhmm) return null;
  const [h, m] = hhmm.split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

// Sunday=0 … Saturday=6 — matches JS Date.getDay() and Intl's "weekday: long".
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ServiceNow choice fields store the raw value (often lowercase: "monday"), while
// Intl's weekday: 'long' emits Title Case ("Monday"). Normalize both sides so a
// schedule row and `manilaNowParts().weekday` can be compared without drift.
function dayNameToIndex(name) {
  if (!name) return -1;
  const needle = String(name).trim().toLowerCase();
  return DAY_NAMES.findIndex((d) => d.toLowerCase() === needle);
}

// Current day-of-week + minutes-of-day in Asia/Manila (UTC+8, no DST).
// Evaluated via Intl so it's correct regardless of the viewer's browser TZ —
// a resident testing abroad still sees the LGU's local clock.
function manilaNowParts(now) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila',
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = fmt.formatToParts(now);
  const get = (type) => parts.find((p) => p.type === type)?.value;
  const weekday = get('weekday');
  // Intl's 2-digit hour can return "24" for midnight in some locales; normalize.
  let hour = Number(get('hour'));
  if (!Number.isFinite(hour) || hour === 24) hour = 0;
  const minute = Number(get('minute')) || 0;
  return {
    dayIndex: dayNameToIndex(weekday),
    minutesOfDay: hour * 60 + minute,
  };
}

// Classify each stop relative to `now` using its offset from the schedule's
// start time. Returns { [sys_id]: 'Not Arrived' | 'Current' | 'Passed' }.
//
// Rules (evaluated in Asia/Manila time):
// - Wrong day of week → every stop is Not Arrived (grey). A Monday schedule
//   stays grey all of Sunday even if admins built it in advance.
// - Correct day, before the start time → every stop is Not Arrived.
// - During the window → Current is the stop with the largest offset still ≤
//   minutes elapsed since start; earlier offsets → Passed; later → Not Arrived.
// - After the window ends → every stop is Passed.
// - Overnight wrap (end < start): the early-morning portion on the day AFTER
//   `day_of_week` still counts as live until the window closes, so a route
//   crossing midnight doesn't snap back to grey.
export function computeStopStatuses(stops, schedule, now = new Date()) {
  const allNotArrived = Object.fromEntries((stops || []).map((s) => [s.sys_id, 'Not Arrived']));
  if (!schedule || !Array.isArray(stops) || stops.length === 0) return allNotArrived;

  const startMin = hhmmToMinutes(schedule.time_window_start);
  if (startMin == null) return allNotArrived;

  const scheduleDayIdx = dayNameToIndex(schedule.day_of_week);
  if (scheduleDayIdx < 0) return allNotArrived;

  const endMin = hhmmToMinutes(schedule.time_window_end);
  const wrapsPastMidnight = endMin != null && endMin < startMin;
  const windowMinutes = endMin != null
    ? (((endMin - startMin) % 1440) + 1440) % 1440 || 1440
    : 360;

  const { dayIndex: todayIdx, minutesOfDay: nowMin } = manilaNowParts(now);

  let elapsed;
  if (todayIdx === scheduleDayIdx) {
    const rawDelta = nowMin - startMin;
    if (rawDelta < 0) return allNotArrived;
    elapsed = rawDelta;
  } else if (wrapsPastMidnight && todayIdx === (scheduleDayIdx + 1) % 7) {
    elapsed = (1440 - startMin) + nowMin;
  } else {
    return allNotArrived;
  }

  if (elapsed > windowMinutes) {
    return Object.fromEntries(stops.map((s) => [s.sys_id, 'Passed']));
  }

  const sorted = [...stops]
    .sort((a, b) => (Number(a.offset_minutes) || 0) - (Number(b.offset_minutes) || 0));

  let currentSysId = null;
  for (const s of sorted) {
    const offset = Number(s.offset_minutes) || 0;
    if (offset <= elapsed) currentSysId = s.sys_id;
    else break;
  }

  const result = {};
  for (const s of stops) {
    const offset = Number(s.offset_minutes) || 0;
    if (s.sys_id === currentSysId) result[s.sys_id] = 'Current';
    else if (offset <= elapsed) result[s.sys_id] = 'Passed';
    else result[s.sys_id] = 'Not Arrived';
  }
  return result;
}

