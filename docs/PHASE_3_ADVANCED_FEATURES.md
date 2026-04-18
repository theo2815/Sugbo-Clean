# Phase 3 — Advanced Features & Hardening

> **Goal of Phase 3:** Take the functional SugboClean pilot from Phase 2 and turn it into something the LGU would be proud to launch publicly — a real interactive map, genuine real-time status updates, secure auth, offline resilience, and Cebuano-first language support.

**Prerequisite:** Phase 2 is complete and the DoD in `PHASE_2_BACKEND_INTEGRATION.md` §E is met. Specifically:

- All 22 endpoints work end-to-end
- Admin login uses real Basic Auth
- Reports, photos, status changes, CRUD, reminders all persist in ServiceNow

If any Phase 2 item is still flaky, fix it first — Phase 3 assumes a stable foundation.

---

## Progress Snapshot (2026-04-18)

| Milestone | Status | Notes |
| --- | --- | --- |
| 3.1 Interactive Route Map | ✅ Shipped | `RouteMap.jsx` lives in `shared/` (used by both resident + admin), not `resident/`. Barangay `u_latitude` / `u_longitude` in place. Markers colored by `point_type` (Start / Stop / End), **not** by `u_stop_status` — re-evaluate once real status lifecycle is wired. |
| 3.2 Pickup Reminders & Time-Driven Route Status | 🟢 Queued (next) | **Rescoped 2026-04-18** from SSE/WebSocket report-tracker live updates → (a) email pickup reminders via existing `reminder_subscription` table + a ServiceNow scheduled job, and (b) time-driven route stop status (Not Arrived / Current / Passed) computed client-side from `etaFromSchedule()` vs `Date.now()`. No push transport. Original SSE/WS plan retained at the bottom of the milestone as "deferred" in case live report-tracker updates become a separate concern later. |
| 3.3 OAuth 2.0 Admin Login | ✅ Shipped | Public Client + PKCE against ServiceNow registry "SugboClean Frontend" (no client secret, no backend proxy — the `code_verifier` replaces the secret). `AuthContext` rewritten around a `{kind:'bearer'\|'basic'}` session + auto-refresh 60s before expiry. CORS on `/oauth_token.do` unblocked by extending the NowSDK dev-server `proxyPaths` with the OAuth token endpoint; `OAUTH.tokenUrl` is relative. `DEV_USE_BASIC_AUTH` flipped `false` 2026-04-18 (late). |
| 3.4 Bilingual (Ceb + En) | 🔴 Not started | No i18n library installed; all copy hardcoded in English. |
| 3.5 Offline-First PWA | 🔴 Not started | No service worker, no manifest yet. |
| 3.6 Performance Pass | 🔴 Not started | No Lighthouse CI, no code-splitting on admin. |
| 3.7 Analytics Enhancements | 🟡 Partial | Base Recharts dashboard wired (bar / pie / line). Period comparison, drill-down, CSV export, time-to-resolution, hauler perf table, saved presets — not started. |
| 3.8 Production Deployment | 🔴 Not started | Still dev-instance only. No Sentry, no CI/CD, no uptime monitor. |

**Bonus work completed beyond this plan (2026-04-17 / 2026-04-18):**
- Admin visual Route Builder (`RouteBuilder.jsx`) with Set Start / Add Stop / Set End tools, draggable pins, inline `HaulerScheduleManager` for schedules CRUD. Not in the original Phase 3 plan but needed once route stops gained per-stop lat/lng + label (see `PHASE_2_BACKEND_INTEGRATION.md` and vault decisions for 2026-04-17).
- Data model shift: one hauler ↔ one barangay; `route_stop.barangay` is now immutable and inherited from the hauler. Simplified the map UX and retired the `barangay`-PATCH blocker.
- Glide time serialization helpers centralized in `src/utils/helpers.js` (`toGlideTime` / `fromGlideTime` / `formatTime12h`) — write sends `HH:MM:SS`, display renders 12-hour `10:00 PM`.
- All four legacy update endpoints (`updateHauler` / `updateWasteItem` / `updateSchedule` / `updateRouteStop`) migrated `PATCH → PUT` to match the `crud()` factory convention; only `PATCH /reports/{id}/status` remains.
- Orphan cleanup: deleted `admin/ScheduleManager.jsx` + `admin/RouteStopManager.jsx` (superseded), and the `src/mocks/` folder is gone.
- **2026-04-18 — Schedule ↔ Route linkage redesigned.** Stops now belong to a schedule: new `u_schedule` reference + `u_offset_minutes` integer on `x_1986056_sugbocle_route_stop`; `u_estimated_arrival` is no longer written. New `etaFromSchedule(timeWindowStart, offsetMinutes)` helper in `utils/helpers.js` derives each stop's ETA at render time — editing a schedule's start time now updates every stop's displayed ETA without admin upkeep. `RouteBuilder.jsx` reorganized around **schedule selection first** (not hauler); pending/edit forms use an `offset_minutes` number input; an always-visible "Manage Schedules" section lets an admin create the first schedule from an empty state. `getRouteStops({ scheduleId })` filter added. `ScheduleChecker.jsx` joins each stop to its parent schedule via `s.schedule_id → schedule.sys_id` and passes `annotatedStops` to `RouteMap` so the popup reflects the derived ETA. Queued backend cleanup: `GET /schedules` should return `barangay`/`hauler` as `{ value, display_value }` reference objects; until then, `RouteBuilder` has a name-matching fallback.

---

## Part A — What Phase 3 Must Deliver

1. **Interactive Leaflet map** on `/route-map` with numbered stops, dashed route line, clickable pins
2. **Pickup reminders + time-driven route stop status** — email reminders dispatched from a ServiceNow scheduled job against `reminder_subscription`, and route stop markers that auto-advance through Not Arrived → Current → Passed on the client by comparing `etaFromSchedule()` to the current time
3. **OAuth 2.0 admin login** replacing Basic Auth (production-grade security)
4. **Bilingual support** (Cebuano + English) with an `i18n` layer and language toggle
5. **Offline-friendly PWA** — cached schedules, "Add to Home Screen" prompt, service worker
6. **Performance baseline** — Lighthouse score ≥ 90 on mobile for resident pages
7. **Analytics enhancements** — trend comparison, exportable CSV, drill-down from chart to report list
8. **Production deployment checklist** — error monitoring, usage analytics, CI/CD pipeline

---

## Part B — Milestone Breakdown

### Milestone 3.1 — Interactive Route Map (Day 1–3)

**Status:** ✅ **Shipped 2026-04-17.** Deviations: `RouteMap.jsx` landed in `src/client/components/shared/` (used by both resident `ScheduleChecker` and admin `RouteBuilder`), not `src/client/components/resident/`. Markers are colored by `point_type` (Start = green, Stop = blue, End = red) rather than by `u_stop_status`, because the real status lifecycle (Not Arrived / Current / Passed) isn't being driven yet — promote to status-based coloring when Milestone 3.2 lands real-time updates. Route_stop gained its own `u_latitude` / `u_longitude` so pins snap to actual street addresses, not just the barangay centroid.

**Context:** The `x_1986056_sugbocle_route_stop` table holds ordered stops per hauler (`u_stop_order`, `u_estimated_arrival`, `u_stop_status`, plus `u_latitude` / `u_longitude` / `u_label` / `u_point_type` added during Phase 2 §10 sweep). Each stop references a `u_barangay` but barangays store lat/lng on `u_latitude` / `u_longitude` (floating point) for map centering.

- [x] **Extend the Barangay table** (ServiceNow side):
  - [x] Add `u_latitude` (Floating Point) — shipped as Floating Point rather than Decimal(10,6)
  - [x] Add `u_longitude` (Floating Point)
  - [ ] Seed coordinates for all 8 barangays — admin UI (`BarangayManager.jsx`) now sets them on create/edit; no bulk seed script
- [x] **Install Leaflet:** `npm i leaflet react-leaflet` — note: CSS loaded via unpkg CDN in `index.html` to dodge a NowSDK bundler path-mangling bug (see vault `decisions.md` 2026-04-17)
- [x] **Build `<RouteMap />`** under `src/client/components/shared/RouteMap.jsx` *(not `resident/`)*:
  - [x] `<MapContainer>` centered on Cebu City via exported `CEBU_CENTER` constant, zoom 12
  - [x] OpenStreetMap tile layer
  - [x] `<Marker>` per route stop, numbered by `u_stop_order` (Start = "S", End = "E")
  - [x] `<Polyline>` (dashed) connecting stops in order
  - [x] `<Popup>` on click showing label, ETA (12-hour format via `formatTime12h`), status
  - [ ] Color-code by `u_stop_status` (Not Arrived / Current / Passed) — **deferred**, currently colored by `u_point_type` (Start / Stop / End)
- [x] **Responsive sizing:** full-width on mobile, fixed height on desktop (admin uses 560 px, resident uses default)
- [x] **Fallback:** `ScheduleChecker` falls back to `CEBU_CENTER` when the barangay has no coords

**Acceptance:** Pick a barangay on `/schedule` → see numbered pins + dashed polyline → click any pin → popup shows label, ETA, status. ✅ Verified by user 2026-04-17.

---

### Milestone 3.2 — Pickup Reminders & Time-Driven Route Status (Day 3–4)

**Status:** 🟢 **Queued — next up (planned start 2026-04-19).** Rescoped 2026-04-18 from the original "SSE/WebSocket live report-tracker updates" to the two things the LGU actually needs for Phase 3: **(a) email pickup reminders** triggered by a resident subscribing on `/schedule`, and **(b) time-driven route stop status lifecycle** (Not Arrived / Current / Passed) computed client-side from `etaFromSchedule()` against the current clock. No SSE, no WebSocket — the route-map color change is derived at render time from data we already fetch.

**Why the rescope:** SSE/WS on ServiceNow's dev instance is infrastructure-heavy and only buys sub-second latency on one screen (the report tracker), which already meets product needs at 10s polling. Meanwhile the original Phase-2 `reminder_subscription` table has never been wired to actually send an email, and the `u_stop_status` field has no driver so `RouteMap` still colors by `point_type`. This milestone closes both gaps with no new transport layer. The original SSE/WS plan is preserved at the bottom of this section as **Deferred** in case live report-tracker updates come back as a separate concern.

**Outcome:**
1. A resident who enters their email on `/schedule` receives a pickup reminder email before their barangay's next scheduled collection.
2. Route stop markers on both `/schedule` (resident) and `/admin/schedules` (admin) reflect live progress — upstream stops show as **Not Arrived** (grey), the stop whose ETA is currently nearest to `now` shows as **Current** (yellow), stops whose ETA has already passed show as **Passed** (green) — and the UI advances automatically as the clock crosses each stop's ETA.

---

**Part A — Email pickup reminders (ServiceNow side + frontend wiring)**

- [ ] **Confirm `reminder_subscription` table is write-ready** — Phase 2 seeded it with `u_email`, `u_barangay`, `u_active`; verify no missing columns for an unsubscribe token.
- [ ] **Add `u_unsubscribe_token` (String, 32)** to `reminder_subscription` — server-generated on insert via a Business Rule, stored once, used to build the unsubscribe link.
- [ ] **Build the Scheduled Job** on ServiceNow — `SugboClean: Send pickup reminders`:
  - Runs every 15 minutes
  - For each `schedule` where `u_day_of_week` == today and `u_time_window_start` is within the next 60 min (configurable)
  - Join to active `reminder_subscription` rows on `u_barangay`
  - Send email via `gs.eventQueue('x_1986056_sugbocle.pickup_reminder', ...)` → Notification template fires
  - Dedupe: don't re-send for the same `(subscription, schedule, pickup_date)` tuple within 24h (new `u_last_sent_at` column on subscription or a tiny audit table — decide during implementation)
- [ ] **Email template** (`sys_email` / Notification):
  - Subject: `Pickup reminder — {barangay} at {time_window_start} today`
  - Body: schedule details + unsubscribe link `${instance}/api/1986056/sugboclean_api/reminders/unsubscribe?token={u_unsubscribe_token}`
  - Cebuano body follows Milestone 3.4 i18n — ship English first, add Cebuano when 3.4 lands
- [ ] **New endpoint** `GET /reminders/unsubscribe?token=…` (scripted REST, public, no auth):
  - Looks up the token, flips `u_active` to `false`, renders a minimal confirmation HTML page
  - Returns 404 on unknown token (don't leak whether the token ever existed)
- [ ] **Frontend: confirm `ScheduleChecker.jsx` subscribe form** already POSTs to `createReminder()` in `src/services/api.js`. Audit: show a success toast + disable the form for 30s on 200; surface the error on 4xx/5xx.

**Part B — Time-driven route stop status (pure frontend)**

- [ ] **New helper** `computeStopStatus(stop, schedule, now)` in `src/utils/helpers.js`:
  - Computes each stop's absolute ETA via `etaFromSchedule(schedule.u_time_window_start, stop.u_offset_minutes)` + today's date (with midnight-wrap handling reused from `etaFromSchedule`)
  - Returns `'Not Arrived' | 'Current' | 'Passed'`: `Current` = the stop whose ETA is the latest one still ≤ `now`; stops with ETA > `now` → `Not Arrived`; stops with ETA < `now` that aren't `Current` → `Passed`
  - Pure function; no side-effects, no network
- [ ] **`RouteMap.jsx` `statusMode` prop** — `'point_type' | 'live'`. Default stays `'point_type'` for backward compatibility; admin's `/admin/schedules` and resident `/schedule` pass `'live'`. Color palette:
  - Not Arrived → grey (`#9CA3AF`)
  - Current → yellow (`#F59E0B`), gentle pulse CSS animation
  - Passed → green (`#16A34A`)
  - Falls back to `point_type` colors when `statusMode='live'` but `schedule` / `offset_minutes` missing
- [ ] **1-minute ticker** on map-hosting pages (`ScheduleChecker.jsx`, admin `RouteBuilder.jsx`) — `useEffect` + `setInterval(() => setNow(new Date()), 60_000)`, cleared on unmount. No refetch, just a re-render so `computeStopStatus(..., now)` re-runs.
- [ ] **Popup copy** — swap the existing "status" line in the `RouteMap` popup to render the computed status when `statusMode='live'` (instead of `u_stop_status` from the record, which isn't driven yet).

**Acceptance:**
1. Subscribe on `/schedule` with a real email for a barangay whose next pickup is in ≤ 60 min. Within the next scheduled-job fire (≤ 15 min), an email lands in the inbox with correct schedule + a working unsubscribe link.
2. Click unsubscribe → subscription `u_active` flips to `false` → no further emails for that `(email, barangay)` pair.
3. Open `/admin/schedules`, select a schedule whose time window spans `now`. The stop whose ETA is nearest-but-not-past shows yellow; upstream stops grey; downstream (already passed) stops green. Advance the system clock past the next stop's ETA — without refreshing, within 60s the yellow marker advances to the next stop and the previous yellow turns green.

---

**Deferred (original 3.2 plan — SSE/WS live report tracker, not in scope for this rescope):**

Kept here for future reference. Do not start without an explicit scope-reopen.

- Validate SSE vs WebSocket feasibility on `dev375738`
- Business Rule trigger on `after update` of `x_1986056_sugbocle_report` where `u_status` changed → push to SSE stream keyed by `u_report_code`
- Rewrite `ReportTracker.jsx` around `EventSource` with auto-reconnect + polling fallback
- Remove the current 10-second polling loop

Original acceptance: admin flips a status → resident tracker updates in under 2 seconds, no refresh.

---

### Milestone 3.3 — OAuth 2.0 Admin Login (Day 5–6)

**Status:** ✅ **Shipped 2026-04-18 (late).** Authorization Code + PKCE flow against ServiceNow registry entry "SugboClean Frontend". **Deviation from original plan:** no backend token-exchange proxy — instead the frontend is a **Public Client + PKCE**, so `code_verifier` replaces the client secret and the whole flow is pure SPA. See vault `decisions.md` 2026-04-18 "OAuth 2.0 Authorization Code + PKCE chosen over backend token-exchange proxy" for the rationale. **Second deviation:** the `VITE_DEV_USE_BASIC_AUTH` env-var was implemented as a `DEV_USE_BASIC_AUTH` constant in `src/utils/constants.js` (NowSDK doesn't use Vite), flipped `false` 2026-04-18 once OAuth was verified.

**Outcome:** Admin login uses ServiceNow OAuth — no more Basic Auth, no passwords in memory. ✅

- [x] **ServiceNow side** (configured by user):
  - OAuth Application Registry entry "SugboClean Frontend", `client_id: bdd141a3648c4f8cb8497350b05b8efa`
  - Grant type: **Authorization Code**
  - `public_client: true` — no secret held anywhere (PKCE replaces it)
  - Redirect URI: `http://localhost:3000/` (site root so the dev server doesn't need SPA history fallback on a dedicated callback path; `main.jsx` hoists `?code&state` into the hash route)
  - ⚠️ **Still queued:** flip `oauth_entity.use_pkce` from `'false'` → `'true'` on the instance UI. Flow works without it but closes a gap across ServiceNow versions. `src/fluent/generated/` is machine-generated per `CLAUDE.md §2` so it's an instance-side change, not a repo edit.
- [x] **Frontend flow** (implemented in `src/services/oauth.js` + `src/pages/admin/OAuthCallback.jsx`):
  1. User clicks "Log in with ServiceNow" on `/admin/login` — `beginOAuthLogin(returnTo)` generates `code_verifier` (32 random bytes → base64url), derives `code_challenge` via SHA-256, mints a random `state`, persists all three in `sessionStorage`.
  2. Redirect to `${instance}/oauth_auth.do?response_type=code&client_id=…&redirect_uri=…&state=…&code_challenge=…&code_challenge_method=S256`
  3. User authenticates on ServiceNow, redirects back to `http://localhost:3000/?code=…&state=…`
  4. `src/client/main.jsx` intercepts the `?code&state` on **any path** pre-mount and hoists them into the hash route `/#/admin/oauth/callback` so the flow works regardless of which path the static dev server serves `index.html` from.
  5. `OAuthCallback.jsx` calls `completeOAuthLogin({code, state})` → POSTs `grant_type=authorization_code&code=…&client_id=…&redirect_uri=…&code_verifier=…` to `/oauth_token.do` (relative; proxied through the NowSDK dev server — see CORS note below) → stores the bearer + refresh token in memory.
- [x] **Rewrote `AuthContext.jsx`:**
  - Session shape is `{ kind: 'bearer' | 'basic', ... }`; `getAuthHeader()` is synchronous for `api.js`.
  - Bearer tokens auto-refresh via `setTimeout` 60s before `expiresAt` (`OAUTH.refreshMarginMs`). Proactive refresh, not reactive-on-401.
  - `loginBasic()` kept as dev fallback gated on `DEV_USE_BASIC_AUTH`; now throws `"Basic Auth is disabled in this build."` since the flag is `false`. Removal queued one release out.
  - Legacy `sc_auth_header` sessionStorage key read once for one-release compat, never written.
- [ ] **Lint rule:** banned-import regex for `btoa(` in `src/context/` and `src/services/` — ⚠️ still pending. `AuthContext.loginBasic` uses `btoa` for the dev fallback; lint rule should land alongside `loginBasic()` removal.
- [x] **Migration:** `DEV_USE_BASIC_AUTH` flag in `src/utils/constants.js` (renamed from the planned `VITE_DEV_USE_BASIC_AUTH` — NowSDK ≠ Vite). Flipped `true → false` 2026-04-18 once OAuth was verified.

**CORS on `/oauth_token.do` (shipped fix):**
- Initial attempt failed: `POST /oauth_token.do` from `http://localhost:3000` blocked with "No 'Access-Control-Allow-Origin' header". The `sys_cors_rule` records committed in `bfe3d66` don't help — `sys_cors_rule` is scoped to a specific REST API record (`rest_api: 090c5ee…`) and `/oauth_token.do` lives outside the REST API framework.
- Fix landed as a two-line change against NowSDK's **built-in** dev server (not a custom sidecar):
  - `now.dev.mjs` now passes an explicit `proxyPaths` to `servicenowFrontEndPlugins()` that lists the 7 NowSDK defaults + `/oauth_token.do`.
  - `src/utils/constants.js` `OAUTH.tokenUrl` changed from `'https://dev375738.service-now.com/oauth_token.do'` → `'/oauth_token.do'` so `fetch()` is same-origin to the dev server; `authorizeUrl` stays absolute (full-page nav, CORS doesn't apply).
- Basic Auth injection risk (NowSDK dev-proxy rewrites `Authorization` on every proxied request with the admin credential from `now-sdk auth`) turned out to be a non-issue: ServiceNow ignores the injected header for `public_client: 'true'` and validates via PKCE `code_verifier` only.
- See vault `decisions.md` 2026-04-18 "CORS unblock: extend NowSDK `proxyPaths` rather than deploy-to-instance or sidecar" for alternatives considered.

**Security deliverables:**
- [x] No client secret in the frontend bundle — none exists at all (Public Client + PKCE)
- [x] Tokens never logged — `AuthContext` stores in memory + `sessionStorage`; no console paths
- [x] CSRF nonce in `state` parameter, verified on callback — 16 random bytes, checked before token exchange
- [x] Access token expiry respected — proactive refresh 60s before `expiresAt` via `setTimeout`, not reactive-on-401

**Acceptance:** Admin clicks login → redirected to ServiceNow → logs in → redirected back authed; F5 still authed; close tab → logged out; 401 mid-session → silent refresh, no re-login prompt. ✅ Verified by user 2026-04-18 (late).

---

### Milestone 3.4 — Bilingual Support (Cebuano + English) (Day 6–7)

**Status:** 🔴 **Not started.** No `react-i18next` / `i18next` dependency, no `src/i18n/` folder, every string is still hardcoded English in JSX. Language toggle is absent from the navbar / sidebar.

**Outcome:** Every user-facing string renders in Cebuano or English based on user preference. Residents default to Cebuano; admin defaults to English.

- [ ] **Install:** `npm i react-i18next i18next`
- [ ] Create `src/i18n/` with:
  - `en.json` — every English string, grouped by page
  - `ceb.json` — Cebuano translations (work with a native speaker on the team; do not machine-translate LGU-facing copy)
- [ ] Initialize i18next in `app.jsx`, default language detection: navigator → localStorage → fallback Cebuano
- [ ] Replace **every hardcoded string** in components with `t('key')` calls. Audit checklist:
  - All page titles
  - All button labels
  - All form field labels + placeholders
  - All status pill labels (Pending / In Progress / Resolved → Hulaton / Ginatrabaho / Nahuman)
  - All bin type labels (Biodegradable / Recyclable / etc.)
  - All error messages, toasts, empty states
  - Day-of-week names
- [ ] Add a language toggle in the `<Navbar>` (🇵🇭 Ceb / 🇬🇧 Eng)
- [ ] Store chosen language in `localStorage` under `sugboclean.lang`
- [ ] **Do NOT translate:** `SC-YYYY-NNNN` codes, barangay names (proper nouns), hauler names, technical identifiers

**Acceptance:** Toggle language → every string on screen flips; reload → preference persists; no English fragment leaks into the Cebuano UI (grep the bundle).

---

### Milestone 3.5 — Offline-First PWA (Day 8–9)

**Status:** 🔴 **Not started.** No `vite-plugin-pwa` (or NowSDK equivalent), no `manifest.json`, no service worker registered, no IndexedDB queueing for offline reports, no offline banner.

**Outcome:** A resident with a spotty connection can still open the app, see their last-checked schedule, and queue a missed-pickup report for later sync.

- [ ] **Enable PWA:** use `vite-plugin-pwa` (or the NowSDK-appropriate equivalent)
- [ ] **Manifest:**
  - App name "SugboClean"
  - Icons at 192px / 512px (use a waste-can + map-pin mark)
  - `theme_color: #16A34A`, `display: standalone`, `start_url: /`
- [ ] **Service worker caching strategy:**
  - **Static assets** — cache-first, 30-day TTL
  - **`GET /barangays`, `GET /haulers`, `GET /waste-items`** — stale-while-revalidate, 7-day TTL (rarely change)
  - **`GET /schedules`** — stale-while-revalidate, 24-hour TTL
  - **`GET /reports/{code}`** — network-only (never cache individual report status — it's the live truth)
  - **POST / PATCH / PUT / DELETE** — network-only, no offline queueing except the missed-pickup report (see below)
- [ ] **Offline report queueing:**
  - Missed-pickup submissions while offline → store payload in IndexedDB
  - On reconnect, replay via Background Sync API → once server confirms, show a toast "Your queued report was submitted: SC-2026-XXXX"
- [ ] **"You're offline" banner** — dismissable, non-blocking
- [ ] **Add-to-home-screen prompt** after 2 visits (browser will respect iOS/Android heuristics)

**Acceptance:**
1. Load the app once online
2. Toggle DevTools "Offline"
3. Reload → app still opens, Schedule page still shows the last viewed barangay's schedule
4. Submit a missed-pickup report → "Queued, will send when back online"
5. Toggle online → within 10s, queued report is sent, success toast appears

---

### Milestone 3.6 — Performance Pass (Day 10)

**Status:** 🔴 **Not started.** No `React.lazy` / `<Suspense>` on admin routes, no bundle audit run, no Lighthouse CI gate, no `preconnect` hint to the ServiceNow instance.

**Outcome:** Lighthouse Mobile ≥ 90 on Performance + Accessibility + Best Practices for every resident page.

- [ ] **Code splitting:** `React.lazy` + `<Suspense>` on all admin pages (residents never load admin bundle)
- [ ] **Bundle audit:** `npx vite-bundle-visualizer` — anything > 50kb gzipped must justify itself
- [ ] **Image optimization:**
  - Convert icons to SVG where possible
  - Lazy-load report photos in admin (native `loading="lazy"`)
- [ ] **Font loading:** `font-display: swap`, preload the primary font
- [ ] **Lighthouse CI** in the GitHub Actions pipeline — fail the PR if Mobile Performance drops below 85
- [ ] **Preconnect** to `dev375738.service-now.com` from the HTML head

**Acceptance:** Run Lighthouse on `/`, `/schedule`, `/report`, `/track`, `/waste-guide` — all score ≥ 90 Mobile.

---

### Milestone 3.7 — Analytics Enhancements (Day 11)

**Status:** 🟡 **Partial.** The base Recharts dashboard shipped in Phase 2 (bar / pie / line covering report volume, waste types, status distribution). None of the Phase-3 enhancements below are implemented yet.

**Outcome:** The admin analytics page is genuinely useful for LGU decision-making, not just pretty charts.

- [ ] **Period comparison:** "This month vs. last month" deltas on top-level metrics (total reports, resolution rate, avg time-to-resolve)
- [ ] **Drill-down:** click a bar in the barangay chart → see the filtered reports table for that barangay
- [ ] **CSV export:** "Download current view as CSV" button — uses the currently-applied filter
- [ ] **Time-to-resolution metric:** for resolved reports, `sys_updated_on - sys_created_on`, show median + p90
- [ ] **Hauler performance table:** reports resolved per hauler (join Schedule → Hauler), response time per hauler
- [ ] **Saved filter presets:** "This month", "This quarter", "YTD" — one click

**Acceptance:** LGU admin opens analytics → sees this-month-vs-last delta → drills into the worst barangay → exports CSV → has everything they need for a weekly status meeting without asking IT.

---

### Milestone 3.8 — Production Deployment & Monitoring (Day 12)

**Status:** 🔴 **Not started.** Still dev-instance only (`dev375738.service-now.com`). No hosting decision recorded, no CI/CD pipeline, no Sentry, no analytics vendor, no uptime check.

**Outcome:** The app ships to a real URL with error tracking, usage analytics, and a repeatable deploy pipeline.

- [ ] **Hosting decision** — options:
  - Hosted directly on ServiceNow as a UX Experience (least infra, max coupling)
  - Separately on Vercel / Netlify / Cloudflare Pages (more flexibility, CORS on the API to manage)
- [ ] **CI/CD pipeline** (GitHub Actions):
  - On push to `main` → lint → typecheck → test → build → deploy
  - On PR → lint + Lighthouse CI smoke
- [ ] **Error monitoring:** Sentry (free tier) — capture unhandled promise rejections, React error boundaries
- [ ] **Usage analytics:** Plausible or self-hosted Umami (no cookies, GDPR-friendly) — track page views + key events (report submitted, status tracked, language switched)
- [ ] **Uptime check:** simple cron-based ping on the production URL, notify the team lead on Slack on failure
- [ ] **Production environment variables:** separate `.env.production` values; no dev credentials in prod bundle
- [ ] **Rollback plan:** tagged releases, documented `npm run deploy:rollback` procedure

**Acceptance:** Merge to `main` → 5 minutes later → prod URL reflects the change → Sentry captures a real error → uptime monitor sends a test alert successfully.

---

## Part C — Definition of Done

Phase 3 is done when all of these hold (status as of 2026-04-18):

1. 🟡 Route map renders hauler routes with correct stop order — **stop order ✅, "live stop status" coloring ❌ (currently colored by `point_type`)**
2. 🔴 Pickup reminder emails dispatch from the ServiceNow scheduled job for active subscriptions **and** route stop markers auto-advance Not Arrived → Current → Passed on both resident `/schedule` and admin `/admin/schedules` based on computed ETA vs `now` — **rescoped 2026-04-18 (was: SSE/WS live report-tracker updates, now deferred)**
3. ✅ Admin login flow uses OAuth — **PKCE shipped and verified 2026-04-18; `DEV_USE_BASIC_AUTH=false`. `btoa(` still reachable via the deprecated `loginBasic()` code path in `AuthContext`; scheduled for removal one release out along with the lint rule.**
4. 🔴 Every user-facing string has a Cebuano translation; language toggle persists
5. 🔴 Service worker registered; `chrome://inspect → Application → Service Workers` shows it active
6. 🔴 Offline reload of the app still boots; queued reports send on reconnect
7. 🔴 Lighthouse Mobile ≥ 90 on all 7 resident pages
8. 🔴 Analytics drilldown + CSV export works end-to-end
9. 🔴 Production URL serves the app over HTTPS — **still dev-instance only**
10. 🔴 A new error on prod fires a Sentry alert within 30 seconds

---

## Part D — What Phase 3 Does **NOT** Include

- ❌ Resident accounts / login — intentional product choice per CLAUDE.md §9
- ❌ Two-way messaging between residents and LGU — out of scope
- ❌ Real-time GPS on garbage trucks — the map shows planned routes only
- ❌ Payment integration — SugboClean is not a billing app
- ❌ Mobile native apps (iOS/Android) — the PWA covers the need

---

## Part E — Risks & Watch-outs

| Risk                                                   | Mitigation                                                                          |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| ServiceNow dev instance can't host SSE/WS long connections | Validate **before** Milestone 3.2 starts; fall back to 5s polling if needed          |
| OAuth client secret leaks                              | Never put secret in frontend bundle; use a tiny serverless function as the token proxy |
| Cebuano translation quality is off                     | Review with a native speaker on the team before launch; don't ship machine-translated copy |
| Service worker caches a bad build                      | Ship a kill-switch endpoint that bumps the SW version and forces re-register        |
| Offline queued reports get duplicated on reconnect     | Client-generated idempotency key (`client_request_id`); server dedupes before insert |
| Lat/lng data missing for new barangays                 | Graceful fallback: render in list, skip on map; add validation in the Barangay CRUD form |
| Lighthouse regressions from future PRs                 | Lighthouse CI gate in GitHub Actions blocks the merge                                |

---

## Part F — Post-Launch Phase 4 (Backlog, Not Committed)

Ideas to consider after the pilot stabilizes:

- **SMS notifications** for residents without email (Philippines has very high SMS usage)
- **Barangay captain dashboard** — scoped view of just their barangay's reports
- **AI waste-sorting assistant** — take a photo of trash, get a bin recommendation
- **Hauler driver mobile view** — tick off stops as completed, updating `u_stop_status`
- **Heatmap overlay** on the map — density of missed-pickup reports
- **Public accountability page** — anonymized weekly resolution stats
- **Integration with weather API** — warn residents of schedule changes during typhoons

None of these are needed for the pilot launch. Gather real usage data from Phase 3 deployment before prioritizing.

---

_End of Phase 3 Advanced Features Plan_
