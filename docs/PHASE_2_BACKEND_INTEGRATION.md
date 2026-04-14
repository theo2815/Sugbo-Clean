# Phase 2 — Backend Integration (ServiceNow Wiring)

> **Goal of Phase 2:** Swap every mock in `src/services/api.js` for a real HTTP call to the SugboClean ServiceNow REST API at `https://dev375738.service-now.com/api/1986056/sugboclean_api`. Replace fake admin auth with Basic Auth credential capture. Handle the real response shapes (display values + `sys_id`s). Ship a fully functional, data-driven SugboClean.

**Prerequisite:** Phase 1 is complete and the DoD in `PHASE_1_DESIGN.md` §E is met. Specifically:

- Every page reads data only through `src/services/api.js`
- No component imports from `src/mocks/` directly
- `AuthContext` gates all `/admin/*` routes

If those two rules held, **Phase 2 should not touch any page component**.

---

## Part A — What Phase 2 Must Deliver

1. All 22 endpoints in CLAUDE.md §5 wired and callable from the frontend
2. Real Basic Auth for admin users (session-scoped, never committed)
3. The server-generated `SC-YYYY-NNNN` report code replaces the fake Phase-1 code generator
4. Admin status updates persist in ServiceNow (resident tracker reflects the change after refetch)
5. Missed-pickup photo uploads land in the `u_photo` field on the Report record
6. Reminder email subscriptions create rows in the Reminder Subscription table
7. Charts in AdminAnalyticsPage render against live report data, not mocks
8. Every network call is observable — request/response shape handling, error states, retry where appropriate
9. Environment variables drive the instance URL + credentials (no hardcoded secrets)

---

## Part B — Environment & Secrets Setup

### B.1 — Environment variables

Create `.env.local` at project root (already in `.gitignore`):

```env
VITE_SN_INSTANCE=https://dev375738.service-now.com
VITE_SN_API_BASE=/api/1986056/sugboclean_api
VITE_SN_USERNAME=admin
VITE_SN_PASSWORD=your_password_here
```

> Prefix is `VITE_` if the NowSDK bundler is Vite-based. Check `now.dev.mjs` — if it's webpack/CRA, use `REACT_APP_` instead. Adjust imports accordingly.

### B.2 — Constants module

In `src/utils/constants.js` add:

```javascript
export const API = {
  instance: import.meta.env.VITE_SN_INSTANCE,
  base: import.meta.env.VITE_SN_API_BASE,
  url: `${import.meta.env.VITE_SN_INSTANCE}${import.meta.env.VITE_SN_API_BASE}`,
};
```

### B.3 — ServiceNow CORS check

The CORS rule for `https://dev375738.service-now.com` is already configured. If running `npm run dev` on a different origin (e.g. a standalone Vite server on `http://localhost:5173`), an additional CORS rule must be added in ServiceNow for that origin. Ask the ServiceNow admin to add it, or use the NowSDK's built-in dev proxy (preferred).

---

## Part C — Milestone Breakdown

### Milestone 2.1 — Real HTTP Layer in `services/api.js` (Day 1)

**Outcome:** The stub file from Phase 1 becomes a real API client. Page components untouched.

- [ ] Replace the `delay()` stub helper with a real `request()` helper:

  ```javascript
  import { API } from '../utils/constants';
  import { getAuthHeader } from '../context/AuthContext';

  async function request(path, { method = 'GET', body } = {}) {
    const res = await fetch(`${API.url}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: getAuthHeader(),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new ApiError(res.status, err?.error?.message || res.statusText);
    }

    return res.json();
  }
  ```

- [ ] Implement each of the 22 endpoint functions from CLAUDE.md §5 on top of `request()`. Keep the **exact same function signatures** as Phase 1 stubs.
- [ ] Create a custom `ApiError` class with `status` + `message` for callers to branch on (401 → re-prompt login, 404 → not-found state, etc.)
- [ ] Delete `src/mocks/mockData.js` (or keep it gated behind `if (import.meta.env.DEV)` for Storybook/tests — team call)

**Acceptance:** Open the Network tab, click around every page, confirm real calls hit `/api/1986056/sugboclean_api/...` with the expected method + path + payload.

---

### Milestone 2.2 — Response Shape Alignment (Day 2)

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

- [ ] Add a `normalizeRecord()` helper in `src/services/api.js` that flattens `{ value, display_value }` into two fields: `barangay_id` and `barangay` (display). Apply to every GET response so pages can just render `report.barangay` and send `report.barangay_id` on update.
- [ ] Audit every page that reads a reference field. Pages that still use the old flat mock shape work unchanged. Pages that broke: fix them now.
- [ ] Key spots to re-verify:
  - ReportsTable — `report.barangay` rendering
  - ScheduleChecker — barangay dropdown uses `sys_id` as `<option value>`
  - RouteMapPage — hauler selector
  - All CRUD managers — form dropdowns for reference fields

**Acceptance:** No `[object Object]` appears anywhere in the UI. Reference fields render as human names and submit as `sys_id`s.

---

### Milestone 2.3 — Real Admin Authentication (Day 2)

**Outcome:** Admin login actually authenticates against ServiceNow. Bad credentials show an error.

- [ ] Rewrite `AuthContext`:
  - `login(username, password)` computes `Basic ${btoa(`${username}:${password}`)}`, then test-calls `GET /barangays` with that header. On 2xx → store header in memory + `sessionStorage`. On 401 → throw "Invalid credentials".
  - `getAuthHeader()` reads from memory / sessionStorage
  - `logout()` clears both
  - On app boot, hydrate from `sessionStorage` so an F5 doesn't kick the admin out
- [ ] `LoginPage` → call `login()`, surface the error from the 401 path
- [ ] `PrivateRoute` stays the same — it only reads `isAdmin`

**Security notes:**
- Never log the Authorization header (add a lint rule or code-review checklist)
- Session storage is cleared on tab close — acceptable for the pilot. For production, the LGU should move to OAuth
- The `.env.local` password is a **developer** credential, not end-user. Real admins type theirs into the LoginPage

**Acceptance:** Wrong password → inline error; correct password → redirect to dashboard; refresh → still logged in; close tab + reopen → logged out.

---

### Milestone 2.4 — Report Submission with Real Code Generation (Day 3)

**Outcome:** The server-generated `SC-YYYY-NNNN` code replaces the Phase-1 random one.

The Business Rule `Generate Report Code` on `x_1986056_sugbocle_report` auto-sets `u_report_code` on insert (see `src/fluent/generated/server-development/business-rule/sys_script_7ca7067893580310153ffdc9dd03d6bc.now.ts`). The REST endpoint's response includes it.

- [ ] Update `createReport()` to expect this response shape:
  ```json
  { "result": { "sys_id": "...", "report_code": "SC-2026-0042" } }
  ```
- [ ] `MissedPickupForm` success modal reads `report_code` from the real response (no more frontend generation)
- [ ] Remove the Phase-1 `generateReportCode()` helper from `utils/helpers.js`
- [ ] Edge case: if the server returns a `report_code` that's shorter/longer than expected, just display whatever came back — never truncate/reformat

**Acceptance:** Submit a real report → receive a server-issued code → fetch that code via `/track` → see the record the server created.

---

### Milestone 2.5 — Photo Upload (Day 3–4)

**Outcome:** Optional photos on missed-pickup reports land in the `u_photo` field.

ServiceNow attachments go to a separate endpoint: `/api/now/attachment/file`. Two-step flow:

1. Create the report via `POST /reports` → get `sys_id`
2. Upload the photo via `POST /api/now/attachment/file?table_name=x_1986056_sugbocle_report&table_sys_id={sys_id}&file_name=photo.jpg` with the raw file bytes and correct `Content-Type`

- [ ] Add `uploadReportPhoto(reportSysId, file)` to `services/api.js`
- [ ] In `MissedPickupForm`:
  - On submit: step 1 → step 2 (if photo present) → show success modal
  - Show a simple upload progress indicator
  - Max file size 5 MB; validate client-side; also handle the ServiceNow 413 response
  - Accept only image MIME types
- [ ] Display uploaded photo when admin views a report — use the attachment URL returned from ServiceNow

**Acceptance:** Submit a report with a JPG → open the report record in ServiceNow admin → confirm attachment is present.

---

### Milestone 2.6 — Admin Status Updates Persist (Day 4)

**Outcome:** Flipping Pending → In Progress → Resolved survives a page refresh.

- [ ] `updateReportStatus(sysId, status)` now hits `PATCH /reports/{sys_id}/status` with `{ "status": "In Progress" }`
- [ ] On success: re-fetch the report list OR optimistically update the local state (pick one and be consistent)
- [ ] Remove the Phase-1 pub/sub store — real refresh drives updates now. **However:** the resident tracker needs near-real-time updates. Use a polling strategy:
  - When the tracker page is open, poll `GET /reports/{report_code}` every 10s
  - Stop polling when the page unmounts
  - Show a subtle "Last updated 3s ago" indicator
- [ ] (Optional Phase 3 / 4) Replace polling with ServiceNow WebSockets if feasible

**Acceptance:** Admin changes status → resident tracker updates within ~10 seconds without a manual refresh.

---

### Milestone 2.7 — CRUD Managers Wired to Real API (Day 5)

**Outcome:** Schedule / Hauler / Route Stop / Waste Item CRUD actually persists.

- [ ] ScheduleManager → `createSchedule`, `updateSchedule`, `deleteSchedule`
- [ ] HaulerManager → `createHauler`, `updateHauler`, `deleteHauler`
- [ ] RouteStopManager → `createRouteStop`, `updateRouteStop`, `deleteRouteStop`
- [ ] WasteItemManager → `createWasteItem`, `updateWasteItem`, `deleteWasteItem`
- [ ] After every mutation: refetch the list (keeps the page simple; optimize later if slow)
- [ ] Confirmation dialog before DELETE (nondestructive UX)
- [ ] Form validation: required fields match CLAUDE.md §4 table schemas (max lengths, choice values)

**Acceptance:** Create a hauler in the admin UI → see it appear on the resident `/haulers` page after refresh → edit it → refresh → changes persist → delete it → gone.

---

### Milestone 2.8 — Reminder Subscription (Day 5)

**Outcome:** The subscribe form on the Schedule page creates a real Reminder Subscription record.

- [ ] `subscribeReminder(data)` calls `POST /reminders` with `{ email, barangay: sys_id }`
- [ ] Handle the two response shapes from CLAUDE.md §5:
  - 201 with `"Subscribed successfully"` → success toast
  - Duplicate case `"Already subscribed"` → info toast "You're already on the list"
- [ ] Email validation client-side

> Note: actually **sending** the reminder emails is a ServiceNow-side scheduled job, outside frontend scope. Confirm with the ServiceNow admin that the job is configured.

---

### Milestone 2.9 — Analytics on Live Data (Day 6)

**Outcome:** Bar / Pie / Line charts render against real reports.

- [ ] `AdminAnalyticsPage` calls `getAllReports()` (no filters, all statuses) on mount
- [ ] Transform into chart data client-side:
  - **Bar:** group by `barangay` display value → count
  - **Pie:** group by `waste_type` → count
  - **Line:** group by `sys_created_on` date (last 30 days) → two series (Filed vs Resolved)
- [ ] Date range picker now actually filters the client-side dataset (not a stub)
- [ ] Handle empty states: "No reports yet in this range"
- [ ] Optional: cache the full reports fetch for 60s to avoid hammering the API when the user changes ranges

---

### Milestone 2.10 — Error Handling & UX Polish (Day 7)

**Outcome:** Failures are graceful and informative, not blank screens.

- [ ] Centralized `useApi` hook wraps loading / error / data state for any async call. Every page uses it.
- [ ] 401 handling: if any call returns 401, trigger `logout()` and redirect to `/admin/login` with a "Session expired" flash
- [ ] 404 on `GET /reports/{code}` → Track page shows "No report found for that code"
- [ ] 500 / network errors → generic "Something went wrong, try again" toast + "Retry" button
- [ ] Loading skeletons on lists (not just spinners)
- [ ] Disable submit buttons while a POST/PATCH/PUT/DELETE is in flight
- [ ] Accessibility pass: error messages are in `aria-live` regions

---

## Part D — Testing the Integration

### D.1 — Manual smoke test script

Team member runs through this in order on a fresh `npm run dev`:

1. Go to `/schedule`, pick Lahug → real schedule loads
2. Go to `/report`, submit a missed pickup for Lahug on today's date → receive a real `SC-2026-XXXX`
3. Copy the code, go to `/track`, enter it → see Pending
4. Log in as admin at `/admin/login`
5. In ReportsTable, find the new report → change status to "In Progress"
6. Open the resident tracker in another tab → within 10s, status flips to "In Progress" (polling)
7. Change to "Resolved" → tracker flips again
8. Create a new hauler in HaulerManager → appears on resident `/haulers` page after refresh
9. Visit `/admin/analytics` → bar/pie/line charts all render with live counts
10. Log out → visiting `/admin/dashboard` redirects to login

### D.2 — Backend direct verification

Test the API layer independent of UI with curl:

```bash
curl -u admin:PASSWORD https://dev375738.service-now.com/api/1986056/sugboclean_api/barangays
```

Should return 8 barangays. If not, Phase 2 can't proceed — fix auth / CORS / instance first.

---

## Part E — Definition of Done

Phase 2 is done when:

1. All 10 manual smoke-test steps in D.1 pass
2. `.env.local` is the only place the instance password appears (grep confirms)
3. `src/mocks/` is gone or gated for tests only
4. The browser Network tab shows one real call per user action, no mocks
5. 401 / 404 / 500 each have a distinct, user-friendly UX path
6. Photo upload round-trips (submit a JPG, view the attachment in ServiceNow)
7. Admin status changes propagate to the tracker within 10 seconds
8. No page component imports from `mocks/` or `data/`
9. `npm run build` succeeds with zero warnings from our code

---

## Part F — What Phase 2 Does **NOT** Include**

- ❌ OAuth / SSO for admins — still Basic Auth (Phase 3 security hardening)
- ❌ Real Leaflet map with live truck GPS — still static route stops (Phase 3)
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
| Reference field shape breaks UI            | `normalizeRecord()` helper + a runtime assertion in dev mode                                  |
| Password leaks into git                    | `.gitignore` covers `.env.local`; add a pre-commit hook that greps for `VITE_SN_PASSWORD=`    |
| 401s on long sessions                      | On 401 → `logout()` + redirect flow already handles it; never loop on refresh                 |
| Attachment uploads exceed 5 MB             | Client-side size check + show clear error; server also enforces                                |
| CRUD forms send wrong field names          | Add a lightweight request schema check in `services/api.js` before POST/PUT                   |

---

## Part H — Handoff to Phase 3

Phase 3 scope after this ships:

- Real Leaflet map on `/route-map`
- WebSocket / Server-Sent Events for status updates (replace polling)
- OAuth for admins
- Bilingual support (Cebuano / English)
- Offline caching of schedule data (PWA)

But **none of those are blockers for the pilot launch.** Phase 2 completion = SugboClean is usable by real Cebu residents and sanitation admins.

---

_End of Phase 2 Backend Integration Plan_
