# Phase 4 — Post-Launch Expansion

> **Goal of Phase 4:** SugboClean is live and the LGU sanitation office is using it daily. Phase 4 takes **real usage data from the pilot** and turns it into the next generation of features — the ones that make SugboClean indispensable, not just useful. Unlike Phases 1–3, Phase 4 is **demand-driven**: each milestone is gated by evidence the feature is needed.

**Prerequisite:** Phase 3 shipped to production, and the team has collected **at least 4 weeks of real usage data** from residents and admins. The Sentry + Plausible/Umami analytics from Milestone 3.8 are the source of truth for prioritization.

---

## Part A — Gating Discipline (Read This First)

Phase 4 is **not a checklist to build in order**. It's a menu. Build a milestone only when the metric below clears:

| Milestone                         | Gate (must be true before starting)                                                             |
| --------------------------------- | ----------------------------------------------------------------------------------------------- |
| 4.1 SMS notifications             | ≥ 20% of reports submitted without an email address (evidence residents can't get updates)      |
| 4.2 Barangay Captain dashboard    | ≥ 2 captains have formally requested scoped access                                              |
| 4.3 AI waste-sorting assistant    | ≥ 15% of WasteGuide searches return zero results (residents can't find what they're looking for)|
| 4.4 Hauler Driver mobile view     | LGU has signed data-sharing agreements with at least 1 hauler                                   |
| 4.5 Heatmap overlay               | ≥ 100 reports in the database (dataset big enough to be meaningful)                             |
| 4.6 Public accountability page    | LGU leadership has approved publishing aggregate stats                                          |
| 4.7 Weather / typhoon integration | At least one schedule-disrupting weather event occurred post-launch                             |

If the gate isn't met, **don't build it**. Feedback from real users beats any roadmap.

---

## Part B — Milestones (Menu, Not Sequence)

### Milestone 4.1 — SMS Notifications for Report Status & Reminders

**Problem:** Many Cebuano residents don't check email daily but almost everyone has SMS. The Phase 2 email reminder subscription leaves them out.

**Approach:** Integrate a Philippines-focused SMS provider (Semaphore is the typical choice for LGU apps — ₱0.50–0.80 per message, API is simple HTTPS POST). Avoid Twilio for domestic traffic unless budget allows; rates are significantly higher.

- [ ] **Extend the Report table** (ServiceNow):
  - Add `u_mobile_number` (String, 20) alongside `u_email`
- [ ] **Extend the Reminder Subscription table:**
  - Add `u_mobile_number` (String, 20)
  - Add `u_channel` (Choice: Email, SMS, Both) default Email
- [ ] **ServiceNow integration module:**
  - Store provider API key in `sys_properties` (not in fluent source)
  - Scheduled Job (daily at 5am PHT): for each active subscription with `u_channel` in (SMS, Both), send tomorrow's schedule
  - Business Rule on Report `u_status` change → if `u_mobile_number` present → trigger SMS send
- [ ] **Frontend changes:**
  - `MissedPickupForm`: add optional mobile number field with +63 prefix helper
  - `ReminderSignup`: channel selector (Email / SMS / Both)
  - Client-side validation: PH mobile format (09XX or +639XX, 11 digits)
- [ ] **Cost governance:**
  - Rate-limit: max 3 SMS per resident per 24 hours (prevent status-flipping spam)
  - Admin dashboard shows current month's SMS spend

**Acceptance:**
- Submit a report with a mobile number → status change triggers an SMS delivered within 2 minutes
- Subscribe for SMS reminders → morning schedule arrives the day before pickup

---

### Milestone 4.2 — Barangay Captain Scoped Dashboard

**Problem:** Barangay captains want visibility into *their* barangay's reports without being able to manipulate other barangays' data. A full admin account is overkill and risky.

- [ ] **ServiceNow side:**
  - Create a new role `x_1986056_sugbocle.barangay_captain`
  - Add `u_managed_barangay` (Reference → Barangay) to the `sys_user` table
  - ACL rules: a captain can READ reports only where `u_barangay = current.u_managed_barangay`; can UPDATE only `u_status`
- [ ] **Frontend:**
  - New route `/captain/dashboard` (guarded by the captain role, not admin)
  - Scoped reports table — pre-filtered to their barangay, filter controls for barangay are hidden
  - Scoped analytics — just their barangay's data
  - No access to Schedule / Hauler / Route Stop / Waste Item CRUD
- [ ] **Navigation:** after login, route to `/admin` for admins, `/captain` for captains, based on role claims in the OAuth token
- [ ] **Onboarding doc:** a short `docs/CAPTAIN_ONBOARDING.md` for the LGU to hand to new captains

**Acceptance:**
- Log in as a captain for Lahug → see only Lahug reports
- Try to PATCH a report for another barangay via curl with the captain's token → 403
- Captain dashboard has no CRUD buttons visible

---

### Milestone 4.3 — AI Waste-Sorting Assistant

**Problem:** The WasteGuide is a searchable list. Residents often don't know what category their item is — "Is a milk carton recyclable or residual?" Photo-based classification closes the gap.

**Approach:** Use an existing image classification API. Options (pick based on cost + latency + PH bandwidth):

- **Google Cloud Vision API** — `LABEL_DETECTION` → map labels to bin types
- **Azure AI Vision**
- **Self-hosted lightweight model** (MobileNet fine-tuned on waste categories) — cheaper long-term but requires ML ops

Recommendation for pilot: Cloud Vision + a rule-based label-to-bin mapping.

- [ ] **New endpoint (Scripted REST on ServiceNow):**
  - `POST /classify-waste` — receives a base64 image or image URL
  - Proxies to Vision API (API key in `sys_properties`)
  - Returns `{ bin_type, bin_color, confidence, suggested_items: [...] }`
- [ ] **Frontend component** in WasteGuidePage:
  - "Not sure? Take a photo" button
  - Opens camera (mobile: `<input type="file" accept="image/*" capture="environment">`)
  - Shows loading → result card with bin color tag + nearest matching waste items
  - "Was this helpful?" thumbs up/down → log to a feedback table to improve the mapping over time
- [ ] **Budget control:**
  - Cache identical images (hash → result) in a ServiceNow table for 30 days
  - Rate-limit per IP: 10 classifications per hour
- [ ] **Fallback UX:** if API fails or confidence < 60%, show "We couldn't identify this clearly. Try our search instead →"

**Acceptance:**
- Take a photo of a plastic bottle → classifier returns "Recyclable / Blue" with confidence > 80%
- Take a photo of a banana peel → "Biodegradable / Green"
- API down → graceful fallback, no crash

---

### Milestone 4.4 — Hauler Driver Mobile View

**Problem:** Drivers currently have no app-side role. Stop statuses (`u_stop_status`: Not Arrived / Current / Passed) are admin-updated, which is unrealistic. Drivers should tick them off themselves.

- [ ] **Role + auth:**
  - New role `x_1986056_sugbocle.hauler_driver`
  - Driver user accounts linked to a Hauler via a new `u_assigned_hauler` field on `sys_user`
  - ACL: drivers can UPDATE only `u_stop_status` on route stops where `u_hauler = current.u_assigned_hauler`
- [ ] **New frontend route** `/driver` — mobile-only layout (portrait, large tap targets, high contrast for outdoor use)
- [ ] **Driver screen:**
  - Today's route for their assigned hauler
  - Each stop as a card: barangay name, ETA, checkbox for "Arrived" → sets status to Current; "Completed" → Passed
  - Auto-advance: completing stop N sets stop N+1 to Current
  - Optional geolocation capture at each status change (stored for the LGU's audit, not shown to residents)
- [ ] **Optimistic UI** — tick marks feel instant even on slow PH mobile networks; retry queue for failed updates
- [ ] **Offline-first** — extends Phase 3 PWA work; driver can complete a whole route offline and sync later

**Acceptance:**
- Driver logs in on a phone → sees today's route for Cebu Green Haulers
- Taps "Arrived" on stop 2 → resident tracker for that barangay instantly shows "Truck arriving now"
- Lose signal → continue ticking stops → regain signal → updates push up in order

---

### Milestone 4.5 — Missed-Pickup Heatmap Overlay

**Problem:** The bar chart shows which barangays have the most reports, but not *where within* them. A heatmap layer on the route map reveals patterns — a specific street repeatedly missed, a corner the truck skips, etc.

- [ ] **Data capture enhancement:**
  - Add `u_report_latitude` + `u_report_longitude` to the Report table
  - MissedPickupForm: "Use my current location" button → `navigator.geolocation` → store coords with the report
  - Opt-in checkbox; default off for privacy
- [ ] **Leaflet heatmap plugin:** `npm i leaflet.heat`
- [ ] **New admin map view** at `/admin/map`:
  - Toggle-able layers: Routes, Reports (pins), Heat density
  - Time filter: last 7 / 30 / 90 days, all time
  - Waste-type filter
- [ ] **Privacy pass:**
  - Heatmap granularity capped (cluster radius ≥ 100m) so individual addresses aren't identifiable
  - Public-facing version (Milestone 4.6) further aggregates

**Acceptance:** Filter to "last 30 days, residual waste" → heatmap renders; zoom in → dense cluster in a specific block of Mabolo is clearly visible; admin can use this to plan an intervention.

---

### Milestone 4.6 — Public Accountability Page

**Problem:** The LGU wants to demonstrate that reports are actually being resolved. A public dashboard (no login required) showing aggregate stats builds trust.

- [ ] **New public route** `/stats`:
  - Total reports this month
  - Overall resolution rate (%) — big number
  - Median time-to-resolve — big number
  - Reports by barangay (bar chart)
  - Weekly trend (line chart, last 12 weeks)
  - Anonymized heatmap (if Milestone 4.5 shipped)
- [ ] **Data rules:**
  - No individual report codes shown
  - No email / mobile / photo / description visible
  - Only aggregate counts and percentages
  - Caching: 1-hour server-side cache, reduce API load
- [ ] **LGU review:** legal / comms team approves the page before launch
- [ ] **Shareable:** OG tags for social media previews, short URL `sugboclean.gov.ph/stats`

**Acceptance:** Open the URL in incognito → see stats, no login prompt, no PII visible; page loads under 2 seconds on 3G.

---

### Milestone 4.7 — Weather & Typhoon Integration

**Problem:** Cebu experiences typhoons. When PAGASA issues a signal, pickups often get cancelled or rescheduled, and residents currently find out by word of mouth.

- [ ] **PAGASA / weather provider integration:**
  - Scheduled Job (hourly): poll PAGASA API or OpenWeatherMap for Cebu City warnings
  - Store active warnings in a new `x_1986056_sugbocle_weather_alert` table
- [ ] **Frontend banner:**
  - Top-of-page red banner when an active warning exists ("Typhoon Signal #2 — check updated schedule")
  - Banner dismisses per-session but reappears on new visits while warning is active
- [ ] **Admin override:**
  - `/admin/weather` page: admins can manually cancel/reschedule today's pickups with one action
  - Bulk action: "Postpone all pickups in North District by 1 day"
  - Triggers SMS/email blast to affected subscribers (reuses Milestone 4.1)
- [ ] **Resident visibility:**
  - ScheduleChecker shows "⚠ Rescheduled due to weather" badges on affected days
  - Tracker shows delay notice on pending reports if weather-related

**Acceptance:**
- Manually insert a test weather alert → red banner appears on all pages
- Admin postpones all North District pickups → affected residents with SMS subscriptions receive a notification within 5 minutes
- ScheduleChecker reflects the new date

---

## Part C — Continuous Work (Not Milestones, but Always Active)

These happen in parallel with any Phase 4 milestones:

- [ ] **Monthly usage review:** team reads Plausible/Umami stats + Sentry error trends + resident feedback channels. Decides which Phase 4 gate has flipped.
- [ ] **Dependency updates:** monthly `npm audit` + `npm outdated`. Major version bumps on quiet weeks.
- [ ] **Accessibility regression sweep:** automated axe-core in CI; manual screen-reader test quarterly.
- [ ] **Content updates:** new barangays, new haulers, new waste item categories — CRUD work for the admin, no code changes.
- [ ] **User research:** one 30-min interview per month with a resident and with a sanitation admin. Write notes in `docs/feedback/`.
- [ ] **Cebuano copy review:** a native speaker reviews new strings before every release.

---

## Part D — Definition of Done (Per Milestone)

Each milestone has its own Acceptance block above. A milestone is **done** when:

1. All acceptance criteria pass
2. Monitoring (Sentry + analytics events) is wired for the new feature
3. The onboarding/help docs are updated where relevant (e.g., `docs/CAPTAIN_ONBOARDING.md` for 4.2)
4. The LGU point of contact has signed off
5. 2 weeks of production use with no rollback needed

---

## Part E — What Phase 4 Does **NOT** Include

- ❌ **Resident login / accounts** — still a deliberate product choice (low barrier to entry)
- ❌ **Two-way chat between residents and LGU** — creates expectations of staffing the LGU can't meet
- ❌ **Payment / billing** — SugboClean is not a transactional app; that's a separate product
- ❌ **Native iOS/Android apps** — the Phase 3 PWA is the mobile story
- ❌ **Expanding beyond Cebu City** — multi-tenancy is a product decision; deliberately out of scope
- ❌ **AI-generated admin summaries** — cute but unproven value; revisit only after real requests

---

## Part F — Risks & Watch-outs

| Risk                                                     | Mitigation                                                                                  |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| SMS costs spiral (Milestone 4.1)                         | Daily spend alert in admin dashboard; hard rate limits per user; monthly budget cap in the provider |
| Barangay captain accounts misused for political purposes | Audit log for every captain action; LGU owns account provisioning/revocation                |
| AI classifier shows inappropriate results                | Confidence threshold gate; manual feedback loop; never claim "definitive" classification    |
| Driver geolocation creates worker surveillance concerns  | Coords opt-in, aggregated only, retention policy ≤ 90 days; document in privacy policy      |
| Heatmap reveals resident addresses                       | Minimum 100m cluster radius; admin view only (public view even more aggregated)             |
| Public stats page weaponized politically                 | Only show aggregate operational metrics; no per-captain or per-hauler rankings              |
| Weather API rate limits or outages                       | Cache last-known state; degrade gracefully; admin can always override manually              |

---

## Part G — Exit Criteria for "SugboClean v1 Complete"

The product is considered v1-complete when **any four** of the Phase 4 milestones have shipped AND the following is true for 30 consecutive days:

1. ≥ 80% of missed-pickup reports resolved within 72 hours
2. ≥ 50 unique residents per week use the Schedule or Track features
3. < 1% of sessions encounter an uncaught error (Sentry)
4. The LGU sanitation office runs **their own** weekly metrics review using the admin analytics page, without engineering help
5. Zero P0/P1 bugs open

Once those are met, SugboClean transitions from "project" to "product" — further work becomes normal maintenance and user-requested enhancements, tracked per-ticket rather than per-phase.

---

_End of Phase 4 Post-Launch Expansion Plan_
