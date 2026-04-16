// Design tokens, enums, and API config — single source of truth for the entire app.
// Status/choice values use the real ServiceNow API format (Title Case).

export const API = {
  instance: '',
  base: '/api/x_1986056_sugbocle/sugboclean_api',
  get url() { return this.base; },
};

// True when running behind the NowSDK dev proxy (localhost dev server).
// The proxy already authenticates as admin — client-side auth headers are unnecessary and cause 400s.
export const IS_DEV_PROXY = typeof window !== 'undefined'
  && ['localhost', '[::1]', '127.0.0.1'].includes(window.location.hostname);

export const COLORS = {
  primary: '#16A34A',
  primaryDark: '#15803D',
  primaryLight: '#DCFCE7',
  secondary: '#2563EB',
  secondaryDark: '#1D4ED8',
  secondaryLight: '#DBEAFE',

  status: {
    pending: '#F59E0B',
    inProgress: '#3B82F6',
    resolved: '#22C55E',
  },

  bin: {
    Biodegradable: '#22C55E',
    Recyclable: '#3B82F6',
    Residual: '#1F2937',
    Hazardous: '#EF4444',
  },

  text: {
    primary: '#0F172A',
    secondary: '#475569',
    muted: '#94A3B8',
  },

  bg: {
    page: '#F8FAFC',
    card: '#FFFFFF',
    muted: '#F1F5F9',
  },

  border: '#E2E8F0',
  error: '#EF4444',
  success: '#22C55E',
  warning: '#F59E0B',
};

export const STATUS = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
};

export const STATUS_COLOR_MAP = {
  'Pending': COLORS.status.pending,
  'In Progress': COLORS.status.inProgress,
  'Resolved': COLORS.status.resolved,
};

export const BIN_TYPES = ['Biodegradable', 'Recyclable', 'Residual', 'Hazardous'];

export const BIN_COLOR_MAP = {
  Biodegradable: 'Green',
  Recyclable: 'Blue',
  Residual: 'Black',
  Hazardous: 'Red',
};

export const WASTE_TYPES = ['Biodegradable', 'Recyclable', 'Residual'];

export const DAYS_OF_WEEK = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
];

export const STOP_STATUSES = ['Not Arrived', 'Current', 'Passed'];
