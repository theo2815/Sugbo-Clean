# Phase 3 — Advanced Features & Hardening

> **Goal of Phase 3:** Take the functional SugboClean pilot from Phase 2 and turn it into something the LGU would be proud to launch publicly — a real interactive map, genuine real-time status updates, secure auth, offline resilience, and Cebuano-first language support.

**Prerequisite:** Phase 2 is complete and the DoD in `PHASE_2_BACKEND_INTEGRATION.md` §E is met. Specifically:

- All 22 endpoints work end-to-end
- Admin login uses real Basic Auth
- Reports, photos, status changes, CRUD, reminders all persist in ServiceNow

If any Phase 2 item is still flaky, fix it first — Phase 3 assumes a stable foundation.

---

## Part A — What Phase 3 Must Deliver

1. **Interactive Leaflet map** on `/route-map` with numbered stops, dashed route line, clickable pins
2. **Real-time status updates** via Server-Sent Events or WebSocket (replace Phase-2 polling)
3. **OAuth 2.0 admin login** replacing Basic Auth (production-grade security)
4. **Bilingual support** (Cebuano + English) with an `i18n` layer and language toggle
5. **Offline-friendly PWA** — cached schedules, "Add to Home Screen" prompt, service worker
6. **Performance baseline** — Lighthouse score ≥ 90 on mobile for resident pages
7. **Analytics enhancements** — trend comparison, exportable CSV, drill-down from chart to report list
8. **Production deployment checklist** — error monitoring, usage analytics, CI/CD pipeline

---

## Part B — Milestone Breakdown

### Milestone 3.1 — Interactive Route Map (Day 1–3)

**Outcome:** `/route-map` replaces the Phase-1 placeholder with a real Leaflet map that visualizes a hauler's full collection route across Cebu City barangays.

**Context:** The `x_1986056_sugbocle_route_stop` table holds ordered stops per hauler (`u_stop_order`, `u_estimated_arrival`, `u_stop_status`). Each stop references a `u_barangay` but barangays don't currently store lat/lng.

- [ ] **Extend the Barangay table** (ServiceNow side):
  - Add `u_latitude` (Decimal, 10,6)
  - Add `u_longitude` (Decimal, 10,6)
  - Seed coordinates for all 8 barangays in CLAUDE.md §8 (Lahug ≈ `10.340, 123.900`, etc.)
- [ ] **Install Leaflet:** `npm i leaflet react-leaflet`
- [ ] **Build `<RouteMap />`** under `src/client/components/resident/RouteMap.jsx`:
  - `<MapContainer>` centered on Cebu City (`10.3157, 123.8854`), zoom 12
  - OpenStreetMap tile layer (free, no API key required)
  - `<Marker>` per route stop, numbered label based on `u_stop_order`
  - `<Polyline>` (dashed) connecting stops in order
  - `<Popup>` on click showing barangay name, ETA, stop status pill
  - Color-code markers by `u_stop_status`: grey = Not Arrived, green = Current, dark = Passed
- [ ] **Responsive sizing:** full-width on mobile, fixed height 500px on desktop
- [ ] **Fallback:** if a route stop's barangay has no lat/lng, show it in the list below the map but not on the map (don't crash)

**Acceptance:** Pick "Cebu Green Haulers" → see 4 numbered pins across North District barangays connected by a dashed line → click any pin → popup shows ETA and status.

---

### Milestone 3.2 — Real-Time Status Updates (Day 3–4)

**Outcome:** Resident tracker reflects status changes **instantly** (sub-second), not after a 10-second poll.

Two viable transports — pick one based on ServiceNow capability testing:

**Option A — Server-Sent Events (SSE) via a Scripted REST Endpoint**
- Easier on ServiceNow (no socket infrastructure), one-way server → client
- Frontend: `const es = new EventSource('/api/.../reports/{code}/stream')`
- Backend: a Scripted REST endpoint that keeps the connection open and pushes a JSON event whenever the underlying report's `u_status` changes (use a Business Rule trigger + a queue table)

**Option B — WebSocket via ServiceNow's Notify / MID Server**
- Bi-directional, lower overhead per message
- More infrastructure setup on the ServiceNow side

- [ ] **Validate with the ServiceNow admin** which option is feasible on the `dev375738` instance
- [ ] **Build the server-side event trigger:**
  - On `after update` of `x_1986056_sugbocle_report` where `u_status` changed → push to SSE stream keyed by `u_report_code`
- [ ] **Frontend:** rewrite `ReportTracker.jsx` to:
  - On mount, open the SSE/WS connection for the given report code
  - On message, update local status state
  - Show a subtle "Live ●" indicator when connected, grey dot when disconnected
  - Auto-reconnect with exponential backoff (1s, 2s, 4s, max 30s) on drop
  - Fallback to 30s polling if SSE/WS fails entirely
- [ ] **Remove the Phase-2 10-second polling loop** — real-time replaces it

**Acceptance:** Admin flips a status → resident tracker updates in under 2 seconds, no refresh.

---

### Milestone 3.3 — OAuth 2.0 Admin Login (Day 5–6)

**Outcome:** Admin login uses ServiceNow OAuth — no more Basic Auth, no passwords in memory.

- [ ] **ServiceNow side** (ask the instance admin to configure):
  - Register an OAuth Application Registry entry for SugboClean
  - Grant type: **Authorization Code** (not Password — that's just Basic Auth with extra steps)
  - Redirect URI: production domain + `http://localhost:<port>/admin/oauth/callback`
  - Capture `client_id` (the `client_secret` stays on a backend proxy, not the frontend)
- [ ] **Frontend flow:**
  1. User clicks "Log in with ServiceNow" on `/admin/login`
  2. Redirect to `${instance}/oauth_auth.do?response_type=code&client_id=...&redirect_uri=...&state=<nonce>`
  3. User authenticates on ServiceNow, redirects back to `/admin/oauth/callback?code=...`
  4. Callback exchanges `code` for a token (via a small backend proxy endpoint, to keep the secret server-side)
  5. Store token in memory + `sessionStorage`, refresh via refresh-token flow
- [ ] **Rewrite `AuthContext`:**
  - Replace `Basic ${btoa(...)}` with `Bearer ${token}`
  - Add `refreshToken()` logic, triggered when a 401 comes back
- [ ] **Lint rule:** banned-import regex for `btoa(` in `src/context/` and `src/services/`
- [ ] **Migration:** Basic Auth path stays as a local-dev fallback behind `VITE_DEV_USE_BASIC_AUTH=true`; production bundles reject it

**Security deliverables:**
- No client secret in the frontend bundle
- Tokens never logged
- CSRF nonce in `state` parameter, verified on callback
- Access token expiry respected (refresh before expiry, not reactive on 401)

**Acceptance:** Admin clicks login → redirected to ServiceNow → logs in → redirected back authed; F5 still authed; close tab → logged out; 401 mid-session → silent refresh, no re-login prompt.

---

### Milestone 3.4 — Bilingual Support (Cebuano + English) (Day 6–7)

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

Phase 3 is done when all of these hold:

1. Route map renders all 4 hauler routes with correct stop order and live stop status
2. Admin changes a report status → resident tracker visibly updates in ≤ 2 seconds, no refresh
3. Admin login flow uses OAuth (no `btoa(`) in the production bundle)
4. Every user-facing string has a Cebuano translation; language toggle persists
5. Service worker registered; `chrome://inspect → Application → Service Workers` shows it active
6. Offline reload of the app still boots; queued reports send on reconnect
7. Lighthouse Mobile ≥ 90 on all 7 resident pages
8. Analytics drilldown + CSV export works end-to-end
9. Production URL serves the app over HTTPS
10. A new error on prod fires a Sentry alert within 30 seconds

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
