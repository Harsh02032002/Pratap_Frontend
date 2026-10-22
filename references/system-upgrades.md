# System upgrades

- 2026-10-20 — Add a route-by-route role/ownership checklist to the backend repo's QA pass. QA-005 and QA-006 came from routes with `protect` but no `authorize`. A script that lists every route and its guards would catch these before release.

- 2026-10-22 — Add a pre-build secret scan over `public/` to the deploy script. SEC-02 shipped because Vite copies `public/` verbatim into every build, so anything dropped there is publicly downloadable with no code review gate. A `gitleaks detect --no-git public/` (or a grep for `password:`/`token`/`@gmail.com`) wired into `deploy_server.sh` before `build:all` would have blocked this release instead of relying on a human audit months later. Same scan should fail CI, not just warn.

- 2026-10-22 — Add an ESLint rule (or a grep in CI) that bans bare `fetch(` inside `src/pages/**`. API-05 existed because three HTTP layers coexist and raw `fetch` silently skips auth — nothing structurally prevents the next one. Allow `fetch` only in `src/utils/api.js` / `src/services/api.js` / `src/api/**`, and require pages to use `fetchJson` or pass `getAuthHeader()`. Note ESLint currently only lints `.ts`/`.tsx`, so this needs `--ext .jsx` added first, which would also surface the ~20 unused-import hints already sitting in these two files.
