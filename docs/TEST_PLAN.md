# SugboClean — QA Test Plan

> **Audience:** Teammates testing the pilot build before launch.
> **Goal:** Walk through every user-facing flow and surface bugs. Report findings using the template at the bottom.
>
> **Environment:** Dev — `dev375738.service-now.com` via `npm run dev` on the tester's machine, **or** a shared dev URL if one has been set up.
> **Time needed:** ~30–45 minutes for a full pass.

---

## 0. Before You Start

### 0.1 What you need

- [ ] The app running locally (`npm run dev`) **or** the shared URL from the lead
- [ ] Admin credentials for the ServiceNow `dev375738` instance (ask the lead — do **not** paste them into chat or commit them)
- [ ] A modern browser (Chrome or Edge). Open DevTools (F12) to the **Network** and **Console** tabs so you can screenshot errors.
- [ ] A phone or browser DevTools device emulation (mobile view) — some bugs only appear on small screens
- [ ] A sample photo on your machine (any JPG under 5 MB) for the photo-upload step

### 0.2 Ground rules

1. **Follow the order.** Some steps depend on earlier ones (you create a barangay first, then a hauler in that barangay, then a schedule for that hauler, etc.).
2. **Note every surprise.** If anything looks wrong, feels slow, or confuses you — log it. Even small UX issues count.
3. **Don't share credentials.** Never put passwords in screenshots or bug reports.
4. **Hard-reload if something looks stale.** Ctrl+Shift+R clears cached JS. Do this at the start of each session.

---

## Part 1 — Admin Flow

### 1.1 Login

1. Navigate to `/admin/login` or CTRL+SHIFT+L (or click "Admin" in the sidebar if shown).
2. Enter the ServiceNow admin username and password.
3. Click **Log in**.

**Expected:**
- You land on the admin dashboard within 2–3 seconds.
- The sidebar shows admin-only links (Dashboard, Reports, Barangays, Haulers, Schedules, Waste Items, Analytics).

**Try to break it:**
- [ ] Log in with a wrong password → should show a clear error message, not crash, and **not** log you in.
- [ ] Log in with an empty username → form should block submit or show "Required".

---

### 1.2 Dashboard

1. From the dashboard, check:
   - [ ] Metric cards render (total reports, pending, resolved, etc.)
   - [ ] Recent reports table shows data (or an empty-state message if no reports exist yet)
   - [ ] Charts (bar / pie / line) render without red errors in the console

**Try to break it:**
- [ ] Resize the browser window from full-width down to phone size — charts and tables should adapt, not overflow.

---

### 1.3 Barangay CRUD

1. Go to **Barangays**.
2. Click **+ New Barangay**. Fill:
   - Name: `Test Barangay A`
   - Zone: pick any
   - Latitude: `10.3157`
   - Longitude: `123.8854`
3. Save.

**Expected:**
- Row appears in the list with the coords shown.
- Success toast.

4. Click **Edit** on the row. Change the name to `Test Barangay A — edited`. Save.

**Expected:**
- Name updates in the list; no errors.

5. Keep this barangay — you'll use it below. **Don't delete it yet.**

**Try to break it:**
- [ ] Save with latitude = `"abc"` (non-numeric) → should block or show an error.
- [ ] Save with latitude = `999` → app should accept or warn, but not crash.
- [ ] Delete a **different** barangay that has a hauler assigned — what happens in the UI? What happens in ServiceNow?

---

### 1.4 Hauler CRUD

1. Go to **Haulers**.
2. Click **+ New Hauler**. Fill:
   - Name: `Test Hauler 01`
   - Contact number: `0917-000-0000`
   - Areas covered: `Sample streets`
   - Barangay: pick `Test Barangay A — edited`
3. Save.

**Expected:**
- Hauler appears in the list with its assigned barangay shown.

4. Edit it: change contact number to `0917-111-1111`. Save.

**Expected:**
- Contact number updates; no errors.

**Try to break it:**
- [ ] Try to save without picking a barangay → should be blocked.

---

### 1.5 Schedules + Route Builder

This is the most complex flow. Take your time.

1. Go to **Schedules** (this is the unified Route Builder page).
2. Pick `Test Hauler 01` from the dropdown.

**Expected:**
- You see an empty schedule table (no entries yet) and an empty route map centered on your test barangay.
- The "Assigned barangay" next to the hauler name reads `Test Barangay A — edited`.

#### 1.5.1 Create a schedule

3. Click **+ New Schedule**. Fill:
   - Waste Type: `Biodegradable`
   - Day: `Monday`
   - Start Time: `08:00`
   - End Time: `10:00`
4. Save.

**Expected:**
- Row appears in the table showing `Biodegradable · Monday · 8:00 AM – 10:00 AM` (12-hour format).
- Success toast.

5. Edit the schedule: change End Time to `11:00`. Save.

**Expected:**
- Row updates to `… 8:00 AM – 11:00 AM`. **No 405 error** in the Network tab.

#### 1.5.2 Build the route (map tools)

6. Click the **Set Start** tool (green), then click anywhere on the map.
7. A form appears with Label + Estimated Arrival. Fill:
   - Label: `Barangay Hall`
   - Estimated Arrival: `08:00`
8. Click **Save**.

**Expected:**
- A green `S` pin appears at the clicked location within 1 second.
- Sidebar shows the stop with `Start · ETA 8:00 AM · Not Arrived`.

9. Click **Add Stop**, click the map. Label: `Stop 1`, ETA: `08:30`. Save.
10. Click **Add Stop** again, click the map. Label: `Stop 2`, ETA: `09:00`. Save.
11. Click **Set End** (red), click the map. Label: `End Point`, ETA: `09:30`. Save.

**Expected:**
- 4 pins on the map (green S, blue 2, blue 3, red E) connected by a dashed line **in order**.
- Sidebar lists all four rows with 12-hour ETAs.

#### 1.5.3 Edit, reorder, drag

12. In the sidebar, click **Edit** on Stop 1. Change ETA to `08:45`. Save.

**Expected:**
- Sidebar and popup update to `8:45 AM`. **No 405.**

13. Click the ↑ / ↓ arrows to swap Stop 1 and Stop 2.

**Expected:**
- Order changes in both sidebar and map polyline. **No 405.**

14. Drag one of the pins on the map to a new location and release.

**Expected:**
- Pin stays at the new position after release (the change persists). **No 405.**

15. Click the **✕** on one of the stops to delete it.

**Expected:**
- Confirmation dialog → confirm → stop disappears from both map and sidebar; remaining stops renumber.

**Try to break it:**
- [ ] Try to place **two** Start pins → should block the second one with a message.
- [ ] Refresh the page — all saved stops should re-appear exactly as you left them.

---

### 1.6 Waste Items CRUD

1. Go to **Waste Items**.
2. Add a new item: Name `Test Bottle`, Bin: `Recyclable`, any description.
3. Edit it, change the bin.
4. Delete it.

**Expected:** All three operations succeed with no console errors.

---

### 1.7 Reports — Change Status

1. Go to **Reports**. Pick any existing report (if none exist, skip to Part 2 and submit one as a resident first, then come back).
2. Change the status from **Pending → In Progress**. Save.

**Expected:**
- Row reflects the new status immediately.

3. Change it again: **In Progress → Resolved**. Save.

**Try to break it:**
- [ ] Try to go backwards (Resolved → Pending) — should be blocked (forward-only flow).

---

### 1.8 Analytics

1. Go to **Analytics**.

**Expected:**
- All charts render within 2 seconds.
- Numbers match the Reports table (rough sanity check).
- No red errors in the browser console.

---

## Part 2 — Resident Flow

**Open a fresh private / incognito tab** (so the admin session doesn't leak in). Go to the home page.

### 2.1 Landing page

1. The home page loads with the SugboClean branding.
2. Main call-to-actions are visible: Check Schedule, Report Missed Pickup, Track a Report, Waste Sorting Guide.

**Try to break it:**
- [ ] Visit on mobile width — nothing should be cut off or require horizontal scroll.

---

### 2.2 Schedule Checker

1. Click **Check Schedule** (or navigate to `/schedule`).
2. Pick `Test Barangay A — edited` from the dropdown.

**Expected:**
- Page shows the hauler (`Test Hauler 01`) with contact number.
- Pickup days list includes `Monday · Biodegradable · 8:00 AM – 11:00 AM` (the schedule you created in 1.5).
- Map shows the full route (4 or 3 pins depending on whether you deleted one, connected by a dashed line), centered on your test barangay.
- Clicking any pin opens a popup with the label, ETA (12-hour), and status.

**Try to break it:**
- [ ] Pick a barangay with no schedule / hauler → clear empty-state, no crash.

---

### 2.3 Report a Missed Pickup

1. Navigate to **Report Missed Pickup** (`/report`).
2. Fill the form:
   - Barangay: `Test Barangay A — edited`
   - Waste type: `Biodegradable`
   - Description: `Testing the report flow`
   - Photo: attach your sample JPG (optional)
3. Submit.

**Expected:**
- Success screen shows a report code in the format `SC-YYYY-NNNN` (e.g. `SC-2026-0042`).
- **Copy this code down** — you'll need it in the next step.

**Try to break it:**
- [ ] Submit with an empty description → should be blocked.
- [ ] Submit with a 10 MB photo → should either upload or fail cleanly, not crash.

---

### 2.4 Track a Report

1. Navigate to **Track Report** (`/track`).
2. Enter the `SC-YYYY-NNNN` code from 2.3.

**Expected:**
- Tracker shows the current status (should be **Pending** right after submission) with a visual stepper.
- Page does **not** require a refresh to update (it polls every ~10s).

3. **Cross-window test:** keep this resident tab open. In the **admin** tab (from Part 1), change this report's status from `Pending → In Progress`.
4. Switch back to the resident tab and wait up to 15 seconds.

**Expected:**
- The status updates to `In Progress` without you having to refresh.

**Try to break it:**
- [ ] Enter a code that doesn't exist (`SC-9999-9999`) → clear "not found" message, no crash.
- [ ] Enter a malformed code (`abc`) → input validation message.

---

### 2.5 Waste Sorting Guide

1. Open **Waste Sorting Guide** (`/waste-guide`).

**Expected:**
- Bins (Biodegradable / Recyclable / Residual / etc.) are color-coded and display their items.
- No broken images, no console errors.

---

## Part 3 — Cleanup (Admin)

After testing, clean up the test data so the database doesn't stay cluttered:

1. Admin → **Reports** → delete the test report you submitted in 2.3 (if your flow supports delete; otherwise leave it and note the code in your bug report).
2. Admin → **Schedules** / **Route Builder** → pick `Test Hauler 01` → delete all its route stops + schedules.
3. Admin → **Haulers** → delete `Test Hauler 01`.
4. Admin → **Barangays** → delete `Test Barangay A — edited`.

**Expected:**
- All deletes succeed; no leftover `(empty) (empty)` rows in the frontend lists (refresh to confirm).

---

## Part 4 — Mobile Pass (Optional but Recommended)

Repeat **Part 2 (resident flow only)** on a real phone (or DevTools device emulation — iPhone 12 / Pixel 5). Focus on:

- [ ] Can I read everything without pinch-zoom?
- [ ] Do forms, dropdowns, and the map work with touch?
- [ ] Are buttons large enough to tap accurately?

---

## How to Report Bugs

For each issue, fill out this template and send to the lead (Slack / email / whatever the team uses):

```
Title: <short, specific — e.g. "Route Builder: ETA shows 1970-01-01 after edit">

Severity: Blocker | High | Medium | Low | Nit
  Blocker = can't complete the flow at all
  High    = major function broken, workaround exists
  Medium  = visual / minor function bug
  Low     = polish, inconsistency
  Nit     = personal preference / small wording

Where: admin or resident, which page / URL

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
  - Relevant console errors (F12 → Console tab)
  - Relevant Network tab entries for failing calls (right-click → Copy → Copy as cURL is fine; redact any auth headers)
```

### Quick examples

**Good bug report:**
> **Title:** Route Builder: clicking ↑ on the first stop still fires a request
> **Severity:** Low
> **Where:** Admin, `/admin/schedules`, Route Builder sidebar
> **Steps:** 1. Open Route Builder with a hauler that has 3 stops. 2. Click the ↑ button on stop #1.
> **Expected:** Button is disabled or no-ops.
> **Actual:** Request fires and returns 400; toast shows "Reorder failed".
> **Environment:** Chrome 131 on Windows 11, desktop, 2026-04-17 14:20.

**Bad bug report:**
> "Schedules is broken" ← no steps, no severity, no expected/actual, impossible to act on.

---

*End of test plan. Ship your report back to the lead — small bugs count, don't filter them out.*
