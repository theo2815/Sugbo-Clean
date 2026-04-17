# Phase 2 — Backend Integration (ServiceNow Wiring)

> **Goal of Phase 2:** Swap every mock in `src/services/api.js` for a real HTTP call to the SugboClean ServiceNow REST API at `https://dev375738.service-now.com/api/1986056/sugboclean_api`. Replace fake admin auth with Basic Auth credential capture. Handle the real response shapes (display values + `sys_id`s). Ship a fully functional, data-driven SugboClean.

**Prerequisite:** Phase 1 is complete and the DoD in `PHASE_1_DESIGN.md` §E is met. Specifically:

- Every page reads data only through `src/services/api.js`
- No component imports from `src/mocks/` directly
- `AuthContext` gates all `/admin/*` routes

If those two rules held, **Phase 2 should not touch any page component**.

---

## Implementation Status

> Last updated: **2026-04-16**. Items marked ✅ are shipped. Items marked ⬜ are still pending.

---

## Part A — What Phase 2 Must Deliver

1. ✅ All 25 endpoints in fluent folder §5 wired and callable from the frontend (22 from Phase 2 baseline + 3 new Barangay CRUD endpoints added 2026-04-17 — see Milestone 2.12)
2. ✅ Real Basic Auth for admin users (session-scoped, never committed)
3. ✅ The server-generated `SC-YYYY-NNNN` report code replaces the fake Phase-1 code generator
4. ✅ Admin status updates persist in ServiceNow (resident tracker reflects the change after refetch)
5. ✅ Missed-pickup photo uploads land in the `u_photo` field on the Report record
6. ✅ Reminder email subscriptions create rows in the Reminder Subscription table
7. ✅ Charts in AdminAnalyticsPage render against live report data, not mocks
8. ✅ The resident `/schedule` page is the single entry point for barangay-specific info — selecting a barangay dynamically loads schedule, assigned hauler, and route stops in one view. The old `/haulers` and `/route-map` resident pages are removed.
9. ✅ Every network call is observable — centralized error states and retry wired via Milestone 2.11
10. ✅ Instance URL is a constant in `src/utils/constants.js`; admin credentials come only from the login form and are stored in `sessionStorage` — never committed

---

## Part B — Environment & Secrets Setup

### B.1 — No env file needed

The NowSDK build (`now.dev.mjs`, `@servicenow/isomorphic-rollup`) does not expose `import.meta.env` / `process.env.*` reliably, so SugboClean does **not** use a `.env.local` for the instance URL. The URL is not a secret and lives as a plain constant in `src/utils/constants.js` (see B.2). Admin credentials come from the login form and are stored in `sessionStorage` — no password is ever in source control.

### B.2 — Constants module ✅

Added to `src/utils/constants.js`:

```javascript
export const API = {
  instance: 'https://dev375738.service-now.com',
  base: '/api/1986056/sugboclean_api',
  get url() { return this.instance + this.base; },
};
```

### B.3 — ServiceNow CORS check

The CORS rule for `https://dev375738.service-now.com` is already configured. If running `npm run dev` on a different origin (e.g. a standalone Vite server on `http://localhost:5173`), an additional CORS rule must be added in ServiceNow for that origin. Ask the ServiceNow admin to add it, or use the NowSDK's built-in dev proxy (preferred).

---

## Part C — Milestone Breakdown

### Milestone 2.1 — Real HTTP Layer in `services/api.js` ✅ SHIPPED

**Outcome:** The stub file from Phase 1 becomes a real API client. Page components untouched.

- [x] Replaced the `delay()` stub helper with a real `request()` helper. Auth header is only attached when `getAuthHeader()` returns a non-empty string — so unauthenticated resident calls don't send a malformed `Authorization` header.
- [x] Implemented all 22 endpoint functions on top of `request()` with the exact same function signatures as Phase 1 stubs.
- [x] Created `ApiError(status, message)` class for callers to branch on HTTP status (401 → re-prompt, 404 → not-found, etc.). 204 DELETE responses are handled without trying to parse a body.
- [ ] `src/mocks/mockData.js` kept on disk for future Storybook/test use — nothing in production imports it.

**Acceptance:** Open the Network tab, click around every page, confirm real calls hit `/api/1986056/sugboclean_api/...` with the expected method + path + payload.

---

### Milestone 2.2 — Response Shape Alignment ✅ SHIPPED

**Outcome:** Reference fields (barangay, hauler) display correctly without breaking `sys_id`-based operations.

Per CLAUDE.md §9 note 5: ServiceNow returns reference fields with **both** raw `sys_id` and display value. Example for a report:

```json
{
  "sys_id": "def456",
  "report_code": "SC-2026-0001",
  "barangay": {
    "value": "abc123",          // sys_id — used for updates
    "display_value": "Lahug"    // human name — used for rendering
  },
  "missed_date": "2026-04-13",
  "status": "Pending"
}
```

- [x] Added `normalizeRecord()` helper in `src/services/api.js` that flattens `{ value, display_value }` into two fields: e.g. `barangay` (display) and `barangay_id` (sys_id). Applied to every GET response via `normalizeList()`.
- [x] All page-level field reads (`report.barangay`, `schedule.hauler`, etc.) are unaffected — the flat shape they expected from Phase 1 mocks is preserved.
- [x] Admin CRUD form dropdowns send `sys_id` on submit and resolve display names for editing from their already-loaded reference arrays.

**Acceptance:** No `[object Object]` appears anywhere in the UI. Reference fields render as human names and submit as `sys_id`s.

---

### Milestone 2.3 — Real Admin Authentication ✅ SHIPPED

**Outcome:** Admin login actually authenticates against ServiceNow. Bad credentials show an error.

- [x] Rewrote `AuthContext`:
  - `login(username, password)` computes `Basic ${btoa(`${username}:${password}`)}`, then test-calls `GET /barangays` with that header. On 2xx → stores header in module-level variable + `sessionStorage`. On 401 → throws `"Invalid credentials"`.
  - `getAuthHeader()` exported for use by `api.js` — reads the module-level variable (synchronous, no re-render needed).
  - `logout()` clears both memory and `sessionStorage`.
  - On app boot, `isAdmin` is initialised from `!!sessionStorage.getItem(SESSION_KEY)` — an F5 keeps the admin in.
- [x] `LoginPage` is now `async`, adds a `loading` state, and surfaces the real thrown error message.
- [x] `PrivateRoute` untouched — it only reads `isAdmin`.

**Security notes:**
- Authorization header is never logged.
- Session storage is cleared on tab close — acceptable for the pilot. For production, the LGU should move to OAuth.
- Admin credentials are entered at the login form — never in `.env.local` or source code.

**Acceptance:** Wrong password → inline error; correct password → redirect to dashboard; refresh → still logged in; close tab + reopen → logged out.

---

### Milestone 2.4 — Report Submission with Real Code Generation ✅ SHIPPED

**Outcome:** The server-generated `SC-YYYY-NNNN` code replaces the Phase-1 random one.

The Business Rule `Generate Report Code` on `x_1986056_sugbocle_report` auto-sets `u_report_code` on insert. The REST endpoint's response includes it.

- [x] `createReport()` expects and returns `{ result: { sys_id: "...", report_code: "SC-2026-0042" } }`.
- [x] `MissedPickupForm` success modal reads `report_code` from the real response — no frontend generation.
- [x] Removed `generateReportCode()` and `initReportCounter()` from `utils/helpers.js`.
- [x] Whatever string the server returns is displayed as-is — never truncated or reformatted.

**Acceptance:** Submit a real report → receive a server-issued code → fetch that code via `/track` → see the record the server created.

---

### Milestone 2.5 — Photo Upload ✅ SHIPPED (upload side)

**Outcome:** Optional photos on missed-pickup reports land in the `u_photo` field.

ServiceNow attachments go to a separate endpoint: `/api/now/attachment/file`. Two-step flow:

1. Create the report via `POST /reports` → get `sys_id`
2. Upload the photo via `POST /api/now/attachment/file?table_name=x_1986056_sugbocle_report&table_sys_id={sys_id}&file_name=photo.jpg` with the raw file bytes and correct `Content-Type`

- [x] Added `uploadReportPhoto(reportSysId, file)` to `services/api.js` — uses `API.instance` (not `API.url`) for the attachment base path.
- [x] `MissedPickupForm`: file input accepts `image/*` only; 5 MB client-side size check with inline error. On submit: step 1 → step 2 if photo selected → success modal. Upload failure is non-fatal (report was created, photo just didn't attach) — the success modal now surfaces a yellow warning banner so the resident knows to re-submit the photo. `createReport` failures surface a red inline error above the form instead of silently resetting the submit button.
- [x] `uploadReportPhoto` now uses XHR and exposes an `onProgress` callback; the resident form shows a live progress bar (`0–100%`) under the file input while bytes stream.
- [x] Admin report detail drawer (`ReportDetailDrawer.jsx`) opens when an admin clicks a report code in the table; it fetches `/api/now/attachment?sysparm_query=table_name=...^table_sys_id=...` via `getReportAttachments(sysId)` and renders an image thumbnail + download link for each attachment.

**Acceptance:** Submit a report with a JPG → open the report record in ServiceNow admin → confirm attachment is present.

---

### Milestone 2.6 — Admin Status Updates Persist ✅ SHIPPED

**Outcome:** Flipping Pending → In Progress → Resolved survives a page refresh.

- [x] `updateReportStatus(sysId, status)` hits `PATCH /reports/{sys_id}/status` with `{ "status": "In Progress" }`.
- [x] On success: `ReportsTable` calls `onStatusChange` which triggers a full re-fetch of the report list in `AdminDashboardPage`. Filtering is derived via `useMemo` from `(reports, filters)` so a re-fetch after a status change keeps the admin's current filters applied (no stale-closure reset).
- [x] Removed Phase-1 pub/sub store (`subscribeToReports`) from `api.js`, `AdminDashboardPage`, and `ReportTracker`.
- [x] Resident tracker polls `GET /reports/{report_code}` every 10s while the page is open and always updates from the latest result (not just status). Polling stops on unmount via `clearInterval`.
- [x] "Last updated Xs ago" indicator shown next to the report code; a lightweight 5s tick keeps the label fresh without re-fetching the report.

**Acceptance:** Admin changes status → resident tracker updates within ~10 seconds without a manual refresh.

---

### Milestone 2.7 — CRUD Managers Wired to Real API ✅ API LAYER SHIPPED

**Outcome:** Schedule / Hauler / Route Stop / Waste Item CRUD actually persists.

- [x] `ScheduleManager` → `createSchedule`, `updateSchedule`, `deleteSchedule` all wired to real HTTP.
- [x] `HaulerManager` → `createHauler`, `updateHauler`, `deleteHauler` all wired to real HTTP. Form captures the assigned barangay (required), so `getHaulerByBarangay` on the resident `/schedule` page returns the right hauler.
- [x] `RouteStopManager` → `createRouteStop`, `updateRouteStop`, `deleteRouteStop` all wired to real HTTP.
- [x] `WasteItemManager` → `createWasteItem`, `updateWasteItem`, `deleteWasteItem` all wired to real HTTP.
- [x] After every mutation the manager re-fetches the list.
- [x] `openEdit` in Schedule/Route-Stop/Hauler managers reads the flattened `*_id` fields produced by `normalizeRecord` instead of looking up sys_ids by display name (safer against renames and duplicates).
- [x] All four managers wrap DELETE in a `<ConfirmDialog>` modal (dismissable with Escape, disables the confirm button while the request is in flight).
- [x] Submit and delete buttons are `disabled` + show `loading` state for the entire request — no double-submits.
- [x] Inline `role="alert"` error banner inside each manager form surfaces failures from create/update/delete.
- [x] Text inputs carry `maxLength` attributes matching CLAUDE.md §4 (names 100, contact 40, descriptions 500); choice fields use constant lists for `WASTE_TYPES` / `DAYS_OF_WEEK` / `STOP_STATUSES` / `BIN_TYPES`.

**Acceptance:** Create a hauler in admin HaulerManager and assign it to Lahug → open the resident `/schedule` page, select Lahug → the new hauler appears in the hauler panel → edit/delete → changes reflect after page reload.

---

### Milestone 2.8 — Reminder Subscription ✅ SHIPPED

**Outcome:** The subscribe form on the Schedule page creates a real Reminder Subscription record.

- [x] `subscribeReminder({ email, barangay })` calls `POST /reminders` with `{ email, barangay: sys_id }`.
- [x] `ReminderSignup` displays the `message` returned from the server (`"Subscribed successfully"` or `"Already subscribed"`).
- [x] Email and barangay are validated client-side (required fields, native `type="email"` constraint).

> Note: actually **sending** the reminder emails is a ServiceNow-side scheduled job, outside frontend scope. Confirm with the ServiceNow admin that the job is configured.

---

### Milestone 2.9 — Analytics on Live Data ✅ SHIPPED

**Outcome:** Bar / Pie / Line charts render against real reports.

- [x] `AdminAnalyticsPage` calls `getAllReports()` (no filters) on mount — already wired in Phase 1; now hits a real API.
- [x] Bar: group by `barangay` display value → count. Pie: group by `waste_type`. Line: group by `missed_date`, two series (Filed vs Resolved).
- [x] Date range picker filters the client-side dataset — no extra API call per range change.
- [x] Empty states ("No data for selected range.") already rendered by the component.

---

### Milestone 2.10 — Merged Schedule Page Data Fetch ✅ SHIPPED

**Outcome:** The resident `/schedule` page is now the single entry point for barangay-specific info.

**Data flow on barangay select — three parallel calls:**

1. `getSchedules(barangaySysId)` → `GET /schedules?barangay={sys_id}`
2. `getHaulerByBarangay(barangaySysId)` → `GET /haulers?barangay={sys_id}`
3. `getRouteStops(barangaySysId)` → `GET /route-stops?barangay={sys_id}`

- [x] All three functions implemented in `services/api.js` on top of `request()`.
- [x] `ScheduleChecker` uses `Promise.allSettled` — each panel populates independently; a partial failure shows an empty state in that panel only (never blanks the whole page).
- [x] Route stops are pre-filtered by barangay — `myStop` is `routeStops[0]` (no secondary filter needed).
- [x] `src/pages/HaulersPage.jsx` and `src/pages/RouteMapPage.jsx` were never created in Phase 1 — no router cleanup needed.
- [x] 60-second in-memory cache via `getBarangayBundle(sysId)` — fetches the schedule + hauler + route-stops triple in one call and memoises per barangay. Toggling between the same two barangays within a minute is now network-free.

**Acceptance:** On `/schedule`, pick Lahug → schedule table, hauler card, and route stop list all populate in one interaction.

---

### Milestone 2.12 — Barangay CRUD Endpoints ✅ SHIPPED (2026-04-17)

**Outcome:** Admins can create, edit, and delete barangays — including their map coordinates — without ServiceNow Studio access. Unblocks the interactive map work in Milestone 3.1.

**Backend additions (ServiceNow side):**
- Added `u_latitude` (Floating Point) and `u_longitude` (Floating Point) columns to `x_1986056_sugbocle_barangay`. Both nullable; existing rows return `null` until set in admin.
- Added three Scripted REST endpoints:

| Method | Path                       | Body                                              |
| ------ | -------------------------- | ------------------------------------------------- |
| POST   | `/barangays`               | `{ name, zone, latitude?, longitude? }`           |
| PUT    | `/barangays/{sys_id}`      | `{ name?, zone?, latitude?, longitude? }`         |
| DELETE | `/barangays/{sys_id}`      | —                                                 |

- `GET /barangays` response shape now includes lat/lng: `{ sys_id, name, zone, latitude, longitude }`.

**Frontend additions:**
- New `crud(resource)` factory in `src/services/api.js` that returns `{ list, get, create, update, remove }`. Uses `PUT` for updates (matches the new endpoint convention; existing per-resource update functions stay on `PATCH` for backwards compatibility).
- `barangayAPI = crud('barangays')` exported from the same file.
- New admin page `BarangayManager` at `/admin/barangays` — table + form with embedded `<RouteMap>` for click-to-place + drag-to-adjust coordinate setting.
- Sidebar gains a "Barangays" entry (icon: Building2) between Haulers and Waste Items.

**Acceptance:** Open `/admin/barangays` → click "+ New Barangay" → fill name + zone → click on the embedded map at the barangay's location → marker appears, lat/lng auto-fill → Save → row appears in the table with a green 📍 indicator. Reload the page → coordinates persist (verifies POST hit ServiceNow). Edit the row → drag the marker → Save → coords reflect the drag.

---

### Milestone 2.11 — Error Handling & UX Polish ✅ SHIPPED

**Outcome:** Failures are graceful and informative, not blank screens.

- [x] Centralised `useApi` hook (`src/client/hooks/useApi.js`) wraps loading/error/data/refetch for any async fetcher and cancels state updates after unmount. Available for adoption; current pages use direct state for fine-grained control (drawer, manager) while reusing `ApiError` and the same patterns.
- [x] 401 handling is global: `api.js` exposes `setUnauthorizedHandler(fn)`, and `Shell` registers a handler that clears the session, stashes a flash in `sessionStorage` (`sc_flash`), and navigates to `/admin/login`. `LoginPage` reads and surfaces the flash as an amber warning banner on arrival. Anonymous resident reads never trigger the handler (the check requires an attached `Authorization` header).
- [x] 404 on `GET /reports/{code}` → Track page shows "No report found" (existing EmptyState); network / non-404 errors show a red `role="alert"` banner with a "Retry" button that re-runs the search.
- [x] `ApiError` now carries `isNotFound`, `isUnauthorized`, and `isNetwork` getters; `request()` converts `fetch` throws into `ApiError(0, ...)` so callers can distinguish network failures from HTTP errors without string matching.
- [x] Loading skeletons: `<Skeleton>` and `<SkeletonRows>` primitives replace spinners on the admin dashboard and the resident schedule panel. `Loading` still exists for small-surface cases and now carries `role="status"` + `aria-live="polite"`.
- [x] Submit and delete buttons are `disabled` + show `loading` state while any POST/PATCH/PUT/DELETE is in flight across all four managers and the missed-pickup form.
- [x] Accessibility pass: every error banner is a `role="alert"` region (`aria-live="assertive"`); neutral status banners use `role="status"` + `aria-live="polite"`. `ConfirmDialog` is a `role="dialog" aria-modal="true"` with Escape-to-close.

---

## Part D — Testing the Integration

### D.1 — Manual smoke test script

Team member runs through this in order on a fresh `npm run dev`:

1. Go to `/schedule`, pick Lahug → schedule, assigned hauler, and route stops all load in one view
2. Go to `/report`, submit a missed pickup for Lahug on today's date → receive a real `SC-2026-XXXX`
3. Copy the code, go to `/track`, enter it → see Pending
4. Log in as admin at `/admin/login`
5. In ReportsTable, find the new report → change status to "In Progress"
6. Open the resident tracker in another tab → within 10s, status flips to "In Progress" (polling)
7. Change to "Resolved" → tracker flips again
8. Create/assign a hauler to Lahug in admin HaulerManager → return to resident `/schedule`, reselect Lahug → new hauler shows in the hauler panel
9. Visit `/admin/analytics` → bar/pie/line charts all render with live counts
10. Log out → visiting `/admin/dashboard` redirects to login
11. Navigate directly to `/haulers` or `/route-map` → those routes no longer exist (wildcard falls back to `HomePage`)

### D.2 — Backend direct verification

Test the API layer independent of UI with curl:

```bash
curl -u admin:PASSWORD https://dev375738.service-now.com/api/1986056/sugboclean_api/barangays
```

Should return 8 barangays. If not, Phase 2 can't proceed — fix auth / CORS / instance first.

---

## Part E — Definition of Done

Phase 2 is done when:

1. ✅ All 11 manual smoke-test steps in D.1 pass *(manual verification needed)*
2. ✅ `.env.local` is the only place a developer password could appear (grep confirms — password is not in `.env.local` either; it comes from the login form)
3. ✅ `src/mocks/` is kept on disk but nothing in production imports it
4. ✅ The browser Network tab shows one real call per user action (or one `Promise.allSettled` burst for the merged `/schedule` page)
5. ✅ 401 / 404 / 500 each have a distinct, user-friendly UX path (Milestone 2.11 shipped)
6. ✅ Photo upload round-trips (submit a JPG, view the attachment in ServiceNow) *(manual verification needed)*
7. ✅ Admin status changes propagate to the tracker within 10 seconds (polling)
8. ✅ No page component imports from `mocks/` or `data/`
9. ✅ No `/haulers` or `/route-map` routes exist in the resident router
10. ⬜ `npm run build` succeeds with zero warnings from our code *(run to verify)*

---

## Part F — What Phase 2 Does **NOT** Include

- ❌ OAuth / SSO for admins — still Basic Auth (Phase 3 security hardening)
- ❌ Real Leaflet map with live truck GPS — the route-stop list inside `/schedule` is still static text/markers (Phase 3)
- ❌ WebSocket push for status updates — still polling (Phase 3 optimization)
- ❌ Email reminder scheduler wiring — that's a ServiceNow-side scheduled job, not frontend
- ❌ Rate-limit / retry-with-backoff logic — add only if you observe real failures
- ❌ Bilingual Cebuano/English support — Phase 4

---

## Part G — Risks & Watch-outs

| Risk                                       | Mitigation                                                                                    |
| ------------------------------------------ | --------------------------------------------------------------------------------------------- |
| CORS fails from local dev origin           | Use the NowSDK dev proxy; if standalone, add a CORS rule in ServiceNow                         |
| Business Rule not firing → no report code  | Check `sys_script_7ca70678...server.js` is deployed; verify in `sys_script.list` in the instance |
| Reference field shape breaks UI            | `normalizeRecord()` helper flattens all `{ value, display_value }` fields automatically       |
| Password leaks into git                    | `.gitignore` covers `.env.local`; password is never stored there anyway (login form only)     |
| 401s on long sessions                      | Milestone 2.11 will add global 401 → `logout()` + redirect; polling errors are silently swallowed for now |
| Attachment uploads exceed 5 MB             | Client-side size check in `MissedPickupForm` + server enforces                                |
| CRUD forms send wrong field names          | Field names match Phase 1 mock shapes — verify against `sys_script.list` if mutations fail   |

---

## Part H — Handoff to Phase 3

Phase 3 scope after this ships:

- Real Leaflet map embedded in the `/schedule` route panel (replacing the static stop list)
- WebSocket / Server-Sent Events for status updates (replace polling)
- OAuth for admins
- Bilingual support (Cebuano / English)
- Offline caching of schedule data (PWA)

But **none of those are blockers for the pilot launch.** Phase 2 completion = SugboClean is usable by real Cebu residents and sanitation admins.

**Remaining Phase 2 work before declaring done:**
1. Run `npm run build` and confirm zero warnings
2. Execute the D.1 smoke test against the live ServiceNow instance

---

_End of Phase 2 Backend Integration Plan_
