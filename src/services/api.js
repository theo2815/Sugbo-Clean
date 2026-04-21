// Real HTTP API client — Phase 2.
// Every public function returns { result: ... } matching the ServiceNow API envelope.
// All calls go through request() which attaches auth headers and handles errors.

import { API, IS_DEV_PROXY } from '../utils/constants';
import { getAuthHeader } from '../context/AuthContext';

// ============ ERROR CLASS ============

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
  get isNotFound() { return this.status === 404; }
  get isUnauthorized() { return this.status === 401; }
  get isNetwork() { return this.status === 0; }
}

// Global hook so AuthContext can react to any 401 returned from an authenticated call.
let _onUnauthorized = null;
export function setUnauthorizedHandler(fn) { _onUnauthorized = fn; }

// ============ NORMALISATION ============

// Flatten ServiceNow reference fields: { value: sys_id, display_value: "Lahug" }
// → two flat keys: field (display) + field_id (sys_id).
function normalizeRecord(record) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) return record;
  const out = {};
  for (const [key, val] of Object.entries(record)) {
    if (val && typeof val === 'object' && 'value' in val && 'display_value' in val) {
      out[key] = val.display_value;
      out[`${key}_id`] = val.value;
    } else {
      out[key] = val;
    }
  }
  return out;
}

function normalizeList(items) {
  return Array.isArray(items) ? items.map(normalizeRecord) : [];
}

// ============ REQUEST HELPER ============

async function request(path, { method = 'GET', body } = {}) {
  const headers = { Accept: 'application/json' };
  const authHeader = getAuthHeader();
  if (authHeader && !IS_DEV_PROXY) headers.Authorization = authHeader;
  if (body) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(`${API.url}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'Network error. Please check your connection and try again.');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const message = err?.error?.message || res.statusText || `Request failed (${res.status})`;
    // 401 only triggers the global handler when there was an auth header attached —
    // anonymous resident reads must never log an admin out.
    if (res.status === 401 && authHeader && _onUnauthorized) _onUnauthorized();
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return { result: { message: 'Deleted' } };
  const json = await res.json();
  // ServiceNow Scripted REST wraps setBody() in an extra { result } envelope — unwrap it.
  return json.result !== undefined ? json.result : json;
}

// ============ AUTH ============
// Verifies API reachability and — when a Basic header is provided — credential validity.
// Deliberately bypasses request(): at login time a 401 means "bad credentials", not
// "session expired", so it must not fire the global unauthorized handler.
export async function verifyAuth(authHeader) {
  const headers = { Accept: 'application/json' };
  if (authHeader && !IS_DEV_PROXY) headers.Authorization = authHeader;

  let res;
  try {
    res = await fetch(`${API.url}/barangays`, { headers });
  } catch {
    throw new ApiError(0, 'Network error.');
  }
  if (!res.ok) throw new ApiError(res.status, res.statusText || `Request failed (${res.status})`);
}

// ============ CACHE ============
// Small in-memory cache for the last-selected barangay's merged payload.
// Invalidated on ttl expiry; 60s is enough for a resident checking pickup info.
const _barangayCache = new Map();
const CACHE_TTL_MS = 60_000;

function cacheGet(key) {
  const entry = _barangayCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.at > CACHE_TTL_MS) {
    _barangayCache.delete(key);
    return null;
  }
  return entry.value;
}

function cacheSet(key, value) {
  _barangayCache.set(key, { value, at: Date.now() });
}

export function clearBarangayCache() { _barangayCache.clear(); }

// ============ RESIDENT ENDPOINTS (8) ============

export async function getBarangays() {
  const data = await request('/barangays');
  return { result: normalizeList(data.result) };
}

export async function getHaulers() {
  const data = await request('/haulers');
  return { result: normalizeList(data.result) };
}

// Used by ScheduleChecker + RouteBuilder: one hauler per barangay.
export async function getHaulerByBarangay(barangaySysId) {
  const data = await request(`/haulers?barangay_id=${encodeURIComponent(barangaySysId)}`);
  const list = normalizeList(data.result);
  return { result: list[0] || null };
}

// Merged barangay payload used by the /schedule page. Cached for 60s so
// repeat selections of the same barangay don't re-hit the network.
export async function getBarangayBundle(barangaySysId) {
  const cached = cacheGet(barangaySysId);
  if (cached) return cached;

  const [schedRes, haulerRes, stopsRes] = await Promise.allSettled([
    getSchedules(barangaySysId),
    getHaulerByBarangay(barangaySysId),
    getRouteStops({ barangayId: barangaySysId }),
  ]);

  const bundle = {
    schedules: schedRes.status === 'fulfilled' ? schedRes.value.result : [],
    hauler: haulerRes.status === 'fulfilled' ? haulerRes.value.result : null,
    routeStops: stopsRes.status === 'fulfilled' ? stopsRes.value.result : [],
    errors: {
      schedules: schedRes.status === 'rejected' ? schedRes.reason : null,
      hauler: haulerRes.status === 'rejected' ? haulerRes.reason : null,
      routeStops: stopsRes.status === 'rejected' ? stopsRes.reason : null,
    },
  };
  cacheSet(barangaySysId, bundle);
  return bundle;
}

// Kept for admin contexts that resolve hauler by display name from a loaded list.
export async function getHaulerByName(name) {
  const data = await request('/haulers');
  const all = normalizeList(data.result);
  return { result: all.find((h) => h.name === name) || null };
}

// barangayId optional — omit to fetch all (used by RouteEditor admin).
// Backend scripted REST reads `barangay_id` from queryParams — don't rename.
export async function getSchedules(barangayId) {
  const path = barangayId
    ? `/schedules?barangay_id=${encodeURIComponent(barangayId)}`
    : '/schedules';
  const data = await request(path);
  return { result: normalizeList(data.result) };
}

export async function createReport({ barangay, missed_date, waste_type, email, description }) {
  const data = await request('/reports', {
    method: 'POST',
    body: { barangay, missed_date, waste_type, email, description },
  });
  return { result: normalizeRecord(data.result) };
}

export async function getReportByCode(reportCode) {
  const data = await request(`/reports/${encodeURIComponent(reportCode)}`);
  return { result: normalizeRecord(data.result) };
}

export async function getWasteItems(search, binType) {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (binType) params.set('bin_type', binType);
  const query = params.toString() ? `?${params.toString()}` : '';
  const data = await request(`/waste-items${query}`);
  return { result: normalizeList(data.result) };
}

// Accepts { haulerId, barangayId, scheduleId } — all optional. Backend supports
// any combination as filters; omit all to fetch every stop.
export async function getRouteStops({ haulerId, barangayId, scheduleId } = {}) {
  const params = new URLSearchParams();
  if (haulerId) params.set('hauler_id', haulerId);
  if (barangayId) params.set('barangay_id', barangayId);
  if (scheduleId) params.set('schedule', scheduleId);
  const qs = params.toString();
  const path = qs ? `/route-stops?${qs}` : '/route-stops';
  const data = await request(path);
  return { result: normalizeList(data.result).sort((a, b) => (a.stop_order || 0) - (b.stop_order || 0)) };
}

export async function subscribeReminder({ email, schedules }) {
  const data = await request('/reminders', { method: 'POST', body: { email, schedules } });
  return { result: data.result };
}

// ============ ADMIN ENDPOINTS (14) ============

export async function getAllReports() {
  const data = await request('/reports');
  return { result: normalizeList(data.result) };
}

export async function updateReportStatus(sysId, status) {
  const data = await request(`/reports/${sysId}/status`, { method: 'PATCH', body: { status } });
  return { result: normalizeRecord(data.result) };
}

export async function deleteReport(sysId) {
  return request(`/reports/${sysId}`, { method: 'DELETE' });
}

// Photo upload goes to the standard ServiceNow attachment endpoint (different base path).
// Uses XHR so we can expose progress events to the caller.
export function uploadReportPhoto(reportSysId, file, onProgress) {
  return new Promise((resolve, reject) => {
    const authHeader = getAuthHeader();
    const url = `${API.instance}/api/now/attachment/file`
      + `?table_name=x_1986056_sugbocle_report`
      + `&table_sys_id=${reportSysId}`
      + `&file_name=${encodeURIComponent(file.name)}`;

    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.setRequestHeader('Accept', 'application/json');
    if (authHeader && !IS_DEV_PROXY) xhr.setRequestHeader('Authorization', authHeader);

    if (onProgress) {
      xhr.upload.onprogress = (ev) => {
        if (ev.lengthComputable) onProgress(Math.round((ev.loaded / ev.total) * 100));
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try { resolve(JSON.parse(xhr.responseText)); }
        catch { resolve({}); }
      } else {
        reject(new ApiError(xhr.status, `Photo upload failed (${xhr.status})`));
      }
    };
    xhr.onerror = () => reject(new ApiError(0, 'Network error during photo upload.'));
    xhr.send(file);
  });
}

// Admin: list attachments for a report record (used by the detail drawer).
export async function getReportAttachments(reportSysId) {
  const authHeader = getAuthHeader();
  const qs = `sysparm_query=${encodeURIComponent(
    `table_name=x_1986056_sugbocle_report^table_sys_id=${reportSysId}`
  )}`;
  const res = await fetch(`${API.instance}/api/now/attachment?${qs}`, {
    headers: {
      Accept: 'application/json',
      ...(authHeader && !IS_DEV_PROXY ? { Authorization: authHeader } : {}),
    },
  });
  if (!res.ok) throw new ApiError(res.status, 'Failed to load attachments');
  const data = await res.json();
  return {
    result: (data.result || []).map((a) => ({
      sys_id: a.sys_id,
      file_name: a.file_name,
      content_type: a.content_type,
      size_bytes: a.size_bytes,
      download_url: `${API.instance}/api/now/attachment/${a.sys_id}/file`,
    })),
  };
}

// --- Schedule CRUD ---

export async function createSchedule(data) {
  const res = await request('/schedules', { method: 'POST', body: data });
  return { result: normalizeRecord(res.result) };
}

export async function updateSchedule(sysId, data) {
  const res = await request(`/schedules/${sysId}`, { method: 'PUT', body: data });
  return { result: normalizeRecord(res.result) };
}

export async function deleteSchedule(sysId) {
  return request(`/schedules/${sysId}`, { method: 'DELETE' });
}

// --- Hauler CRUD ---

export async function createHauler(data) {
  const res = await request('/haulers', { method: 'POST', body: data });
  return { result: normalizeRecord(res.result) };
}

export async function updateHauler(sysId, data) {
  const res = await request(`/haulers/${sysId}`, { method: 'PUT', body: data });
  return { result: normalizeRecord(res.result) };
}

export async function deleteHauler(sysId) {
  return request(`/haulers/${sysId}`, { method: 'DELETE' });
}

// --- Route Stop CRUD ---

export async function createRouteStop(data) {
  const res = await request('/route-stops', { method: 'POST', body: data });
  return { result: normalizeRecord(res.result) };
}

export async function updateRouteStop(sysId, data) {
  const res = await request(`/route-stops/${sysId}`, { method: 'PUT', body: data });
  return { result: normalizeRecord(res.result) };
}

export async function deleteRouteStop(sysId) {
  return request(`/route-stops/${sysId}`, { method: 'DELETE' });
}

// --- Waste Item CRUD ---

export async function createWasteItem(data) {
  const res = await request('/waste-items', { method: 'POST', body: data });
  return { result: normalizeRecord(res.result) };
}

export async function updateWasteItem(sysId, data) {
  const res = await request(`/waste-items/${sysId}`, { method: 'PUT', body: data });
  return { result: normalizeRecord(res.result) };
}

export async function deleteWasteItem(sysId) {
  return request(`/waste-items/${sysId}`, { method: 'DELETE' });
}

// ============ GENERIC CRUD FACTORY ============
// Returns { list, get, create, update, remove } for a REST resource. Each method
// goes through request() and applies the standard normalisation. Used for new
// resources to avoid restating the same five-method boilerplate.
export function crud(resource) {
  const base = `/${resource}`;
  return {
    async list() {
      const res = await request(base);
      return { result: normalizeList(res.result) };
    },
    async get(sysId) {
      const res = await request(`${base}/${sysId}`);
      return { result: normalizeRecord(res.result) };
    },
    async create(data) {
      const res = await request(base, { method: 'POST', body: data });
      return { result: normalizeRecord(res.result) };
    },
    async update(sysId, data) {
      const res = await request(`${base}/${sysId}`, { method: 'PUT', body: data });
      return { result: normalizeRecord(res.result) };
    },
    async remove(sysId) {
      return request(`${base}/${sysId}`, { method: 'DELETE' });
    },
  };
}

export const barangayAPI = crud('barangays');
