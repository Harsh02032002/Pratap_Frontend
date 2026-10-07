# RoomHy — Frontend

React 18 + Vite SPA for RoomHy, a PG / hostel / co-living management platform (India).
One codebase ships **three separate builds** to three domains, plus a fourth TanStack-based
admin sub-app mounted at `/admin`.

The backend is a **separate repo** (Express, default `http://localhost:5001`). This repo is
frontend only — there is no server code here except `src/admin/server.ts`.

---

## Commands

```bash
npm run dev                 # Vite dev server; proxies /api/* -> http://localhost:5001
npm run build               # default build -> dist/
npm run build:website       # -> dist/website/       (roomhy.com)
npm run build:superadmin    # -> dist/superadmin/    (admin.roomhy.com)
npm run build:propertyowner # -> dist/propertyowner/ (app.roomhy.com)
npm run build:all           # all three, sequentially
npm run lint                # eslint (only lints **/*.{ts,tsx} — .jsx is NOT linted)
npm run typecheck           # tsc --noEmit -p tsconfig.app.json
npm run preview
ANALYZE=1 npm run build     # rollup-plugin-visualizer bundle report
./deploy_server.sh          # VPS deploy: backs up, build:all, copies into /var/www/roomhy/*
```

There is **no test runner configured**. The only test file is `src/utils/imageCompression.test.mjs`
(run directly with `node`). Don't claim tests pass — verify by building or running the app.

Builds are memory-hungry: every build script sets `--max-old-space-size=8192`. Use the npm
scripts, not bare `vite build`.

---

## The three build targets

`vite.config.ts` reads `BUILD_TARGET` (falling back to `mode`) and, for each target,
picks an `outDir` **and** injects `<meta name="roomhy-app-target" content="…">` into
`index.html`. All three targets share the same entry (`index.html` → `src/main.jsx`) and the
same route table — the meta tag plus the hostname is what decides where `/` lands.

That routing decision lives in `resolveHostHome()` in [src/App.jsx](../src/App.jsx). It reads
the meta target, the hostname, and any stored session, then redirects `/` accordingly. When
adding a target, panel, or role, that function is the thing to update.

| Target | Domain | `/` resolves to |
|---|---|---|
| `website` | roomhy.com | public homepage |
| `superadmin` | admin.roomhy.com | `/superadmin/*` or `/employee/*` by role |
| `propertyowner` | app.roomhy.com | `/propertyowner/admin` or `/propertyowner/index` |

PWA (`vite-plugin-pwa`, `registerType: 'autoUpdate'`) is configured for the property-owner
app: `start_url: /propertyowner/admin`. `dev-dist/` holds the generated dev service worker —
it is build output that happens to be tracked; don't hand-edit it.

---

## Routing

[src/routes.jsx](../src/routes.jsx) is a **flat `[path, modulePath]` table**, not a nested
route tree. It resolves modules through `import.meta.glob("./pages/**/*.jsx")`, so:

- A page file that isn't listed in `routeEntries` is simply unreachable.
- A listed path with no matching file throws `Missing route module: …` at startup.
- Every `/superadmin/*` entry is **auto-mirrored to `/employee/*`** at the bottom of the file.
  Adding a superadmin route silently creates the employee twin; per-route access is then
  gated by `hasEmployeePermission()` in [src/utils/employeePermissions.js](../src/utils/employeePermissions.js).

Pages are lazy-loaded through `lazyWithRetry`, which reloads the page once (guarded by a
`sessionStorage` flag) when a chunk 404s after a deploy.

Route groups: `superadmin/` (162 pages), `propertyowner/` (137), `employee/` (36), `website/` (29),
`digital-checkin/` (18), `staff-panel/` (10), `owner-panel/` (9), `tenant/` (8), `manager/` (2).

---

## Auth — read this before touching any session code

Sessions are localStorage/sessionStorage-based, and the keys are deliberately split.
[src/utils/authScope.js](../src/utils/authScope.js) documents the rule and enforces it:

- **Panels** (`/superadmin`, `/employee`, `/propertyowner`, `/owner-panel`, `/staff-panel`,
  `/staff`, `/manager`, `/tenant`, `/admin`, `/digital-checkin`) store their JWT under `token`.
- **The public website** uses `website_token` / `website_user` and **must never fall back**
  to the panel `token`. Doing so authenticated website visitors as whoever last signed into
  a panel in that browser — that is the bug the split exists to prevent.
- Panels read `sessionStorage` before `localStorage`, so an owner and their staff can be
  signed in simultaneously in two tabs.
- Tokens matching `/^(demo|tenant|owner)_token_\d+$/` are **fabricated** leftovers from old
  client-side fallback logins; treat them as absent.
- The stored user object is attacker-controlled. **Roles for access decisions must come from
  the backend** (`GET /api/auth/me`), never from storage.

Role-specific session helpers, each reading its own keys: `ownerSession.js` (`owner_session`),
`staffAccess.js` (`staff_session`), `employeePermissions.js`, `websiteSession.js`.

---

## API layers

There are **three** overlapping HTTP layers. Match whatever the file you are editing already uses.

1. [src/utils/api.js](../src/utils/api.js) — the main one for pages. `fetchJson`, `getApiBase()`,
   attaches the *scoped* token via `getScopedAuthToken()`, and adds a 5-minute module-level
   response cache plus in-flight GET deduplication. Call `clearApiCache()` after any mutation
   whose result these caches would hide.
2. [src/services/api.js](../src/services/api.js) — `apiFetch` + grouped `authApi`-style
   objects. Reads the token from `localStorage.user.token` (not the scoped helper). Also
   exports `getFrontendUrl()` / `getPaymentGatewayUrl()` for absolute links in emails —
   the backend's `FRONTEND_URL` must match, or onboarding links break.
3. [src/api/](../src/api/) — React Query wrappers per domain (notifications, attendance,
   tasks, visitors, tenants, rooms, complaints, announcements). Newer code lives here.
   **All query keys are defined in [src/lib/queryKeys.js](../src/lib/queryKeys.js)** — no
   inline array keys anywhere else.

API base resolution: `VITE_API_URL` if set, else `http://<host>:5001` on localhost/LAN
hosts, else `window.location.origin`.

---

## Page conventions

Pages are `.jsx` (not TypeScript) and mostly follow one of two shapes:

- **Modern**: a normal React component using Tailwind classes and `lucide-react` icons,
  wrapped in a layout (`PropertyOwnerLayout`, `OwnerLayout`, `SharedShell`, `StaffLayout`).
  See [src/pages/propertyowner/tenants.jsx](../src/pages/propertyowner/tenants.jsx). Prefer this.
- **Legacy**: pages ported from static HTML that inject markup/head assets through
  [src/utils/htmlPage.js](../src/utils/htmlPage.js), `useHeadAssets`, `tailwindHelper`, and
  `legacyUi.js` (which sets `window.toggleSubmenu` / `window.toggleMobileMenu` globals).
  ~56 pages still do this. Don't introduce new ones; don't rewrite existing ones unasked.

Toasts use `react-hot-toast` (`<Toaster />` mounted in `App.jsx`) — not `alert()`.
The admin sub-app uses `sonner` instead.

---

## The `/admin` sub-app

[src/admin/](../src/admin/) is a **second, independent app**: TypeScript, TanStack Router
(file-based, `routeTree.gen.ts` is generated — don't hand-edit), TanStack Query, Radix +
shadcn-style components. Entry is `admin.html` → `src/admin/main.tsx`.

The `@` alias resolves to `src/admin` **only** — it is not a general `src` alias.

In dev, `adminServerPlugin` in `vite.config.ts` serves `admin.html` for `/admin*`.
In production, `vercel.json` rewrites `/admin` and `/admin/*` to `/admin.html`.
Note that `build.rollupOptions.input` lists only `index.html`, so `admin.html` is not
part of the default production build output.

---

## Gotchas

- **`drop_console: true`** in the terser config strips `console.log/info/debug/trace` from
  production builds. Don't rely on logging to diagnose a prod issue.
- `manualChunks` in `vite.config.ts` hand-partitions vendors; a new heavy dependency
  probably needs a line there or it lands in an existing chunk.
- `src/fix_layout*.js`, `modifyLayout.cjs`, `generate_*_pages.cjs`, `pristine-modals.jsx`
  are one-off codemod/scratch scripts, not application code.
- `dist/`, `node_modules/`, `.env` are gitignored; `dev-dist/` is not.
- ESLint only covers `.ts`/`.tsx`, so `npm run lint` says nothing about the ~500 `.jsx`
  files that make up most of the app.

---

## Working agreements

- **Never commit or push** unless explicitly asked — not even a backup commit.
- No Claude attribution in commit messages (no `Co-Authored-By`, no "Generated with").
- Commit messages describe the changes and end with a `Date:` line; stage only touched files.
# How to Respond

Always explain like you're talking to a 15 year old with no coding background.

For every response, include:
- **What I just did** — plain English, no jargon
- **What you need to do** — step by step, assume they've never seen this before
- **Why** — one sentence explaining what it does or why it matters
- **Next step** — one clear action
- **Errors** — if something went wrong, explain it simply and say exactly how to fix it
- **Context** — how to reduce context/usage on Claude Code, or anyways that we're leaking context. If we should restart a chat because the context is to full or irrelevant, tell me

When a task involves external tools or technical elements that a non-coder wouldn't know (Supabase, Vercel, Stripe, localhost:3000, etc.):
- Walk through exactly where to find what they need (e.g. "go to your Supabase dashboard → Settings → API")
- Describe what each key or setting does in one plain sentence
- If there's SQL to run, explain what it's doing before they run it
- If there's a bucket, folder, or config to create manually, explain what it is and why it exists
- Be as concise as possible. Do not ramble. Less is more

---

## Rules

**Rule 2: Challenge the direction**
Think critically about the direction we're heading. If you think this isn't the most optimized path for me to reach my goal in the shortest time, suggest a better alternative. Don't just execute — push back when there's a faster, smarter, or more effective way to get where I'm trying to go.

**Rule 3: 9/10 quality gate**
No content gets published or saved to Airtable until it scores a 9/10 or higher. Rate every piece of content honestly and neutrally — no inflating scores to move things along. If it's not a 9, say what's wrong and fix it before proceeding. A 10 only exists after the data comes back. Score based on: hook strength (specificity, numbers, tension), body structure (winning formula compliance), originality (would someone screenshot this?), and CTA clarity. Be direct about what's dragging the score down.

**Rule 4: Test before you respond**
After making any code changes, run the relevant tests or start the dev server to check for errors before responding. Never say "done" if the code is untested.

**Rule 5: Context**
Always find ways to reduce the context window usage or context across all files. If there's a way to keep things operating the same, but use less context, please optimize and let me know. Please remove ALL files that are redundant or unnecessary. Keep things as simple as possible.

**Rule 6: System upgrade suggestion**
At the END of every skill run, add one actionable improvement suggestion to `references/system-upgrades.md`. This should be something I'm not doing yet — a workflow gap, missed data opportunity, new automation idea, content repurposing angle, or anything else you noticed during the run. Be specific, not generic. This turns every skill run into a compounding improvement.
