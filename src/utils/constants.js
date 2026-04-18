// Design tokens, enums, and API config — single source of truth for the entire app.
// Status/choice values use the real ServiceNow API format (Title Case).

export const API = {
  instance: '',
  base: '/api/x_1986056_sugbocle/sugboclean_api',
  get url() { return this.instance + this.base; },
};

// True when running behind the NowSDK dev proxy (localhost dev server).
// The proxy already authenticates as admin — client-side auth headers are unnecessary and cause 400s.
export const IS_DEV_PROXY = typeof window !== 'undefined'
  && ['localhost', '[::1]', '127.0.0.1'].includes(window.location.hostname);

// OAuth 2.0 + PKCE config for admin login. client_id is public by design for a
// PKCE client — safe to ship in the bundle. The secret ServiceNow auto-generates
// for the registry entry is NOT used here; it would only belong on a backend proxy.
export const OAUTH = {
  clientId: 'bdd141a3648c4f8cb8497350b05b8efa',
  // MUST match the redirect URI registered on ServiceNow exactly. Using the
  // site root avoids needing SPA history fallback on the static dev server —
  // main.jsx forwards ?code=&state= into the hash callback route on any path.
  redirectUri: 'http://localhost:3000/',
  authorizeUrl: 'https://dev375738.service-now.com/oauth_auth.do',
  // Relative path: the NowSDK dev server at :3000 proxies /oauth_token.do to the
  // instance so the PKCE token fetch is same-origin. For prod (app deployed to
  // ServiceNow) this also works — requests are already same-origin with the OAuth
  // endpoint. Keep authorizeUrl absolute; that's a full-page nav, not a fetch.
  tokenUrl: '/oauth_token.do',
  // Refresh slightly before expiry so an in-flight request never sees a stale token.
  refreshMarginMs: 60_000,
};

// OAuth verified end-to-end 2026-04-18 — Basic Auth dev fallback disabled.
// loginBasic() remains in AuthContext for one release as a safety net; drop it next pass.
export const DEV_USE_BASIC_AUTH = false;

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
