# SugboClean — Development Rulebook

> **Purpose:** This document is the **strict rulebook** for any AI agent or developer working on SugboClean. It defines how we work, what we build, and what we refuse to do. Phase-specific requirements live in `docs/` — this file defines the standards those phases must be built to.

---

## 0. The Golden Rule

**`docs/` is the source of truth. Read it before you code.**

Before making any implementation decision, open the relevant file in `docs/`:

| Doc                              | When to read                                                    |
| -------------------------------- | --------------------------------------------------------------- |
| `docs/PHASE_1_DESIGN.md`         | Any UI / mock-data / visual-shell work                          |
| `docs/PHASE_2_BACKEND_INTEGRATION.md` | Wiring real ServiceNow APIs                                |
| `docs/PHASE_3_ADVANCED_FEATURES.md`   | Maps, analytics, real-time, auth hardening                 |
| `docs/PHASE_4_POST_LAUNCH_EXPANSION.md` | Scale, i18n, PWA, future work                            |
| `docs/RUNNING_THE_APP.md`        | Local dev setup, VS Code config, build/deploy                   |

If a phase doc contradicts this file, **the phase doc wins for that feature's scope**. If you believe a phase doc is wrong, flag it to the user — do not silently deviate.

---

## 1. Project Snapshot

- **App:** SugboClean — waste management web app for the Cebu LGU sanitation office
- **Frontend:** React 19 + ServiceNow NowSDK scaffold (`@servicenow/sdk` 4.5)
- **Backend:** ServiceNow scoped app `x_1986056_sugbocle` (instance `dev375738.service-now.com`)
- **Tagline:** *Keeping Sugbo clean, one pickup at a time.*
- **Two user types:** Residents (no login) and LGU Admins (login)

Feature-level product requirements are tracked in the phase docs, not here.

---

## 2. Actual Project Structure (Authoritative)

This is the **real** layout on disk. Do not invent new top-level folders.

```
sugbo-clean/
├── .claude/                  # Claude Code config — do not edit without user consent
├── docs/                     # ← Source of truth. Always read first.
├── src/
│   ├── client/               # React frontend (all UI code lives here)
│   │   ├── app.jsx           # Root component
│   │   ├── main.jsx          # React entry
│   │   ├── app.css
│   │   ├── index.html
│   │   ├── components/
│   │   │   ├── admin/        # Admin-only components (ReportsTable, FilterBar, MetricCard, …)
│   │   │   ├── layout/       # Shell: Sidebar, TopBar, AdminContainer
│   │   │   ├── shared/       # Cross-cutting primitives (StatusPill, …)
│   │   │   ├── tracker/      # Report tracker + stepper
│   │   │   └── *.jsx         # Top-level feature components (ResidentHub, SugboLanding, …)
│   │   └── services/         # API / service classes (IncidentService.js — being replaced)
│   ├── data/                 # In-memory stores & fixtures (reportStore, reports, status)
│   ├── pages/                # Page-level components (introduced with routing)
│   └── fluent/               # NowSDK ServiceNow definitions (tables, REST, notifications, jobs) — editable
├── now.config.json           # NowSDK app config
├── now.dev.mjs / now.prebuild.mjs  # NowSDK build hooks
└── package.json
```

### Folder rules

- **`src/client/components/`** — all reusable React components. Group by audience or role (`admin/`, `layout/`, `shared/`, `tracker/`). Create a new subfolder only when ≥ 3 components share a clear domain.
- **`src/client/services/`** — API wrappers and service classes. All HTTP calls go through here. Never call `fetch` from a component.
- **`src/data/`** — mock fixtures and in-memory pub/sub stores used while the real backend is stubbed.
- **`src/pages/`** — page-level components wired to routes. Keep pages thin: compose components, don't inline business logic.
- **`src/fluent/generated/`** — NowSDK-authored definitions for ServiceNow records (tables, scripted REST, notifications, scheduled jobs, etc.). **Editable** — hand-edit when the feature genuinely requires a backend change, and prefer editing an existing file over creating a parallel one. Never rename sys_ids or `$id` values. Treat this folder as part of the product, not as throwaway output.

---

## 3. Claude Agent — Rules of Engagement

### What the agent MUST do

1. **Read `docs/` first.** Identify the active phase and the feature's entry in that phase before writing code.
2. **Audit before acting.** Run `Glob` / `Grep` / `Read` to confirm what already exists. Do not assume file paths from memory.
3. **Reuse existing code.** If a component, hook, or helper already solves the problem, import it. Do not duplicate logic.
4. **Follow existing patterns.** Match the style of neighboring files (props shape, hook usage, CSS approach, error handling).
5. **Stay inside the declared scope.** If the task is "build the ReportTracker", do not refactor unrelated files.
6. **Ask before doing anything risky.** Deleting files, renaming folders, editing `.claude/` or `now.config.json`, or changing a sys_id / `$id` inside `src/fluent/generated/` — pause and confirm. Routine Fluent edits (schema tweaks, REST handlers, notifications, scheduled jobs) don't need confirmation.
7. **Report honestly.** If you couldn't test the UI, say so. If a step was skipped, say so. Never claim "done" for work that isn't verified.
8. **Keep responses tight.** Terse updates, no filler, no trailing summaries unless asked.

### What the agent MUST NOT do

1. **No inventing architecture.** Do not introduce Redux, Zustand, TanStack Query, styled-components, Next.js, or any major dependency without explicit user approval.
2. **No speculative abstractions.** No "BaseComponent", no "GenericForm", no factories "in case we need it later". Three similar lines beat a premature abstraction.
3. **No rewriting working code.** If a file works and matches the phase doc, leave it alone. Bug fixes are scoped to the bug.
4. **No backend-schema drift.** Never rename `u_*` fields, never change endpoint paths, never generate a new report code format. The ServiceNow contract is fixed.
5. **No credentials in code.** `REACT_APP_SN_PASSWORD` and similar must come from env, never hardcoded, never committed.
6. **No silent deletions.** Don't delete files, branches, or commits without the user's go-ahead — even legacy files like `IncidentForm.jsx` are removed only when the active phase plan says so.
7. **No unsolicited docs.** Don't create new `.md` files. Update `docs/` entries only when the user requests it.
8. **No mock-to-real shortcut.** Phase 1 uses mocks; Phase 2 wires real APIs through `services/api.js`. Don't mix the two inside one component.
9. **No `--no-verify`, no `--force` push, no `reset --hard`** without explicit instruction.
10. **No TODO graveyards.** Don't leave half-finished handlers, unused imports, or commented-out code in a "done" change.

---

## 4. Feature Development Workflow

Every feature — small or large — follows this loop:

1. **Locate the requirement.** Find the feature in the relevant `docs/PHASE_*.md`. If it isn't there, ask the user before proceeding.
2. **Read the surrounding code.** Open the files the feature touches. Note conventions (naming, prop shapes, CSS approach, service layer usage).
3. **Plan in one paragraph.** Before editing, state: the files you'll create/modify, the components/hooks you'll reuse, the data flow, and what you explicitly will *not* touch. Confirm with the user for anything non-trivial.
4. **Implement the minimum.** Write only what the phase doc demands. Resist "while I'm here" refactors.
5. **Wire through the service layer.** No component calls the API directly — it calls a function in `src/client/services/`.
6. **Verify.** Run the dev server (`npm run dev`), click through the golden path, and test one edge case. If you can't run it, say so.
7. **Clean up.** Remove unused imports, dead branches, console logs. Make sure ESLint is clean.
8. **Summarize in ≤ 2 sentences** when reporting back: what changed, what's next.

---

## 5. Coding Standards

### Naming

| Thing                  | Convention            | Example                                 |
| ---------------------- | --------------------- | --------------------------------------- |
| React components       | `PascalCase.jsx`      | `ScheduleChecker.jsx`                   |
| Hooks                  | `useCamelCase.js`     | `useReports.js`                         |
| Services / utils       | `camelCase.js` or `PascalCase.js` for classes | `api.js`, `IncidentService.js` |
| Constants              | `SCREAMING_SNAKE_CASE`| `API_BASE_URL`                          |
| CSS classes            | `kebab-case`          | `report-card`, `status-pill--pending`   |
| Env vars               | `REACT_APP_SCREAMING_SNAKE` | `REACT_APP_SN_INSTANCE`           |
| ServiceNow fields      | `u_snake_case` (fixed)| `u_report_code`, `u_barangay`           |

- Component file name = default export name. One component per file unless tightly coupled (e.g., `MetricsGrid` + local `MetricCard`).
- Boolean props / state: `isX`, `hasX`, `shouldX`.
- Event handlers: `handleX` (local), `onX` (prop).

### Components

- **Function components only.** No class components.
- **Keep components small.** A component over ~200 lines is a smell — split by responsibility.
- **Props over context.** Reach for Context only for truly cross-cutting state (auth, theme). Never for sibling data.
- **Derive, don't duplicate.** If state can be computed from existing state/props, compute it; don't store it.
- **Stable keys in lists.** Use `sys_id` or `report_code`, never array index.

### State and data flow

- **Local state first.** `useState` / `useReducer` inside the component that owns it.
- **Lift only when needed.** Move state up only when two siblings need it.
- **One source of truth per entity.** Reports come from `reportStore` (Phase 1) or the API layer (Phase 2) — not both in the same screen.
- **Async:** always `try / catch / finally`. Always set a loading flag. Always surface errors to the user (don't swallow).

### Styling

- Match existing CSS approach per component. If a sibling uses CSS Modules, follow suit; if inline, follow suit — but **don't mix styles within one component**.
- Design tokens (colors, spacing, status colors) belong in one shared file (`src/client/app.css` vars or `src/utils/constants.js`), not scattered.
- Mobile-first: layouts work on phone widths before desktop.

### Readability

- **Self-explanatory names beat comments.** A well-named function needs no docstring.
- **Comment only the *why*** — a non-obvious constraint, a workaround, a subtle invariant. Never narrate *what* the code does.
- **No dead code.** Delete it — git remembers.
- **Flat over nested.** Early returns beat deep `if` trees.

### Performance

- **`useMemo` / `useCallback` only when there's a real cost.** A cheap calculation inside a component does not need memoization. Memoize when: expensive computation, referential stability for a memoized child, or a dependency of another hook.
- **Avoid re-fetching on every render.** Effects must have correct dependency arrays. Debounce search inputs (≥ 300 ms).
- **List rendering:** virtualize only when a list can exceed ~200 items; otherwise keep it simple.
- **Bundle hygiene:** do not import whole libraries for one function (`import { debounce } from 'lodash'`, not `import _ from 'lodash'`).

### Security

- **Never hardcode credentials** — use `.env.local` (git-ignored). Reference via `process.env.REACT_APP_*`.
- **Escape user input in rendered HTML.** Never use `dangerouslySetInnerHTML` on resident/admin input.
- **Validate on the boundary.** Forms validate before submit; the API layer validates shape after response. Don't re-validate in the middle.
- **Do not log PII.** No emails, report codes, or descriptions to `console.log` in production paths.
- **CORS & auth headers** live in the service layer only. Never leak them into components or the DOM.

### Reusability & modularity

- **Three occurrences = extract.** Don't extract on the second; do extract on the third.
- **Shared primitives in `components/shared/`.** Domain-specific components stay in their audience folder (`admin/`, `tracker/`, etc.).
- **Services are thin.** Each function = one endpoint. No business logic in the service layer.
- **Hooks for reusable logic.** If two components share a fetch/loading/error pattern, that's a `useX` hook.

---

## 6. Backend Reference (Frozen Contract)

The backend is live and its schema is frozen. Do not modify. Use this as a quick reference; full field-by-field detail lives in `docs/PHASE_2_BACKEND_INTEGRATION.md`.

- **Base URL:** `https://dev375738.service-now.com/api/1986056/sugboclean_api`
- **Scope:** `x_1986056_sugbocle`
- **Auth (dev):** Basic Auth via env vars
- **Tables (7):** `barangay`, `hauler`, `schedule`, `report`, `route_stop`, `waste_item`, `reminder_subscription` (all prefixed `x_1986056_sugbocle_`)
- **Endpoints (25):** 8 resident, 17 admin. See phase doc for full list.
- **Report code format:** `SC-YYYY-NNNN` — **auto-generated server-side**. Never generate in the frontend.
- **Reference fields** store `sys_id` on write; GET responses include both raw `sys_id` and a display value.
- **Status flow:** Pending → In Progress → Resolved (forward only).

### Barangay schema additions

The `x_1986056_sugbocle_barangay` table now exposes geo fields used by the admin Route editor and Barangay manager:

| Field          | Type           | Notes                                        |
| -------------- | -------------- | -------------------------------------------- |
| `u_latitude`   | Floating Point | Decimal degrees; nullable until set in admin |
| `u_longitude`  | Floating Point | Decimal degrees; nullable until set in admin |

`GET /barangays` returns: `{ sys_id, name, zone, latitude, longitude }`.

### Barangay admin endpoints (new)

| Method | Path                       | Body                                              |
| ------ | -------------------------- | ------------------------------------------------- |
| POST   | `/barangays`               | `{ name, zone, latitude?, longitude? }`           |
| PUT    | `/barangays/{sys_id}`      | `{ name?, zone?, latitude?, longitude? }`         |
| DELETE | `/barangays/{sys_id}`      | —                                                 |

Wired in `src/services/api.js` via `barangayAPI = crud('barangays')`. Note the new `crud()` factory uses `PUT` for updates (the new convention); existing schedule/route-stop/hauler/waste-item updates remain on `PATCH` for backwards compatibility.

### Route-stop schema additions (2026-04-18)

The `x_1986056_sugbocle_route_stop` table now links stops to a specific schedule and derives ETAs from an offset rather than storing an absolute arrival time:

| Field                 | Type                                      | Notes                                                                                       |
| --------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------- |
| `u_schedule`          | Reference → `x_1986056_sugbocle_schedule` | Required on create. **Immutable on PUT** — to re-parent a stop, delete and recreate.        |
| `u_offset_minutes`    | Integer (nullable)                        | Minutes after `schedule.u_time_window_start`. Frontend derives ETA via `etaFromSchedule()`. |
| `u_estimated_arrival` | Glide Time                                | **Legacy / do not write.** Kept for backwards compatibility; frontend no longer sends it.   |

`u_barangay` on an existing `route_stop` is **immutable on PUT** as well (the scoped REST handler silently drops the field); use delete+create to move a stop between barangays.

ETA derivation is frontend-only via `etaFromSchedule(schedule.u_time_window_start, route_stop.u_offset_minutes)` in `src/utils/helpers.js` (wraps over midnight). This is the **single source of truth** for the ETA displayed in admin `RouteBuilder` pins, resident `ScheduleChecker` map popups, and sidebar stop lists — never duplicate this computation elsewhere.

`GET /route-stops` supports a `schedule` query param and returns stops with flattened reference fields via `normalizeRecord` (e.g. `schedule` display + `schedule_id` sys_id, same for `barangay` and `hauler`). `GET /schedules` was cleaned up 2026-04-18 and now returns the same `{value, display_value}` envelope for `barangay` and `hauler`, so the former name-matching fallback in `RouteBuilder.jsx` / `HaulerScheduleManager.jsx` has been removed.

### Service-layer pattern (required)

All HTTP calls go through `src/client/services/api.js` (to be created in Phase 2) using this shape:

```js
export const getBarangays = async () => {
  const res = await fetch(`${BASE_URL}/barangays`, { headers });
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  return res.json();
};
```

Components call these functions. They never call `fetch` directly.

---

## 7. Git & Commit Discipline

- **Small, focused commits.** One concern per commit. No "fix stuff" or "wip".
- **Commit message format:** `Feat: <what> | Fix: <what> | Refactor: <what> | Docs: <what>` — match existing style (see `git log`).
- **Never commit:** `.env.local`, credentials, `node_modules/`, large binaries, `dist/` contents.
- **Never force-push `main`.** Never `reset --hard` without explicit instruction.
- **Create commits only when the user asks.** Don't auto-commit after edits.

---

## 8. Tooling & Commands

From `package.json`:

```
npm run dev       # Start NowSDK dev server
npm run build     # Build via NowSDK
npm run deploy    # Install to ServiceNow instance (now-sdk install)
npm run transform # NowSDK transform
npm run types     # Regenerate NowSDK type dependencies
```

Setup and environment details: `docs/RUNNING_THE_APP.md`.

---

## 9. What SugboClean Is NOT

- Not a social network, messaging app, or payments platform
- Not a real-time GPS tracker (route map is static / pre-planned)
- No public user accounts for residents
- Not over-engineered — every feature should feel obvious to a first-time user

---

## 10. Quick Checklist (before you say "done")

- [ ] I read the relevant `docs/PHASE_*.md` entry
- [ ] I reused existing components/services instead of duplicating
- [ ] File names, component names, and CSS classes follow §5 conventions
- [ ] No `fetch`/`axios` call outside `src/client/services/`
- [ ] No hardcoded credentials, no PII in logs, no `dangerouslySetInnerHTML`
- [ ] ESLint is clean; no unused imports or dead code
- [ ] I ran `npm run dev` and clicked through the feature (or stated I couldn't)
- [ ] My change is scoped to the task; no drive-by refactors
- [ ] I did not touch `.claude/` or `now.config.json` without permission, and no sys_ids / `$id` values in `src/fluent/generated/` were renamed

---

*End of SugboClean Development Rulebook. Phase-specific requirements: see `docs/`.*

---

## 🧠 Second Brain (Read This First)

At the start of EVERY new session, before doing anything else:

1. Read the global vault instructions:
   C:\Users\Theo Cedric Chan\Documents\Obsidian Vault\Developer Vault\CLAUDE.md

2. Read the master project dashboard:
   C:\Users\Theo Cedric Chan\Documents\Obsidian Vault\Developer Vault\VAULT-INDEX.md

3. Read SugboClean-specific notes:
   C:\Users\Theo Cedric Chan\Documents\Obsidian Vault\Developer Vault\projects\sugboclean\index.md
   C:\Users\Theo Cedric Chan\Documents\Obsidian Vault\Developer Vault\projects\sugboclean\tasks.md

4. Confirm you read them by summarizing:
   - What SugboClean is (1 line)
   - Current phase / status
   - Top 2–3 pending tasks

Only after steps 1–4 ask me what to work on today.

## 📝 Vault Sync Rules (from global CLAUDE.md)

Keep the vault updated proactively — not just when asked:

- tasks.md → update as work progresses (move items Now → Done,
  log new blockers)
- decisions.md → append a dated entry for any architecture or
  tech decision made this session, using this format:

  ## YYYY-MM-DD — Short title
  **Decision:** what was chosen
  **Why:** reasoning / constraint
  **Alternatives considered:** what was rejected and why

- index.md → update if stack, phase, or project scope changes
- VAULT-INDEX.md → update the SugboClean status row if a
  milestone is hit
