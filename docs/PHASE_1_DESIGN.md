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

1. **`src/client/app.jsx`** still renders `IncidentList` / `IncidentForm` — the SugboLanding is never shown. This is leftover NowSDK starter code.
2. **`src/client/components/ResidentDashboard.jsx`** uses `<ResidentHub>` without importing it and references an undefined `<StatusTracker>` → runtime crash the moment you click a resident tab.
3. **`src/client/services/IncidentService.js`** hits the generic `/api/now/table/incident` endpoint — wrong table, wrong API. Delete or replace.
4. **`src/client/components/IncidentForm.jsx`, `IncidentList.jsx`** (+ their `.css`) — template leftovers. Delete.
5. **No React Router** — navigation is ad-hoc `activeTab` state / `onNavigate` callbacks. Pages can't be bookmarked or deep-linked.
6. **Inline styles everywhere** — no design tokens, hard to keep consistent. Needs Tailwind OR a single shared theme file.
7. **`admin/ReportsTable.jsx` data shape mismatch** — expects `report.id`, `report.date`, `report.status`. The real API returns `report_code`, `missed_date`, `status`. The mock in `src/data/reports.js` uses yet another shape (`id`, `date`, `status`, `wasteType`, `hasPhoto`). Pick one and align all three.
8. **No `src/services/api.js` stub layer** — the abstraction CLAUDE.md §6 depends on doesn't exist yet. Without it, Phase 2 swap-in will touch every page.
9. **`src/pages/` folder exists but is empty** — if we introduce React Router, put page-level components there.

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

### Milestone 1.1 — Cleanup & Skeleton (Day 1)

**Outcome:** Dead template code is gone, React Router is wired, SugboLanding actually renders.

- [ ] Install: `npm i react-router-dom lucide-react`
- [ ] Delete `IncidentList.jsx`, `IncidentList.css`, `IncidentForm.jsx`, `IncidentForm.css`, `services/IncidentService.js`
- [ ] Rewrite `src/client/app.jsx` to use `<BrowserRouter>` and render `<SugboLanding>` at `/`
- [ ] Fix `ResidentDashboard.jsx`: import `ResidentHub`, delete the broken `<StatusTracker />` reference (route to the tracker page instead)
- [ ] Create empty placeholder page files under `src/pages/` (one per route) so every route resolves

**Acceptance:** App boots, `/` shows SugboLanding, clicking "Resident Services" or "LGU Admin Portal" routes correctly.

---

### Milestone 1.2 — Design Tokens & Shared Primitives (Day 2)

**Outcome:** Stop using inline styles ad-hoc. One source of truth for colors and spacing.

- [ ] Create `src/utils/constants.js` exporting:
  - `COLORS.primary`, `COLORS.secondary`, `COLORS.status.{pending,inProgress,resolved}`, `COLORS.bin.{bio,recycle,residual,hazardous}` (values from CLAUDE.md §7)
  - `STATUS_LABELS`, `BIN_TYPES`, `WASTE_TYPES`, `DAYS_OF_WEEK` enums
- [ ] Create `src/utils/helpers.js` for date formatting, `formatReportCode`, etc.
- [ ] Promote or add: `Button`, `Input`, `Select`, `TextArea`, `Card`, `Loading`, `BinColorTag` under `src/client/components/shared/`
- [ ] Refactor `Navbar.jsx` and `StatusPill.jsx` to pull from `constants.js` instead of hardcoded hex values

**Acceptance:** No `#004a99` hex literal appears in any component file outside `constants.js`.

---

### Milestone 1.3 — Mock Data & Stubbed API Layer (Day 3) — **CRITICAL**

**Outcome:** Every page fetches data through one module. Phase 2 swap is painless.

- [ ] Create `src/mocks/mockData.js` with:
  - `mockBarangays` — all 8 from CLAUDE.md §8, each with `sys_id`, `name`, `zone`
  - `mockHaulers` — 3 haulers
  - `mockSchedules` — 6+ schedule rows
  - `mockReports` — 10+ reports across all 3 statuses (realistic spread for analytics)
  - `mockWasteItems` — 10+ items across all 4 bin types
  - `mockRouteStops` — full route for 1 hauler
- [ ] **Migrate `src/data/reports.js` and `reportStore.js` → `src/mocks/mockData.js`.** Keep the pub/sub pattern but align the shape to the real API (`report_code`, `missed_date`, `u_barangay` display name, etc.)
- [ ] Create `src/services/api.js` — **one stub function per endpoint in CLAUDE.md §5** (22 total). Every function:
  - Has the same name as CLAUDE.md §6 shows (`getBarangays`, `createReport`, `updateReportStatus`, …)
  - Returns `{ result: ... }` in the real API shape
  - Uses a small `delay()` helper to simulate latency (300ms)
  - `createReport()` generates a realistic `SC-2026-NNNN` code and pushes into mock store
  - `updateReportStatus()` mutates the mock store so the tracker's live subscription actually reflects changes
- [ ] Update `ReportTracker.jsx` to import from `services/api.js`, not `data/reportStore.js` directly

**Acceptance:**
- No component imports from `src/mocks/` or `src/data/` directly
- Changing a report's status in the admin ReportsTable causes the tracker page to live-update (pub/sub still works through the abstraction)

---

### Milestone 1.4 — Resident Pages Polish (Day 4–5)

**Outcome:** All 7 resident-facing pages match CLAUDE.md §3 feature specs and use the new shared primitives.

- [ ] `/` HomePage — already `SugboLanding`, just re-theme with tokens
- [ ] `/resident` ResidentHub — rebind cards to router links (not `onNavigate` callbacks)
- [ ] `/schedule` SchedulePage — wrap existing `ScheduleChecker`; add `ReminderSignup` component below
- [ ] `/report` ReportPage — wrap existing `MissedPickupForm`; on submit show a success modal with the generated code + "Track this" button
- [ ] `/track` TrackPage — wrap existing `ReportTracker`; add a "not found" state and a "copy code" action
- [ ] `/waste-guide` WasteGuidePage — wrap existing `WasteSortingGuide`; add search + bin-type filter chips
- [ ] `/haulers` HaulerPage — **new**. Card list from `getHaulers()`, tap-to-call, "View route" link
- [ ] `/route-map` RouteMapPage — wrap existing `HaulerMap` placeholder; add ordered stop list underneath

**Acceptance:** Every resident page is reachable by URL, renders against mock data, and responds at 375px width.

---

### Milestone 1.5 — Admin Shell & Reports (Day 6–7)

**Outcome:** Fake admin auth + reports management + the 4 CRUD screens + analytics charts.

- [ ] Create `src/context/AuthContext.jsx` — hardcoded `admin` / `admin`, stores `isAdmin` in state, exposes `login()` / `logout()`
- [ ] `/admin/login` LoginPage — form + `login()` redirect
- [ ] `PrivateRoute` component → gates all `/admin/*` routes; redirects to login if not authed
- [ ] `/admin/dashboard` — use existing `AdminContainer + Sidebar + TopBar`, default to ReportsTable
- [ ] Fix `ReportsTable.jsx` to use the real API shape (`report_code`, `missed_date`), add row-action "Change status" dropdown → calls stubbed `updateReportStatus()`
- [ ] Build the 4 missing CRUD screens (ScheduleManager / HaulerManager / RouteStopManager / WasteItemManager):
  - Data table with Edit / Delete row actions
  - "New" button → modal form
  - Each hits stubbed create / update / delete in `services/api.js`
- [ ] `/admin/analytics` AdminAnalyticsPage — install Recharts, render bar + pie + line charts against `mockReports`; include date range selector (non-functional stub fine for Phase 1)

**Acceptance:** Logged-in admin can view reports, flip a status and see it instantly reflect on the resident `/track` page via the pub/sub store. Charts render.

---

### Milestone 1.6 — Polish Pass (Day 8)

- [ ] Responsive sweep at 375 / 768 / 1440
- [ ] Empty states (no reports, no schedule for barangay, no search results)
- [ ] Loading + error states for every `services/api.js` call site
- [ ] Accessibility: labels on inputs, clear button text, WCAG AA contrast
- [ ] Remove any remaining `console.log` / dead imports
- [ ] Screenshot every page and paste into a team-review doc

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
