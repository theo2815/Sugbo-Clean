# Phase 1 — Design & UI (Revised after Codebase Audit)

> **Goal:** Finish the complete visual shell of SugboClean using **mock data only**. No real ServiceNow API calls. When Phase 1 ships, every page renders, navigates, and feels finished — powered by hardcoded fixtures behind a stubbed API layer. We wire the real backend in Phase 2.

**Audit date:** 2026-04-15. This plan reflects what's already in `src/` and what's missing or broken.

---

## Part A — Current State Audit

### ✅ Already built (keep, polish only)

| Component                            | Location                                      | Notes                                                       |
| ------------------------------------ | --------------------------------------------- | ----------------------------------------------------------- |
| SugboLanding                         | `src/client/components/SugboLanding.jsx`      | 2-card portal picker (Resident / Admin)                     |
| ResidentHub                          | `src/client/components/ResidentHub.jsx`       | 5-card resident menu                                        |
| Navbar                               | `src/client/components/Navbar.jsx`            | Has "switch portal" toggle, no router links yet             |
| Footer                               | `src/client/components/Footer.jsx`            |                                                             |
| ScheduleChecker                      | `src/client/components/ScheduleChecker.jsx`   |                                                             |
| MissedPickupForm                     | `src/client/components/MissedPickupForm.jsx`  |                                                             |
| WasteSortingGuide                    | `src/client/components/WasteSortingGuide.jsx` |                                                             |
| HaulerMap                            | `src/client/components/HaulerMap.jsx`         | Placeholder map — real Leaflet is Phase 3                   |
| ReportTracker + StatusStepper        | `src/client/components/tracker/`              | Has nice live pub/sub via `reportStore.js` — keep this      |
| MetricsGrid + MetricCard + FilterBar | `src/client/components/admin/`                |                                                             |
| ReportsTable                         | `src/client/components/admin/ReportsTable.jsx`| Shape mismatch — see "Issues to fix" below                  |
| Sidebar + TopBar + AdminContainer    | `src/client/components/layout/`               | Admin shell                                                 |
| StatusPill                           | `src/client/components/shared/StatusPill.jsx` |                                                             |
| reportStore + reports + status       | `src/data/`                                   | Pub/sub store + seed data + status constants                |

### 🔴 Broken / leftover template code (must fix or remove)

1. ~~**`src/client/app.jsx`** still renders `IncidentList` / `IncidentForm` — the SugboLanding is never shown. This is leftover NowSDK starter code.~~ ✅ **Resolved M1.1** — `app.jsx` rewritten with `<BrowserRouter>`; `HomePage` renders `SugboLanding` at `/`.
2. ~~**`src/client/components/ResidentDashboard.jsx`** uses `<ResidentHub>` without importing it and references an undefined `<StatusTracker>` → runtime crash the moment you click a resident tab.~~ ✅ **Resolved M1.1** — `ResidentHub` imported, tracker tab now routes to `/track` via `useNavigate`. Component still exists for legacy fallback; may be removed in M1.4.
3. ~~**`src/client/services/IncidentService.js`** hits the generic `/api/now/table/incident` endpoint — wrong table, wrong API. Delete or replace.~~ ✅ **Resolved M1.1** — deleted. Real stub layer lands in M1.3 at `src/services/api.js`.
4. ~~**`src/client/components/IncidentForm.jsx`, `IncidentList.jsx`** (+ their `.css`) — template leftovers. Delete.~~ ✅ **Resolved M1.1** — all four files deleted.
5. ~~**No React Router** — navigation is ad-hoc `activeTab` state / `onNavigate` callbacks. Pages can't be bookmarked or deep-linked.~~ ✅ **Resolved M1.1** — `react-router-dom` installed, 11 routes wired in `app.jsx`.
6. **Inline styles everywhere** — no design tokens, hard to keep consistent. Needs Tailwind OR a single shared theme file. *(Targeted by M1.2.)*
7. **`admin/ReportsTable.jsx` data shape mismatch** — expects `report.id`, `report.date`, `report.status`. The real API returns `report_code`, `missed_date`, `status`. The mock in `src/data/reports.js` uses yet another shape (`id`, `date`, `status`, `wasteType`, `hasPhoto`). Pick one and align all three. *(Targeted by M1.3/M1.5.)*
8. **No `src/services/api.js` stub layer** — the abstraction CLAUDE.md §6 depends on doesn't exist yet. Without it, Phase 2 swap-in will touch every page. *(Targeted by M1.3.)*
9. ~~**`src/pages/` folder exists but is empty** — if we introduce React Router, put page-level components there.~~ ✅ **Resolved M1.1** — 11 placeholder page files scaffolded under `src/pages/` and `src/pages/admin/`.

### ⚪ Missing entirely (must build this phase)

| Missing piece                   | Where it belongs                                |
| ------------------------------- | ----------------------------------------------- |
| AdminLoginPage                  | `src/pages/admin/LoginPage.jsx`                 |
| AdminDashboardPage wrapper      | `src/pages/admin/AdminDashboardPage.jsx`        |
| ScheduleManager (CRUD)          | `src/client/components/admin/ScheduleManager.jsx` |
| HaulerManager (CRUD)            | `src/client/components/admin/HaulerManager.jsx`   |
| RouteStopManager (CRUD)         | `src/client/components/admin/RouteStopManager.jsx`|
| WasteItemManager (CRUD)         | `src/client/components/admin/WasteItemManager.jsx`|
| AdminAnalyticsPage (3 charts)   | `src/pages/admin/AdminAnalyticsPage.jsx`        |
| HaulerDirectory page            | `src/pages/HaulerPage.jsx`                      |
| RouteMapPage with stop list     | `src/pages/RouteMapPage.jsx`                    |
| ReminderSignup form             | `src/client/components/resident/ReminderSignup.jsx` |
| Central mock data file          | `src/mocks/mockData.js`                         |
| Stubbed API layer               | `src/services/api.js`                           |
| AuthContext (fake admin auth)   | `src/context/AuthContext.jsx`                   |
| Design tokens / theme           | `src/utils/constants.js`                        |

---

## Part B — Phase 1 Deliverables

By the end of Phase 1:

1. All 10 pages from CLAUDE.md §6 render with mock data
2. React Router drives navigation (every page has a URL)
3. Leftover IncidentList / IncidentForm / IncidentService are gone
4. All components share a single design token file (colors, spacing, status/bin palettes)
5. Every page reads data through `src/services/api.js` — which in Phase 1 returns `Promise.resolve(mockData)`
6. Admin side has a fake login (hardcoded credentials) gated by `AuthContext`
7. Responsive layouts work at 375 / 768 / 1440 widths

---

## Part C — Milestone Breakdown

### Milestone 1.1 — Cleanup & Skeleton (Day 1) ✅ **DONE (2026-04-15)**

**Outcome:** Dead template code is gone, React Router is wired, SugboLanding actually renders.

- [x] Install: `npm i react-router-dom lucide-react`
- [x] Delete `IncidentList.jsx`, `IncidentList.css`, `IncidentForm.jsx`, `IncidentForm.css`, `services/IncidentService.js`
- [x] Rewrite `src/client/app.jsx` to use `<BrowserRouter>` and render `<SugboLanding>` at `/`
- [x] Fix `ResidentDashboard.jsx`: import `ResidentHub`, delete the broken `<StatusTracker />` reference (route to the tracker page instead)
- [x] Create empty placeholder page files under `src/pages/` (one per route) so every route resolves

**Acceptance:** App boots, `/` shows SugboLanding, clicking "Resident Services" or "LGU Admin Portal" routes correctly.

**Notes from completion:**
- `src/client/app.jsx` now wraps a `Shell` component in `<BrowserRouter>`; `Navbar` portal-toggle is wired to `useNavigate` (`/resident` ↔ `/admin/login`) using `useLocation` to detect admin routes
- Added `src/pages/ResidentHubPage.jsx` to bridge `ResidentHub`'s `onNavigate(id)` callback to router `navigate()` — the existing hub component is kept as-is
- Placeholder pages created: `HomePage`, `ResidentHubPage`, `SchedulePage`, `ReportPage`, `TrackPage`, `WasteGuidePage`, `HaulerPage`, `RouteMapPage`, `admin/LoginPage`, `admin/AdminDashboardPage`, `admin/AdminAnalyticsPage`
- Catch-all route (`*`) falls back to `HomePage`
- Legacy `ResidentDashboard.jsx` is kept (not deleted) but now routes the tracker tab to `/track` via `useNavigate` — can be removed in M1.4 once all navigation is router-driven
- ESLint run skipped: pre-existing config error with `@servicenow/sdk-app-plugin/recommended` (unrelated to this milestone)
- Visual smoke test via `npm run dev` pending user confirmation

---

### Milestone 1.2 — Design Tokens & Shared Primitives (Day 2) ✅ **DONE (2026-04-15)**

**Outcome:** Stop using inline styles ad-hoc. One source of truth for colors and spacing.

- [x] Create `src/utils/constants.js` exporting:
  - `COLORS.primary`, `COLORS.secondary`, `COLORS.status.{pending,inProgress,resolved}`, `COLORS.bin.{bio,recycle,residual,hazardous}` (values from CLAUDE.md §7)
  - `STATUS_LABELS`, `BIN_TYPES`, `WASTE_TYPES`, `DAYS_OF_WEEK` enums
- [x] Create `src/utils/helpers.js` for date formatting, `formatReportCode`, etc.
- [x] Promote or add: `Button`, `Input`, `Select`, `TextArea`, `Card`, `Loading`, `BinColorTag` under `src/client/components/shared/`
- [x] Refactor `Navbar.jsx` and `StatusPill.jsx` to pull from `constants.js` instead of hardcoded hex values

**Acceptance:** No `#004a99` hex literal appears in any component file outside `constants.js`.

**Notes from completion:**
- `constants.js` exports COLORS (with primary/secondary/status/bin/text/bg/border groups), STATUS, STATUS_COLOR_MAP, BIN_TYPES, BIN_COLOR_MAP, WASTE_TYPES, DAYS_OF_WEEK, STOP_STATUSES
- Status values use real ServiceNow API format: "Pending", "In Progress", "Resolved" (not SCREAMING_SNAKE)
- 7 shared components created: Button (5 variants, 3 sizes), Input, Select, TextArea, Card (with accentColor), Loading (spinner), BinColorTag
- Navbar and StatusPill refactored to use COLORS tokens

---

### Milestone 1.3 — Mock Data & Stubbed API Layer (Day 3) — **CRITICAL** ✅ **DONE (2026-04-15)**

**Outcome:** Every page fetches data through one module. Phase 2 swap is painless.

- [x] Create `src/mocks/mockData.js` with:
  - `mockBarangays` — all 8 from CLAUDE.md §8, each with `sys_id`, `name`, `zone`
  - `mockHaulers` — 3 haulers
  - `mockSchedules` — 8 schedule rows
  - `mockReports` — 12 reports across all 3 statuses (spread over 30 days for analytics)
  - `mockWasteItems` — 16 items across all 4 bin types
  - `mockRouteStops` — routes for 2 haulers (8 stops total)
- [x] **Migrate `src/data/reports.js` and `reportStore.js` → `src/mocks/mockStore.js`.** Pub/sub pattern preserved, shapes aligned to real API.
- [x] Create `src/services/api.js` — 22 stub functions with 300ms delay, all returning `{ result: ... }` in real API shape.
- [x] Update `ReportTracker.jsx` to import from `services/api.js`
- [x] Deleted `src/data/` directory (reports.js, reportStore.js, status.js)

**Acceptance:** ✅
- Only `services/api.js` imports from `src/mocks/`
- Pub/sub live updates work through the abstraction

---

### Milestone 1.4 — Resident Pages Polish (Day 4–5) ✅ **DONE (2026-04-15)**

**Outcome:** All 7 resident-facing pages match CLAUDE.md §3 feature specs and use the new shared primitives.

- [x] `/` HomePage — SugboLanding re-themed with COLORS tokens and Card component
- [x] `/resident` ResidentHub — cards now use `useNavigate()` directly (no more callback bridge)
- [x] `/schedule` SchedulePage — ScheduleChecker fetches from api.js; ReminderSignup component added below
- [x] `/report` ReportPage — MissedPickupForm calls `createReport()`, shows success modal with "Track This Report" button
- [x] `/track` TrackPage — ReportTracker reads `?code=` query param for auto-fill, styled "not found" card, "Copy Code" button
- [x] `/waste-guide` WasteGuidePage — WasteSortingGuide fetches from api.js, search input + bin-type filter chips added
- [x] `/haulers` HaulerPage — card list with tap-to-call `tel:` links and "View Route" button
- [x] `/route-map` RouteMapPage — hauler selector, ordered stop list with status badges

**Notes from completion:**
- Deleted `ResidentDashboard.jsx` (legacy tab-based navigation, fully replaced by router)
- `ReminderSignup.jsx` created at `src/client/components/resident/`
- `HaulerMap.jsx` now accepts `stops` and `haulerName` props
- Footer.jsx also updated with COLORS tokens

---

### Milestone 1.5 — Admin Shell & Reports (Day 6–7) ✅ **DONE (2026-04-15)**

**Outcome:** Fake admin auth + reports management + the 4 CRUD screens + analytics charts.

- [x] Create `src/context/AuthContext.jsx` — hardcoded `admin` / `admin`, stores `isAdmin` in state, exposes `login()` / `logout()` / `useAuth()` hook
- [x] `/admin/login` LoginPage — form + `login()` redirect; auto-redirects to dashboard if already logged in
- [x] `PrivateRoute` component → gates all `/admin/*` routes; redirects to login if not authed
- [x] `/admin/dashboard` — AdminLayout using `<Outlet>` for nested routes; Sidebar with NavLink routing; TopBar with logout; MetricsGrid + FilterBar + ReportsTable
- [x] Fix `ReportsTable.jsx` — uses `report_code`, `missed_date`, `waste_type`; "Change status" dropdown calls `updateReportStatus()`
- [x] Build 4 CRUD screens: ScheduleManager, HaulerManager, RouteStopManager, WasteItemManager — each with data table, Edit/Delete, inline "New" form
- [x] `/admin/analytics` AdminAnalyticsPage — Recharts installed; bar (by barangay), pie (by waste type), line (filed vs resolved) charts; functional date range filter

**Notes from completion:**
- Used nested routes with `AdminLayout` + `<Outlet>` instead of repeating Sidebar/TopBar per page
- Sidebar links: Dashboard, Schedules, Haulers, Route Stops, Waste Items, Analytics
- FilterBar now fetches barangay list dynamically from api.js
- Date range filter on analytics is functional (filters mock data client-side)

---

### Milestone 1.6 — Polish Pass (Day 8) ✅ **DONE (2026-04-15)**

- [x] Responsive: CSS media queries for 375/768/1440; auto-fit grids; table overflow-x scroll
- [x] Empty states for all lists: ReportsTable, ScheduleChecker, WasteSortingGuide, HaulerPage, RouteMapPage, all CRUD managers
- [x] Loading states using shared `<Loading>` component across all api.js call sites
- [x] Accessibility: `<label htmlFor>` on all inputs, `aria-label` on search/filter controls
- [x] Zero `console.log` statements in src/
- [x] Deleted legacy files: `ResidentDashboard.jsx`, `src/data/` directory
- [ ] Screenshot every page and paste into a team-review doc (pending user confirmation)

---

## Part D — Final Folder Structure After Phase 1

```
src/
├── client/
│   ├── app.jsx             # BrowserRouter + route definitions
│   ├── main.jsx
│   ├── app.css
│   ├── index.html
│   └── components/
│       ├── Navbar.jsx
│       ├── Footer.jsx
│       ├── SugboLanding.jsx
│       ├── ResidentHub.jsx
│       ├── ResidentDashboard.jsx    # fixed
│       ├── ScheduleChecker.jsx
│       ├── MissedPickupForm.jsx
│       ├── WasteSortingGuide.jsx
│       ├── HaulerMap.jsx
│       ├── resident/
│       │   ├── ReminderSignup.jsx   # new
│       │   └── HaulerDirectory.jsx  # new
│       ├── admin/
│       │   ├── MetricsGrid.jsx
│       │   ├── MetricCard.jsx
│       │   ├── FilterBar.jsx
│       │   ├── ReportsTable.jsx     # fixed shape
│       │   ├── ScheduleManager.jsx  # new
│       │   ├── HaulerManager.jsx    # new
│       │   ├── RouteStopManager.jsx # new
│       │   └── WasteItemManager.jsx # new
│       ├── layout/
│       │   ├── AdminContainer.jsx
│       │   ├── Sidebar.jsx
│       │   └── TopBar.jsx
│       ├── shared/
│       │   ├── Button.jsx           # new
│       │   ├── Input.jsx            # new
│       │   ├── Select.jsx           # new
│       │   ├── Card.jsx             # new
│       │   ├── Loading.jsx          # new
│       │   ├── BinColorTag.jsx      # new
│       │   └── StatusPill.jsx
│       └── tracker/
│           ├── ReportTracker.jsx
│           └── StatusStepper.jsx
├── pages/                  # page-level route components
│   ├── HomePage.jsx
│   ├── SchedulePage.jsx
│   ├── ReportPage.jsx
│   ├── TrackPage.jsx
│   ├── WasteGuidePage.jsx
│   ├── HaulerPage.jsx
│   ├── RouteMapPage.jsx
│   └── admin/
│       ├── LoginPage.jsx
│       ├── AdminDashboardPage.jsx
│       └── AdminAnalyticsPage.jsx
├── mocks/
│   └── mockData.js         # ALL fake data lives here
├── services/
│   └── api.js              # stub functions, real-API signatures
├── context/
│   └── AuthContext.jsx     # fake auth
├── hooks/
│   └── useApi.js
├── utils/
│   ├── constants.js        # design tokens + enums
│   └── helpers.js
├── data/                   # ⚠️ DELETE after migrating to src/mocks/
└── fluent/                 # ServiceNow backend — don't touch
```

> Note: `src/data/` is **removed** once mock data is migrated to `src/mocks/` in Milestone 1.3.

---

## Part E — Definition of Done

A team member clones the repo, runs `npm install && npm run dev`, and can:

1. Navigate to every one of the 10 routes via URL
2. Submit a missed-pickup report → see a generated `SC-2026-XXXX` code
3. Track that code → see a Pending → In Progress → Resolved stepper
4. Log in as admin (`admin` / `admin`) → view a populated reports table
5. Change a report's status in admin → see the resident tracker update in real time
6. Filter waste items by bin type
7. See bar + pie + line charts on the analytics page
8. Do all of the above on a 375px mobile viewport without layout breaks
9. See zero calls to `service-now.com` in the browser's Network tab

---

## Part F — What Phase 1 Does **NOT** Include

- ❌ Real ServiceNow API calls — `services/api.js` returns mock data only
- ❌ Real authentication — hardcoded string check
- ❌ Real photo uploads — input previews locally, nothing persisted
- ❌ Real email reminders — success toast only
- ❌ Real Leaflet map — placeholder div until Phase 3
- ❌ Charts against live data — Recharts runs against `mockReports`

---

## Part G — Handoff to Phase 2

When Phase 1 ships, the Phase 2 integrator should only need to:

1. Open `src/services/api.js` and replace each stub body with a real `fetch()` to `https://dev375738.service-now.com/api/1986056/sugboclean_api/...`
2. Replace `AuthContext` fake check with real Basic Auth credential capture
3. Delete `src/mocks/` (or keep for tests)

**Zero page components should need to change.** That's the signal the abstraction in Milestone 1.3 worked.

---

_End of Phase 1 Design Plan (revised 2026-04-15)_
