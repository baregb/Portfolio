# Verify: Stack & architecture · spec 0001 · updated 2026-11-16
_Spec 0001 is a decision spec with no numbered acceptance criteria, so these steps come from the scope's **Done when** and the spec's **Rules the build must honour**. `/check verify` runs these; `/test` locks the durable ones._

## Commands
- [x] `pnpm install` on Node 24 → completes; the `workerd` and `esbuild` install scripts run → Done when (boots locally)
- [x] `pnpm typecheck` → the site and the Worker both pass → Done when (scaffold is sound)
- [x] `pnpm build` → every route is listed as `○ (Static)`; `out/` holds `index.html`, `404.html`, `_headers` → Done when (production build) · Rule (no route needs a server)
- [x] `pnpm dev` → http://localhost:3000 shows the "Omogbolahan Ajibare" heading → Done when (boots locally)
- [x] `pnpm serve`, then `curl -i localhost:8787/api/health` → 200, `{"ok":true,"environment":"production"}`, `Cache-Control: no-store`, plus the API security headers → Architecture (only `/api/*` runs the Worker)
- [x] `curl -i localhost:8787/api/nope` → 404 with a JSON body `{"error":"not_found"}` → Architecture (API errors are JSON)
- [x] `curl -I localhost:8787/` → 200 with `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy` from `public/_headers` → Security headers
- [x] `curl -i localhost:8787/missing` → status 404 with the 404 page → Hosting (`not_found_handling: "404-page"`)
- [x] `pnpm deploy:production --dry-run` → no warnings; `ENVIRONMENT` is `production` → Environments
- [x] `pnpm deploy:preview --dry-run` → no warnings; `ENVIRONMENT` is `preview` → Rule (preview never uses production bindings)

## Acceptance-criteria coverage
- Done when, "boots locally": install, typecheck, dev, serve steps
- Done when, "passes a production build": build step
- Rule, "no route may need a server": build step (all routes static)
- Security headers: page headers step, API health step
- Environments kept apart: both deploy dry run steps
