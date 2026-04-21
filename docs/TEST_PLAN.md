# SugboClean — System Overview & Test Plan

> **Audience:** Teammates joining the project or testing the pilot build.
> **Goal:** Understand what SugboClean is, what's built, what's pending, and how to test every user-facing flow.
>
> **Last updated:** 2026-04-22

---

## 1. System Overview

### 1.1 What is SugboClean?

SugboClean is a **waste management web application** built for the Local Government Unit (LGU) sanitation office of Cebu City. It connects residents to the sanitation office without requiring user accounts.

**Tagline:** *Keeping Sugbo clean, one pickup at a time.*

### 1.2 Key Purpose

- Let **residents** check their pickup schedule, report missed collections, track report status, learn proper waste sorting, and subscribe to email reminders — all without logging in.
- Let **LGU admins** manage barangays, haulers, schedules, routes, waste items, and reports through a protected dashboard with analytics.

### 1.3 Tech Stack (Quick Reference)

| Layer            | Technology                                                       |
| ---------------- | ---------------------------------------------------------------- |
| Frontend         | React 19, React Router (HashRouter)                              |
| Styling          | Vanilla CSS with design tokens                                   |
| Maps             | Leaflet + OpenStreetMap                                          |
| Charts           | Recharts                                                         |
| Backend          | ServiceNow scoped app `x_1986056_sugbocle` on `dev375738.service-now.com` |
| API              | 25 Scripted REST endpoints through `src/services/api.js`        |
| Auth             | OAuth 2.0 Authorization Code + PKCE (admin only)                |
| Build / Deploy   | ServiceNow NowSDK (`@servicenow/sdk` 4.5)                       |

### 1.4 Two User Types

| User Type     | Auth Required? | Access Level                          |
| ------------- | -------------- | ------------------------------------- |
| **Resident**  | No             | Public pages — read-only data + report submission |
| **LGU Admin** | Yes (OAuth)    | Full CRUD on all entities + analytics |

---

## 2. Application Architecture

### 2.1 Routes

#### Resident Routes (Public)

| Route           | Page                | Component                          |
| --------------- | ------------------- | ---------------------------------- |
| `/`             | Landing / Home      | `SugboLanding.jsx`                 |
| `/schedule`     | Check Pickup Schedule | `ScheduleChecker.jsx`            |
| `/report`       | Report Missed Pickup | `MissedPickupForm.jsx`            |
| `/track`        | Track a Report      | `ReportTracker.jsx`                |
| `/waste-guide`  | Waste Sorting Guide | `WasteSortingGuide.jsx`            |

#### Admin Routes (Protected — requires login)

| Route                  | Page                    | Component                     |
| ---------------------- | ----------------------- | ----------------------------- |
| `/admin/login`         | Login                   | `LoginPage.jsx`               |
| `/admin/oauth/callback`| OAuth Callback          | `OAuthCallback.jsx`           |
| `/admin/dashboard`     | Dashboard               | `AdminDashboardPage.jsx`      |
| `/admin/barangays`     | Barangay Manager        | `BarangayManager.jsx`         |
| `/admin/haulers`       | Hauler Manager          | `HaulerManager.jsx`           |
| `/admin/schedules`     | Route Builder           | `RouteBuilder.jsx`            |
| `/admin/waste-items`   | Waste Item Manager      | `WasteItemManager.jsx`        |
| `/admin/analytics`     | Analytics               | `AdminAnalyticsPage.jsx`      |

### 2.2 Backend Schema (7 Tables)

All tables are prefixed `x_1986056_sugbocle_`:

| Table                    | Purpose                                                |
| ------------------------ | ------------------------------------------------------ |
| `barangay`               | City subdivisions with optional lat/lng coordinates    |
| `hauler`                 | Garbage collection operators assigned to a barangay    |
| `schedule`               | Pickup schedules (day, time window, waste type, hauler)|
| `report`                 | Missed pickup complaints filed by residents            |
| `route_stop`             | Geographic stops along a hauler's route (per schedule) |
| `waste_item`             | Waste sorting guide entries (name, bin type, instructions) |
| `reminder_subscription`  | Email subscriptions for pickup reminders (per schedule)|

### 2.3 Key Data Relationships

```
Barangay ──1:1──▶ Hauler
Hauler   ──1:N──▶ Schedule
Schedule ──1:N──▶ Route Stop
Barangay ──1:N──▶ Report
Schedule ──1:N──▶ Reminder Subscription
```

- **Report code format:** `SC-YYYY-NNNN` — auto-generated server-side. Never generated on the frontend.
- **Status flow:** `Pending → In Progress → Resolved` (forward only, enforced at both UI and API layers).
- **Route stop ETAs:** Derived at render time via `etaFromSchedule(schedule.time_window_start, offset_minutes)` — not stored in the database.

---

## 3. Admin View — Current State

### 3.1 Implemented Features ✅

| Feature                  | Component(s)                          | Status   | Notes |
| ------------------------ | ------------------------------------- | -------- | ----- |
| **Login (OAuth PKCE)**   | `LoginPage.jsx`, `OAuthCallback.jsx`, `AuthContext.jsx` | Working | Authorization Code + PKCE flow; Basic Auth dev form hidden (`DEV_USE_BASIC_AUTH = false`) |
| **Dashboard**            | `AdminDashboardPage.jsx`, `MetricsGrid.jsx`, `ReportsTable.jsx` | Working | Metric cards + recent reports table with status updates |
| **Barangay CRUD**        | `BarangayManager.jsx`                 | Working | Create/edit/delete barangays with optional lat/lng; coordinate validation (range + type checks); map preview via `RouteMap` |
| **Hauler CRUD**          | `HaulerManager.jsx`                   | Working | Create/edit/delete haulers; barangay assignment validated at submit |
| **Schedule CRUD**        | `HaulerScheduleManager.jsx` (inside `RouteBuilder.jsx`) | Working | Create/edit/delete pickup schedules per hauler; time in `HH:MM:SS` (Glide format) |
| **Route Builder (Map)**  | `RouteBuilder.jsx`, `RouteMap.jsx`    | Working | Interactive Leaflet map with Set Start / Add Stop / Set End tools; drag, reorder, inline edit; schedule-scoped stops with offset-based ETAs; deep-linkable via `?schedule=<sys_id>` URL param |
| **Live Stop Status**     | `computeStopStatuses()` in `helpers.js` | Working | Stateless time-driven status (Not Arrived / Current / Passed) using Manila timezone; 60s auto-refresh; amber pulse animation on "Current" pin |
| **Waste Item CRUD**      | `WasteItemManager.jsx`                | Working | Create/edit/delete; bin type with color swatches (`BinSwatch`); validation on name + bin_type + instructions |
| **Reports Management**   | `ReportsTable.jsx`, `ReportDetailDrawer.jsx` | Working | View all reports, change status (forward-only dropdown), bulk delete with checkboxes, detail drawer with description + email + attachments + photo |
| **Analytics**            | `AdminAnalyticsPage.jsx`              | Working | Recharts bar/pie/line charts for report trends |
| **Bulk Report Delete**   | `ReportsTable.jsx`                    | Working | Multi-select checkboxes, indeterminate select-all, `Promise.allSettled` for partial-failure handling |
| **Submitted Column**     | `ReportsTable.jsx`                    | Working | Shows `created_on` date; sorted by status rank then `missed_date` desc |

### 3.2 Admin — Known Issues & Limitations

| Issue | Description | Severity |
| ----- | ----------- | -------- |
| `<Select required />` dead prop | `Select` wraps a custom `Dropdown`, so `required` only adds a `*` to the label — it doesn't enforce validation. 4 forms still rely on this: `MissedPickupForm` (barangay, waste_type), `ReminderSignup` (barangay), `HaulerScheduleManager` (waste_type, day_of_week), `BarangayManager` (zone). | Medium |
| DELETE route not deployed | The new `DELETE /reports/{sys_id}` backend route exists in the repo but hasn't been pushed via `npm run deploy` yet. Bulk delete will 404 on the deployed instance until then. | High (deploy blocker) |
| Stale CLAUDE.md base URL | §6 says `/api/1986056/sugboclean_api` but actual is `/api/x_1986056_sugbocle/sugboclean_api`. Docs-only; runtime code is correct. | Low |
| OAuth PKCE flag | `oauth_entity.use_pkce` needs to be flipped from `'false'` → `'true'` on the ServiceNow instance UI. Flow works without it but should be closed. | Low |

### 3.3 Admin — Pending Tasks

- [ ] Run `npm run deploy` to push the DELETE reports route to the instance
- [ ] Decide on the `<Select required />` fix strategy (scoped per-form guards vs. fix the primitive)
- [ ] Remove legacy `loginBasic()` from `AuthContext.jsx` and the hidden dev form from `LoginPage.jsx` (one release of soak time complete)
- [ ] Flip `oauth_entity.use_pkce` on the ServiceNow instance
- [ ] Fix stale folder/path references in `CLAUDE.md`

---

## 4. Resident View — Current State

### 4.1 Implemented Features ✅

| Feature                      | Component(s)                          | Status   | Notes |
| ---------------------------- | ------------------------------------- | -------- | ----- |
| **Landing Page**             | `SugboLanding.jsx`                    | Working | Hero section with CTAs: Check Schedule, Report Missed Pickup, Track Report, Waste Guide |
| **Schedule Checker**         | `ScheduleChecker.jsx`                 | Working | Select barangay → see hauler info, pickup days/times, Leaflet route map with numbered pins and live stop status (pulsing amber = current stop) |
| **Report Missed Pickup**     | `MissedPickupForm.jsx`                | Working | Form with barangay, waste type, date, description (required), optional email + photo upload; returns `SC-YYYY-NNNN` code on success |
| **Track a Report**           | `ReportTracker.jsx`, `StatusStepper.jsx` | Working | Enter report code → see visual stepper (Pending → In Progress → Resolved) |
| **Waste Sorting Guide**      | `WasteSortingGuide.jsx`               | Working | Color-coded bin cards with search/filter; items fetched from the API |
| **Pickup Reminder Signup**   | `ReminderSignup.jsx`                  | Working | Select barangay → pre-checked checkbox list of schedules → subscribe by email; per-schedule unsubscribe via email link; 30s cooldown after submit |
| **Live Route Status**        | Via `ScheduleChecker.jsx` + `RouteMap.jsx` | Working | Pins change color based on time of day (grey = not arrived, amber pulse = current, green = passed); 60s auto-refresh; Manila timezone |
| **Navigation**               | `Navbar.jsx`, `Footer.jsx`           | Working | Responsive navbar with links to all resident pages; footer with branding |

### 4.2 Resident — Known Issues & Limitations

| Issue | Description | Severity |
| ----- | ----------- | -------- |
| `<Select required />` dead prop | Barangay and waste type dropdowns in `MissedPickupForm` show `*` but don't block submit via native validation (description is properly validated, though). The `canSubmit` guard catches empty barangay/wasteType so the user can't actually submit without them — the issue is visual consistency, not a functional gap. | Low |
| No offline support | The app requires an internet connection. No PWA / service worker caching exists yet. | Medium |
| English only | No Cebuano translation. All text is hardcoded in English. | Medium |
| Unsubscribe is per-schedule | Clicking "unsubscribe" in a reminder email only kills that one schedule's subscription. A resident subscribed to 3 schedules must unsubscribe 3 times. No "Manage subscriptions" page exists. | Low |

### 4.3 Resident — Pending Tasks

- [ ] PWA shell + service worker for offline schedule caching
- [ ] Cebuano / English i18n toggle
- [ ] Decide on unsubscribe UX: per-schedule (current) vs. email-scoped (one-click kills all) vs. "Manage subscriptions" page

---

## 5. Shared Components & Utilities

### 5.1 Shared UI Primitives (`src/client/components/shared/`)

| Component          | Purpose                                                     |
| ------------------ | ----------------------------------------------------------- |
| `Button.jsx`       | Primary/secondary/danger button variants                    |
| `Card.jsx`         | Content card wrapper                                        |
| `Input.jsx`        | Text input with label, error state, `required` indicator    |
| `TextArea.jsx`     | Multi-line input with `required` forwarded to native element|
| `Select.jsx`       | Label + Dropdown wrapper (**`required` is a dead prop** — only visual) |
| `Dropdown.jsx`     | Custom dropdown/popover (supports `icon` per option)        |
| `DatePicker.jsx`   | Calendar date picker                                        |
| `FileUpload.jsx`   | Drag-and-drop file upload with progress                     |
| `Toast.jsx`        | Temporary success/error notification                        |
| `ConfirmDialog.jsx`| Modal confirmation dialog for destructive actions           |
| `StatusPill.jsx`   | Colored badge for report status (Pending/In Progress/Resolved) |
| `BinColorTag.jsx`  | Colored label for waste bin types                           |
| `Loading.jsx`      | Spinner / loading indicator                                 |
| `Skeleton.jsx`     | Content-loading placeholder                                 |
| `EmptyState.jsx`   | "No data" illustration + message                            |
| `PageHeader.jsx`   | Page title + optional back button                           |
| `BackButton.jsx`   | Navigation back button                                      |
| `PrivateRoute.jsx` | Route guard — redirects unauthenticated users to login      |
| `RouteMap.jsx`     | Leaflet map with numbered pins, polyline, live status mode  |

### 5.2 Key Utilities

| File                    | What it provides                                                    |
| ----------------------- | ------------------------------------------------------------------- |
| `src/services/api.js`   | All HTTP calls (25 endpoints + attachment + auth verify). Never call `fetch` from a component. |
| `src/services/oauth.js` | PKCE helpers: `beginOAuthLogin`, `completeOAuthLogin`, `refreshAccessToken` |
| `src/utils/helpers.js`  | `etaFromSchedule`, `computeStopStatuses`, `toGlideTime`, `fromGlideTime`, `formatTime12h`, `formatDate` |
| `src/utils/constants.js`| API config, OAuth config, color tokens, status constants            |
| `src/context/AuthContext.jsx` | Auth state, session management, auto-refresh for bearer tokens |

---

## 6. QA Test Plan

> **Environment:** Dev instance `dev375738.service-now.com` via `npm run dev` on your machine.
> **Time needed:** ~30–45 minutes for a full pass.

### 6.0 Before You Start

- [ ] App running locally (`npm run dev`) or via a shared dev URL from the lead
- [ ] Admin credentials for the ServiceNow `dev375738` instance (ask the lead — never paste in chat or commit)
- [ ] Modern browser (Chrome or Edge) with DevTools open (Network + Console tabs)
- [ ] Phone or browser DevTools device emulation for mobile testing
- [ ] A sample photo (any JPG under 5 MB) for the photo upload step

**Ground rules:**

1. Follow the order — some steps depend on earlier ones (barangay → hauler → schedule → route stops).
2. Note every surprise — even small UX issues count.
3. Never share credentials in screenshots or bug reports.
4. Hard-reload (`Ctrl+Shift+R`) at the start of each session.

---

### Part 1 — Admin Flow

#### 1.1 Login

1. Navigate to `/admin/login` (or press `Ctrl+Shift+L`).
2. Click **"Log in with ServiceNow"** — this opens the OAuth flow.
3. Enter your ServiceNow admin credentials on the ServiceNow login page.

**Expected:**
- You land on the admin dashboard within 2–3 seconds.
- The sidebar shows: Dashboard, Reports, Barangays, Haulers, Schedules, Waste Items, Analytics.

**Try to break it:**
- [ ] Cancel the OAuth flow mid-way → should return to the login page, not crash.
- [ ] Visit `/admin/dashboard` directly without logging in → should redirect to login.

---

#### 1.2 Dashboard

1. Check the dashboard renders:
   - [ ] Metric cards (total reports, pending, resolved, etc.)
   - [ ] Recent reports table (sorted by status rank, then missed date)
   - [ ] Charts (bar / pie / line) render without red console errors

**Try to break it:**
- [ ] Resize from desktop to phone width — charts and tables should adapt, not overflow.

---

#### 1.3 Barangay CRUD

1. Go to **Barangays** → click **+ New Barangay**.
2. Fill: Name = `Test Barangay A`, Zone = any, Latitude = `10.3157`, Longitude = `123.8854`. Save.

**Expected:** Row appears in the list with coords. Success toast.

3. Click **Edit** → change name to `Test Barangay A — edited`. Save.

**Expected:** Name updates. No errors.

4. Keep this barangay for later steps.

**Try to break it:**
- [ ] Save with latitude = `"abc"` → should show inline error, block save, no crash.
- [ ] Save with latitude = `999` → should show "must be between -90 and 90" error.
- [ ] Save without selecting a zone → does the form allow it? (Known dead-prop issue — note behavior.)

---

#### 1.4 Hauler CRUD

1. Go to **Haulers** → click **+ New Hauler**.
2. Fill: Name = `Test Hauler 01`, Contact = `0917-000-0000`, Areas = `Sample streets`, Barangay = `Test Barangay A — edited`. Save.

**Expected:** Hauler appears with assigned barangay.

3. Edit: change contact to `0917-111-1111`. Save.

**Try to break it:**
- [ ] Try to save without a barangay → should show "Assigned Barangay is required." error.

---

#### 1.5 Schedules + Route Builder

This is the most complex admin flow. Take your time.

1. Go to **Schedules** (Route Builder page).
2. Scroll to **Manage Schedules** → select `Test Hauler 01`.

##### 1.5.1 Create a Schedule

3. Click **+ New Schedule**. Fill: Waste Type = `Biodegradable`, Day = `Monday`, Start = `08:00`, End = `10:00`. Save.

**Expected:** Row shows `Biodegradable · Monday · 8:00 AM – 10:00 AM`. Success toast.

4. Edit: change End Time to `11:00`. Save.

**Expected:** Row updates to `8:00 AM – 11:00 AM`. No 405 in Network tab.

##### 1.5.2 Build the Route (Map)

5. Select the schedule you just created from the schedule picker at the top.
6. Click **Set Start** (green tool) → click the map.
7. Fill the form: Label = `Barangay Hall`, Offset = `0` (minutes from start). Save.

**Expected:** Green `S` pin appears. Sidebar shows the stop with `Start · ETA 8:00 AM`.

8. Click **Add Stop** → click map. Label = `Stop 1`, Offset = `30`. Save.
9. Click **Add Stop** → click map. Label = `Stop 2`, Offset = `60`. Save.
10. Click **Set End** (red) → click map. Label = `End Point`, Offset = `90`. Save.

**Expected:** 4 pins on the map (green S, blue 2, blue 3, red E) connected by a dashed line. Sidebar lists all four with 12-hour ETAs.

##### 1.5.3 Edit, Reorder, Drag

11. In the sidebar, click **Edit** on Stop 1. Change offset to `45`. Save.

**Expected:** ETA updates to `8:45 AM`. No 405.

12. Click ↑ / ↓ arrows to swap Stop 1 and Stop 2.

**Expected:** Order changes in both sidebar and map polyline.

13. Drag a pin on the map to a new location.

**Expected:** Pin stays at the new position after release.

14. Click **✕** to delete a stop.

**Expected:** Confirmation dialog → confirm → stop disappears; remaining stops renumber.

**Try to break it:**
- [ ] Set two Start pins → should block the second.
- [ ] Refresh the page → stops should re-appear (URL carries `?schedule=<sys_id>`).
- [ ] Check the "Stay in mode" toggle — when OFF, tool should reset after each placement.

---

#### 1.6 Waste Items CRUD

1. Go to **Waste Items** → add: Name = `Test Bottle`, Bin = `Recyclable`, Instructions = `Rinse and flatten`.
2. Verify the color swatch dot matches the bin type.
3. Edit it — change the bin type. Verify the swatch updates.
4. Delete it.

**Expected:** All operations succeed. Color swatches are consistent.

**Try to break it:**
- [ ] Try to save with empty name, bin type, or instructions → should show validation error.

---

#### 1.7 Reports — Status & Bulk Delete

1. Go to **Reports** (or Dashboard). Pick any existing report.
2. Change status: **Pending → In Progress**. Save.

**Expected:** Row reflects new status immediately.

3. Change again: **In Progress → Resolved**.

**Try to break it:**
- [ ] Resolved → Pending → dropdown should not offer backward options (Resolved row is disabled).
- [ ] Select multiple reports via checkboxes → bulk action bar appears → click Delete → confirm → reports removed.
- [ ] Open the detail drawer on a report → description should show line breaks; long emails should wrap.

---

#### 1.8 Analytics

1. Go to **Analytics**.

**Expected:** All charts render within 2 seconds. Numbers roughly match the Reports table. No console errors.

---

### Part 2 — Resident Flow

**Open a fresh incognito tab** so the admin session doesn't leak.

#### 2.1 Landing Page

1. Home page loads with SugboClean branding.
2. CTAs visible: Check Schedule, Report Missed Pickup, Track a Report, Waste Guide.

**Try to break it:**
- [ ] Mobile width — nothing cut off, no horizontal scroll.

---

#### 2.2 Schedule Checker

1. Navigate to `/schedule`. Pick `Test Barangay A — edited`.

**Expected:**
- Hauler name + contact number shown.
- Pickup schedule: `Monday · Biodegradable · 8:00 AM – 11:00 AM`.
- Leaflet map shows route pins with dashed polyline.
- If today is Monday during the time window: one pin should pulse amber (current stop).
- Clicking a pin → popup with label, ETA, and status.

**Try to break it:**
- [ ] Pick a barangay with no schedule → clear empty state, no crash.

---

#### 2.3 Pickup Reminder Signup

1. On the schedule page, scroll to the **Reminder Signup** section.
2. Select a barangay → checkbox list of schedules should appear (pre-checked).
3. Enter an email and submit.

**Expected:**
- Success toast. Button shows "Wait 30s" cooldown.
- Unchecking a schedule and re-submitting subscribes only to the checked ones.

**Try to break it:**
- [ ] Submit with no email → should be blocked.
- [ ] Submit with all schedules unchecked → button should be disabled.
- [ ] Pick a barangay with no schedules → "No pickup schedules published" message.

---

#### 2.4 Report a Missed Pickup

1. Navigate to `/report`. Fill the form:
   - Barangay: `Test Barangay A — edited`
   - Waste type: `Biodegradable`
   - Description: `Testing the report flow` (this is required — cannot be empty)
   - Photo: attach a sample JPG (optional)
2. Submit.

**Expected:** Success screen shows `SC-YYYY-NNNN` code. **Copy it** for the next step.

**Try to break it:**
- [ ] Submit with empty description → should show error "Please describe what happened…"
- [ ] Submit with a 10 MB photo → should either upload or fail cleanly.

---

#### 2.5 Track a Report

1. Navigate to `/track`. Enter the `SC-YYYY-NNNN` code from 2.4.

**Expected:** Stepper shows **Pending** status.

2. **Cross-window test:** In the admin tab, change this report to **In Progress**. In the resident tab, wait up to 15 seconds.

**Expected:** Status updates without manual refresh.

**Try to break it:**
- [ ] Enter `SC-9999-9999` → "not found" message, no crash.
- [ ] Enter `abc` → input validation message.

---

#### 2.6 Waste Sorting Guide

1. Open `/waste-guide`.

**Expected:** Bins are color-coded. Items show name + instructions. Search/filter works.

**Try to break it:**
- [ ] Long item descriptions should wrap, not overflow.
- [ ] Search for a non-existent item → empty state.

---

### Part 3 — Cleanup

After testing, clean up test data:

1. Admin → **Reports** → select test report(s) checkbox → bulk delete.
2. Admin → **Schedules** → select the test schedule → delete all route stops, then the schedule.
3. Admin → **Haulers** → delete `Test Hauler 01`.
4. Admin → **Barangays** → delete `Test Barangay A — edited`.

**Expected:** All deletes succeed. No leftover rows. Refresh to confirm.

---

### Part 4 — Mobile Pass (Recommended)

Repeat **Part 2 (resident flow)** on a real phone or DevTools device emulation (iPhone 12 / Pixel 5):

- [ ] Can I read everything without pinch-zoom?
- [ ] Do forms, dropdowns, and the map work with touch?
- [ ] Are buttons large enough to tap accurately?
- [ ] Does the navbar work in mobile layout?

---

## 7. Priority Task Summary

### 🔴 Must Do Before Launch

| # | Task | Owner | Notes |
| - | ---- | ----- | ----- |
| 1 | Run `npm run deploy` to push DELETE reports route | Lead | Backend route exists in repo, not yet on instance |
| 2 | Flip `oauth_entity.use_pkce` to `true` on ServiceNow | Lead | Instance UI, not repo |
| 3 | Fix stale `CLAUDE.md` §6 base URL and folder paths | Anyone | Doc fix only — runtime is correct |

### 🟡 Should Do (Quality / Polish)

| # | Task | Owner | Notes |
| - | ---- | ----- | ----- |
| 4 | Decide and implement `<Select required />` fix | Team decision | 4 forms affected; three strategies documented in tasks.md |
| 5 | Remove legacy `loginBasic()` and hidden dev form | Anyone | One release of soak complete |
| 6 | Decide unsubscribe UX (per-schedule vs. email-scoped) | Team decision | Current: per-schedule; no "manage" page |

### 🟢 Future (Phase 3 Remaining + Phase 4)

| # | Task | Owner | Notes |
| - | ---- | ----- | ----- |
| 7 | PWA shell + offline schedule caching | TBD | Phase 3 scope |
| 8 | Cebuano / English i18n toggle | TBD | Phase 3 scope |
| 9 | SMS reminders (Phase 4) | TBD | Evidence-gated |
| 10 | AI report triage (Phase 4) | TBD | Evidence-gated |

---

## 8. How to Report Bugs

For each issue, use this template:

```
Title: <short, specific — e.g. "Route Builder: ETA shows wrong time after edit">

Severity: Blocker | High | Medium | Low | Nit
  Blocker = can't complete the flow at all
  High    = major function broken, workaround exists
  Medium  = visual / minor function bug
  Low     = polish, inconsistency
  Nit     = personal preference / small wording

Where: Admin or Resident, which page / URL

Steps to reproduce:
  1. ...
  2. ...
  3. ...

Expected: <what should happen>

Actual:   <what did happen>

Environment:
  - Browser + version: e.g. Chrome 131 on Windows 11
  - Screen: desktop / tablet / phone
  - Date/time of test: <so we can correlate with server logs>

Attachments:
  - Screenshot or screen recording
  - Console errors (F12 → Console tab)
  - Network tab entries for failing calls (right-click → Copy as cURL; redact auth headers)
```

### Examples

**Good bug report:**
> **Title:** Route Builder: clicking ↑ on the first stop fires a failing request
> **Severity:** Low
> **Where:** Admin, `/admin/schedules`
> **Steps:** 1. Open Route Builder with 3 stops. 2. Click ↑ on stop #1.
> **Expected:** Button is disabled or no-ops.
> **Actual:** Request fires and returns 400; toast shows "Reorder failed".
> **Environment:** Chrome 131 on Windows 11, desktop, 2026-04-22 14:20.

**Bad bug report:**
> "Schedules is broken" ← no steps, no severity, impossible to act on.

---

*End of system overview and test plan. Ship bug reports back to the lead — small bugs count.*
