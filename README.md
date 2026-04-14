# SugboClean

> _Keeping Sugbo clean, one pickup at a time._

**SugboClean** is a waste management and sanitation web application built for the Local Government Unit (LGU) sanitation office in Cebu, Philippines. It connects ordinary Cebuano residents with the sanitation office through a simple, purpose-built tool — no accounts required for residents, admin login for LGU staff.

"Sugbo" is the ancient name for Cebu.

---

## What it does

### For residents (no login required)

- 📅 **Check your pickup schedule** — select your barangay, see when the truck comes and what type of waste is collected each day
- ⚠️ **Report a missed collection** — submit a simple form, get a unique tracking code (`SC-YYYY-NNNN`)
- 🔍 **Track your report** — enter your code, see real-time status updates (Pending → In Progress → Resolved)
- ♻️ **Waste sorting guide** — searchable reference with color-coded bins (🟢 Biodegradable, 🔵 Recyclable, ⚫ Residual, 🔴 Hazardous)
- 🚚 **Find haulers** — contact info and coverage areas for every contracted garbage hauler
- 🗺️ **View collection routes** — interactive map showing the truck's path with numbered stops
- 📧 **Subscribe to reminders** — get day-before pickup reminders via email

### For LGU admins (login required)

- 📋 **Review and resolve reports** — filterable dashboard of every submitted report
- 🔄 **Update report status** — changes propagate to residents' trackers in real time
- 🏗️ **Manage schedules, haulers, routes, and waste items** — full CRUD operations
- 📊 **Analytics** — bar / pie / line charts showing reports by barangay, waste type, and trends over time

---

## Tech stack

| Layer             | Technology                                                  |
| ----------------- | ----------------------------------------------------------- |
| Frontend          | React 19                                                    |
| Routing           | React Router                                                |
| Styling           | CSS (design tokens in `src/utils/constants.js`)             |
| Backend platform  | ServiceNow (`x_1986056_sugbocle` scoped application)        |
| API               | Scripted REST API — 22 endpoints                            |
| Build / deploy    | ServiceNow NowSDK (`@servicenow/sdk`)                       |
| Maps (Phase 3)    | Leaflet + OpenStreetMap                                     |
| Charts            | Recharts                                                    |

---

## Project structure

```
sugbo-clean/
├── src/
│   ├── client/              # React frontend
│   │   ├── app.jsx
│   │   ├── main.jsx
│   │   ├── app.css
│   │   ├── components/
│   │   │   ├── admin/       # Admin-only components
│   │   │   ├── layout/      # Admin shell (Sidebar, TopBar)
│   │   │   ├── resident/    # Resident-only components
│   │   │   ├── shared/      # Shared primitives (Button, StatusPill, etc.)
│   │   │   └── tracker/     # Report tracker + StatusStepper
│   │   └── services/        # API client
│   ├── pages/               # Route-level page components
│   ├── mocks/               # Phase 1 mock data (removed in Phase 2)
│   ├── services/            # Stubbed / real API layer
│   ├── context/             # AuthContext
│   ├── utils/               # Design tokens, helpers
│   ├── data/                # Legacy — being migrated to src/mocks/
│   └── fluent/              # ServiceNow backend (tables, REST API, business rules)
├── docs/
│   ├── RUNNING_THE_APP.md
│   ├── PHASE_1_DESIGN.md
│   ├── PHASE_2_BACKEND_INTEGRATION.md
│   ├── PHASE_3_ADVANCED_FEATURES.md
│   └── PHASE_4_POST_LAUNCH_EXPANSION.md
├── CLAUDE.md                # Complete development context (schema, API, features)
├── README.md
├── package.json
└── now.config.json
```

---

## Getting started

See [`docs/RUNNING_THE_APP.md`](./docs/RUNNING_THE_APP.md) for the full setup walkthrough. Quick version:

```bash
# 1. Clone
git clone https://github.com/theo2815/Sugbo-Clean.git
cd Sugbo-Clean

# 2. Install dependencies
npm install

# 3. Authenticate with the ServiceNow instance (first time only)
npx now-sdk auth --add https://dev375738.service-now.com --type basic --alias sugbo
npx now-sdk auth --use sugbo

# 4. Run
npm run dev
```

> **Note:** SugboClean is a ServiceNow NowSDK app — `npm run dev` syncs your code to a ServiceNow instance (`https://dev375738.service-now.com`) rather than running on `localhost:3000`.

### Scripts

| Command             | What it does                                            |
| ------------------- | ------------------------------------------------------- |
| `npm run dev`       | Watch & sync source to the ServiceNow instance          |
| `npm run build`     | Bundle the app                                          |
| `npm run deploy`    | Full install to the instance                            |
| `npm run types`     | Regenerate TypeScript typings from ServiceNow metadata  |
| `npm run transform` | Transform source files via NowSDK                       |

---

## Architecture overview

### Backend — ServiceNow

SugboClean runs on a scoped ServiceNow application (`x_1986056_sugbocle`). The backend consists of:

- **7 custom tables** — Barangay, Hauler, Schedule, Report, Route Stop, Waste Item, Reminder Subscription
- **1 Scripted REST API** — `SugboClean API` with 22 endpoints under `/api/1986056/sugboclean_api/...`
- **1 Business Rule** — `Generate Report Code`, auto-generates `SC-YYYY-NNNN` codes on report insert

All field definitions, API routes, and business rules live under [`src/fluent/generated/`](./src/fluent/generated/) and are deployed via NowSDK.

### Frontend — React

The frontend is intentionally simple:

- **Residents** never log in; they just use the app
- **Admins** log in with ServiceNow credentials (Basic Auth during pilot, OAuth planned for Phase 3)
- **All data flows through `src/services/api.js`** — a single module that hides ServiceNow REST calls behind clean function names (`getBarangays`, `createReport`, `updateReportStatus`, …)

See [`CLAUDE.md`](./CLAUDE.md) for the complete schema, endpoint list, and request/response examples.

---

## Development phases

SugboClean is being built in four planned phases:

| Phase       | Focus                                     | Doc                                                                |
| ----------- | ----------------------------------------- | ------------------------------------------------------------------ |
| **Phase 1** | Design & UI with mock data                | [`docs/PHASE_1_DESIGN.md`](./docs/PHASE_1_DESIGN.md)                |
| **Phase 2** | ServiceNow backend integration            | [`docs/PHASE_2_BACKEND_INTEGRATION.md`](./docs/PHASE_2_BACKEND_INTEGRATION.md) |
| **Phase 3** | Leaflet map, real-time, OAuth, PWA, i18n  | [`docs/PHASE_3_ADVANCED_FEATURES.md`](./docs/PHASE_3_ADVANCED_FEATURES.md)     |
| **Phase 4** | Post-launch expansion (SMS, AI, more)     | [`docs/PHASE_4_POST_LAUNCH_EXPANSION.md`](./docs/PHASE_4_POST_LAUNCH_EXPANSION.md) |

Phases 1–3 are the pilot launch path. Phase 4 is evidence-gated — milestones ship only when real usage data justifies them.

---

## Design principles

1. **Mobile-first** — most residents will use phones
2. **Simple and fast** — residents just want quick info with minimal clicks
3. **Bilingual-ready** — Cebuano / English support planned for Phase 3
4. **Accessible** — high contrast, large tap targets, WCAG AA
5. **Offline-friendly** — schedule caching planned for Phase 3 PWA
6. **No resident accounts** — zero barrier to entry, always

---

## What SugboClean is **not**

- ❌ Not a social media app
- ❌ Not a payment or billing platform
- ❌ Not a real-time GPS truck tracker (routes are pre-planned and static)
- ❌ Not a messaging system between residents and LGU
- ❌ No resident logins, ever

These non-goals are intentional product decisions. See [`CLAUDE.md §9`](./CLAUDE.md).

---

## Contributing

SugboClean is currently developed by a small team for the Cebu LGU. If you're a team member:

1. Read [`CLAUDE.md`](./CLAUDE.md) for full project context (schema, API, features)
2. Follow [`docs/RUNNING_THE_APP.md`](./docs/RUNNING_THE_APP.md) to get a local environment running
3. Check the current phase doc in `docs/` to see what's being built and how
4. Create a feature branch, open a pull request, request review

External contributions are not being accepted at this stage of the pilot.

---

## License

UNLICENSED — this is a private project for the Cebu LGU sanitation office. All rights reserved.

---

## Credits

Built for the **Local Government Unit of Cebu City** sanitation office.
Powered by **ServiceNow**.
Designed with ❤️ for Cebuano residents.

---

_Keeping Sugbo clean, one pickup at a time._
