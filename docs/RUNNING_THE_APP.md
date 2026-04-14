# Running SugboClean Locally (VS Code)

This guide walks you through getting the SugboClean ServiceNow app running on your machine using VS Code.

> **Note:** SugboClean is built on the ServiceNow NowSDK. It does **not** run on `localhost:3000` like a typical React app — instead, the CLI syncs your code to a shared ServiceNow instance (`https://dev375738.service-now.com`), and you test the app there.

---

## 1. Prerequisites

Install the following before starting:

- **Node.js 18+ and npm** → <https://nodejs.org>
- **Git** → <https://git-scm.com>
- **VS Code** → <https://code.visualstudio.com>
- **ServiceNow admin credentials** for the `dev375738` instance (ask the project lead)

Verify your versions:

```bash
node --version
npm --version
git --version
```

---

## 2. Clone the Repository

Open a terminal (or VS Code → `Terminal → New Terminal`) and run:

```bash
git clone https://github.com/theo2815/Sugbo-Clean.git
cd Sugbo-Clean
```

Then open the folder in VS Code:

```bash
code .
```

---

## 3. Install Dependencies

In the VS Code integrated terminal (``Ctrl + ` ``), from the project root:

```bash
npm install
```

You may see deprecation warnings — those are safe to ignore. A successful install ends with something like `added 585 packages`.

---

## 4. Authenticate with the ServiceNow Instance

The NowSDK CLI needs credentials before it can sync code to the instance.

### 4a. Add your credentials

```bash
npx now-sdk auth --add https://dev375738.service-now.com --type basic --alias sugbo
```

You'll be prompted interactively:

- **Username:** `admin`
- **Password:** (the shared ServiceNow admin password — ask the project lead)

### 4b. Set it as the default credential

```bash
npx now-sdk auth --use sugbo
```

### 4c. Verify it worked

```bash
npx now-sdk auth --list
```

You should see `sugbo` listed with a `*` marking it as default.

---

## 5. Run the App in Dev Mode

```bash
npm run dev
```

This starts the NowSDK dev watcher. It will:

1. Build the app
2. Push it to `https://dev375738.service-now.com`
3. Watch `src/` for changes and auto-sync them to the instance

Leave this terminal running while you develop.

---

## 6. Open the App in Your Browser

Once the dev watcher finishes its first sync, open:

```
https://dev375738.service-now.com
```

Log in with the same admin credentials. You can access SugboClean UI pages and REST endpoints from here.

### Quick backend sanity check

In a second terminal, test that the REST API is live:

```bash
curl -u admin:YOUR_PASSWORD https://dev375738.service-now.com/api/1986056/sugboclean_api/barangays
```

You should get JSON with the 8 seeded barangays (Lahug, Mabolo, etc.).

---

## 7. Other Useful Scripts

| Command           | What it does                                                     |
| ----------------- | ---------------------------------------------------------------- |
| `npm run build`   | Bundles the app without deploying                                |
| `npm run deploy`  | Full install to the ServiceNow instance                          |
| `npm run types`   | Regenerates TypeScript typings under `@types/servicenow/fluent/` |
| `npm run transform` | Transforms source files via NowSDK                             |

Run `npm run types` after anyone pulls changes that add new tables, fields, or REST endpoints.

---

## 8. Recommended VS Code Extensions

- **ESLint** (`dbaeumer.vscode-eslint`)
- **Prettier** (`esbenp.prettier-vscode`)
- **ES7+ React/Redux/React-Native snippets** (`dsznajder.es7-react-js-snippets`)
- **GitLens** (`eamodio.gitlens`)

---

## 9. Common Issues

### `Default Credential has not been set`

You skipped step **4b**. Run:

```bash
npx now-sdk auth --use sugbo
```

### `No credentials found`

You skipped step **4a**. Go back and add credentials.

### `401 Unauthorized` when calling the API

Your stored password is wrong or the instance password was rotated. Re-add:

```bash
npx now-sdk auth --delete sugbo
npx now-sdk auth --add https://dev375738.service-now.com --type basic --alias sugbo
npx now-sdk auth --use sugbo
```

### CORS errors in the browser

The instance has a CORS rule for `https://dev375738.service-now.com`. If you're hitting the API from another origin (e.g., a separate localhost frontend), ask the project lead to add a CORS rule for your origin.

### `EADDRINUSE` or port conflicts

Kill any stray node processes:

```bash
# Windows
taskkill /F /IM node.exe
```

---

## 10. Project Reference

For feature specs, database schema, and REST API details, see the root-level [`CLAUDE.md`](../CLAUDE.md).

---

_Questions? Ping the project lead in the team chat._
