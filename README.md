# Portfolio

Personal portfolio of Omogbolahan Ajibare. A Next.js site exported as static files, served by Cloudflare Workers Static Assets, with one small Hono Worker that handles only `/api/*`.

The architecture decision is in [docs/specs/0001-stack-architecture](docs/specs/0001-stack-architecture/index.md), and the plan is in [docs/scope/scope.md](docs/scope/scope.md).

## Requirements

- Node.js 24 (see `.node-version`)
- pnpm, through Corepack: `corepack enable pnpm`

## Commands

| Command | What it does |
|---|---|
| `pnpm dev` | Runs the site with `next dev` at http://localhost:3000 |
| `pnpm build` | Exports every page as static files into `out/` |
| `pnpm dev:api` | Runs `out/` plus the API Worker locally with Wrangler at http://localhost:8787 (build first) |
| `pnpm serve` | Builds, then runs the site and the Worker together: the full check before pushing |
| `pnpm typecheck` | Typechecks the site and the Worker |
| `pnpm lint` | Lints everything with ESLint (Next, TypeScript, and accessibility rules) |
| `pnpm format` / `pnpm format:check` | Formats with Prettier, or only checks the formatting |
| `pnpm test` | Runs the Vitest suite once |
| `pnpm cf-typegen` | Regenerates Worker binding types after editing `wrangler.jsonc` |
| `pnpm deploy:production` / `pnpm deploy:preview` | Deploys the production or preview Worker |

## Layout

- `app/`: Next.js App Router pages. Every route is generated at build time; nothing may need a server.
- `worker/`: the Hono API Worker (`worker/index.ts`), with its own `tsconfig.json`.
- `public/_headers`: security headers for every page.
- `wrangler.jsonc`: Worker config. Top level is production, `env.preview` is the preview Worker.
- `docs/`: scope and specs.

## Checks

- On every commit, a pre-commit hook (husky + lint-staged) lints and formats the staged files, then runs `pnpm typecheck`.
- On every push and pull request, GitHub Actions runs lint, format check, typecheck, tests, and the static build (`.github/workflows/ci.yml`). Workers Builds still does the deploys.

## Launch

The code is ready to go live. What is left needs your accounts, so it is a checklist rather than a script. Work top to bottom; each step names where its value goes. Feature 15 in the scope stays open until the last box is ticked.

**Domain and email**
- [ ] Buy the domain and point its nameservers to Cloudflare.
- [ ] Add a redirect rule from `www` to the bare domain (apex). This matters for analytics too: Umami records only the exact host in `NEXT_PUBLIC_SITE_URL`, so traffic served on `www` would vanish without an error.
- [ ] Turn on Email Routing with a public address (for example `hello@`), verify your inbox as a destination, and onboard the domain for Email Sending.

**Cloudflare resources**
- [ ] `wrangler d1 create portfolio-prod` and `wrangler d1 create portfolio-preview`, then put both ids in `wrangler.jsonc` in place of the `00000000-...` placeholders.
- [ ] Create the Turnstile widget with two hostnames: the apex and the preview `workers.dev` address.
- [ ] In `wrangler.jsonc`, replace every `example.invalid` value (`ALLOWED_ORIGINS`, `SITE_URL`, `NOTIFY_FROM`, in both environments) with the real addresses.
- [ ] Add the custom domain to the production Worker: `"routes": [{ "pattern": "<your domain>", "custom_domain": true }]` at the top level of `wrangler.jsonc`.
- [ ] Set the secrets for each environment: `wrangler secret put TURNSTILE_SECRET_KEY` and `wrangler secret put SENTRY_DSN` (repeat with `--env preview`).

**Workers Builds** (connect the GitHub repo first)
- [ ] Build variables per environment: `NEXT_PUBLIC_SITE_URL` (the apex with `https://`, or the preview address), `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `NEXT_PUBLIC_UMAMI_WEBSITE_ID`, `NOTIFY_TO`. Build secret: `SENTRY_AUTH_TOKEN`.
- [ ] Deploy commands: `pnpm deploy:production` for `main`, `pnpm deploy:preview` for other branches. The API token needs D1 edit permission so migrations can run.
- [ ] Deploy preview first and run the checks below on it, then deploy production.

**After the first production deploy**
- [ ] The site loads over HTTPS on the apex, and `www` redirects to it.
- [ ] `/robots.txt` lists the sitemap, `/sitemap.xml` lists every page with the real domain, and no page carries `noindex` except request details, the styleguide, and the 404 page.
- [ ] Share a page link in LinkedIn's Post Inspector and a messaging app; the social card shows.
- [ ] Send one message from `/contact` and one from a request page; both reach your inbox, and the confirmation shows on screen.
- [ ] Umami records a page view, then a lens visit, a case study read, and a CV download (check from a browser without Do Not Track).
- [ ] Workers observability: confirm which request fields Workers Logs and traces keep. If anything beyond the IP address shows up, update the "Errors and logs" part of `/privacy`.
- [ ] Run PageSpeed Insights (mobile) on home, `/work`, a case study, and `/contact`. Local Lighthouse runs swing too much on a laptop to judge speed; Cloudflare's edge, compression, and caching are part of the result.
- [ ] Send one request with a wrong `NOTIFY_FROM` on preview to see the Sentry alert once (spec 0005).
