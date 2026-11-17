# 0001. Build the portfolio as a static Next.js export with one small API Worker on Cloudflare

**Date**: 2026-11-16
**Status**: In Progress

## Summary

Your portfolio is a Next.js site, written in TypeScript and styled with Tailwind, exported at build time as plain files from Markdown in the repo. Cloudflare serves those files straight from its global network, so pages load instantly and keep working even if any code fails. One small Worker (a little server program on Cloudflare) handles only the `/api` paths: the two forms now, the AI chat later. Cloudflare also gives you DNS, bot protection, a tiny database for form messages, and email notifications to you; Umami counts visits without cookies and Sentry alerts you to errors. Everything starts on free plans.

## Decision

**Chosen option**: Option 1: Next.js 16 static export served by Cloudflare Workers Static Assets, plus one Hono API Worker in the same project, with typed MDX content in the repo and D1 for form submissions.

Pages are generated once at build time and served as files; only requests to `/api/*` run code. This replaces the earlier OpenNext draft after the cross check showed OpenNext routes every page through the Worker.

**Implementation skills**: `wrangler`, `workers-best-practices`, `workers-development`, `cloudflare`, `cloudflare-email-service`, `turnstile-spin`, `web-perf` (`cloudflare/skills`, `.agents/skills/<name>/`) · `sentry-get-started`, `sentry-instrument`, `sentry-fix-stack-traces`, `sentry-debug-issue` (`getsentry/sentry-for-ai`, `.agents/skills/<name>/`) · `tailwind-4-docs` (`lombiq/tailwind-agent-skills`, `.agents/skills/tailwind-4-docs/`)

The installed `nextjs-on-cloudflare` skill covers running a Next.js server on Workers (vinext or OpenNext), which this design no longer does. Do not follow it for this project.

## Proposed stack

| Layer | Choice | Reason |
|---|---|---|
| Architecture pattern | One repo, one Cloudflare Worker project: static files for every page, a Worker only for `/api/*` | Pages never depend on runtime code; the Worker's job is small and testable. |
| Language | TypeScript, strict mode, in both the site and the Worker | Your standard; content schema mistakes fail the build. |
| Runtime for local dev and builds | Node.js 24 LTS, pinned with `.node-version` and `engines` in `package.json` | Current long term support line; Workers Builds otherwise defaults to an older Node. |
| Package manager | pnpm | Your pick. |
| Site framework | Next.js 16 App Router with `output: 'export'` | Your daily stack and what target jobs ask for; static export gives pure files with no adapter. |
| Rendering | Every route generated at build: `generateStaticParams` on dynamic routes with `dynamicParams = false`; no server actions, no cookies or headers reads, no ISR | Static export rejects anything that needs a server, so the build itself enforces "no page renders on demand". |
| API layer | A Hono app as the Worker entry (`worker/index.ts`), routes under `/api/*` | Tiny, typed, built for Workers; the forms now and the AI chat later live here. |
| Content | MDX files in `content/`, loaded and schema checked at build by Content Collections | Versioned with the code; compiled during the build, never evaluated on Workers. |
| Styling | Tailwind CSS v4 | Your standard; design system tokens map into its theme. |
| Images | Sources in `content/images/`; a build script (sharp) writes AVIF and WebP at widths 640, 960, 1280, 1920 into `public/img/`; a small picture component picks the size; Next image optimisation off (`images.unoptimized`) | Every image is known in advance; nothing is resized or metered at runtime. |
| Social card images | Generated at build by a Node script (satori plus resvg) into `public/og/`, 1200 by 630 | Keeps image rendering code out of the Worker entirely. |
| Primary database | Cloudflare D1: `portfolio-prod` and `portfolio-preview` | Holds only what visitors create; relational records in a relational store. |
| Database access | Drizzle ORM in the Worker; drizzle-kit generates SQL migrations into `drizzle/migrations/`, which Wrangler applies (`migrations_dir`) | Typed schema, first class D1 support, plain SQL files in the repo. |
| Auth | None at launch | No signed in surface until the content admin, decided in its own spec. |
| Email | Cloudflare Email Service `send_email` binding locked with `destination_address` to your verified inbox, sent from an address on your domain; a public address (for example `hello@`) forwarded by Email Routing | Free on the Workers free plan for verified addresses; only you receive email, visitors see an on screen confirmation. |
| Bot protection | Turnstile verified in the Worker, a hidden honeypot field, an `Origin` check against the site address, and the Workers rate limiting binding | Free and native; layered so one weak layer is not the only defence. |
| Hosting | Cloudflare Workers free plan: Static Assets serve `out/`, `run_worker_first: ["/api/*"]` so only API calls invoke the Worker | Static asset requests are free and do not count against Worker limits. Move to Workers Paid ($5/month) only if the API Worker needs it. |
| Environments | Production Worker `portfolio` on your domain; a separate preview Worker `portfolio-preview` (Wrangler `env.preview`) on its `workers.dev` address with its own D1 and secrets | Workers Builds branch previews share production bindings, so a separate preview Worker is the only clean way to keep test data apart. |
| Deploys | Cloudflare Workers Builds from GitHub: `main` runs the production deploy command; every other branch runs the preview deploy command | No CI config to maintain. |
| Source control | Public GitHub repo `baregb/portfolio`, personal identity | The code and specs are proof of how you work. |
| Domain and DNS | A personal domain from a registrar of your choice, nameservers on Cloudflare; the bare domain (apex) is canonical; `www` redirects to it with a Cloudflare redirect rule | One canonical address for SEO and Turnstile. |
| Security headers | `public/_headers` (served by Static Assets) for pages; the Worker sets the same headers on API responses | One file you can read in the repo. |
| Analytics | Umami Cloud free plan, cookieless | Custom events for CV downloads, lens visits, case study reads, no cookie banner. Note its free data retention limit. |
| Observability | Sentry free plan in the Worker only (`@sentry/cloudflare`, `withSentry`), plus Workers logs; no browser SDK at launch | The Worker is the only runtime code; skipping the browser SDK keeps about 40 KB off every page. |
| Later: AI chat | A `/api/chat` route in the same Worker; provider, grounding, and cost cap decided in the Ask AI spec (feature 16) | The build can emit a content index for grounding; watch the Worker size limit. |
| Later: content admin | A git based editor that commits MDX to GitHub, triggering a rebuild; decided in the content admin spec (feature 18) | Content is baked at build, so publishing means commit then build (a few minutes), and preview means a preview deploy. Never runtime MDX. |

**Data sketch** (the target the contact and request access specs refine; they own the final fields):
- One table, `submission`: `id` (text, primary key), `kind` (`contact` or `request`, required), `name` (required), `email` (required), `message` (nullable), `project_slug` (nullable, required when `kind` is `request`), `created_at` (required), `notified_at` (nullable, set once the email is sent). Index on `created_at`. No IP addresses stored.

**Wrangler configuration** (one `wrangler.jsonc`, top level is production, `env.preview` overrides):

| Setting | Production | Preview |
|---|---|---|
| `name` | `portfolio` | `portfolio-preview` |
| `main` | `worker/index.ts` | same |
| `compatibility_date` | the scaffold date | same |
| `compatibility_flags` | `nodejs_compat` (needed by the Sentry SDK) | same |
| `assets` | `directory: "./out"`, `binding: "ASSETS"`, `not_found_handling: "404-page"`, `run_worker_first: ["/api/*"]` | same |
| `workers_dev` | `false` | `true` |
| Routes | custom domain on the apex | none |
| `d1_databases` | `DB` → `portfolio-prod`, `migrations_dir: "drizzle/migrations"` | `DB` → `portfolio-preview` |
| `send_email` | `EMAIL`, `destination_address` from the `NOTIFY_TO` build variable | same |
| Rate limiting binding | `RATE_LIMITER`, 5 requests per 60 seconds per visitor IP and route | same, its own namespace |
| `vars` | `NOTIFY_FROM`, `SITE_URL` (canonical apex), `ENVIRONMENT=production` | `SITE_URL` = the preview address, `ENVIRONMENT=preview` |

Your inbox address must not sit in the public repo, so the committed file holds a placeholder and a small script fills `destination_address` from `NOTIFY_TO` before deploy.

**Variables and secrets**:

| Name | Kind | Where it is set | Used by |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | build variable, per environment | Workers Builds build variables; `.env.local` locally | canonical URLs, sitemap, social cards |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | build variable | same | Turnstile widget |
| `NEXT_PUBLIC_UMAMI_WEBSITE_ID` | build variable | same | analytics script |
| `NOTIFY_TO` | build variable (kept out of the repo) | same | fills the email binding's `destination_address` |
| `NOTIFY_FROM`, `SITE_URL`, `ENVIRONMENT` | runtime variable | Wrangler `vars` | the Worker |
| `TURNSTILE_SECRET_KEY` | secret, per environment | `wrangler secret put` (with `--env preview` for preview); `.dev.vars` locally | Turnstile verification |
| `SENTRY_DSN` | secret, per environment | same | Worker error reports |
| `SENTRY_AUTH_TOKEN` | build secret | Workers Builds build secrets | source map upload (maps built code back to your source) |

**Build and deploy commands**:
- Build (both environments): build content, then images, then social cards, then `next build` (exports to `out/`), then fill the Wrangler config.
- Production deploy: `wrangler d1 migrations apply portfolio-prod --remote`, then `wrangler deploy`.
- Preview deploy: `wrangler d1 migrations apply portfolio-preview --remote --env preview`, then `wrangler deploy --env preview`.
- The Workers Builds API token needs D1 edit permission so migrations can run. Preview is one shared address: the last branch deployed is what it shows.

**Local development**:
- Pages: `next dev`, with `.env.local` for the public build variables.
- API: `wrangler dev`, with a local D1 (`wrangler d1 migrations apply portfolio-prod --local`), `.dev.vars` for secrets, and Turnstile's official test keys. Email sending is simulated locally; confirm what it logs at scaffold.
- Full check before pushing: `next build`, then `wrangler dev` serving `out/` plus the Worker together.
- `.env.local` and `.dev.vars` are gitignored.

**Security headers** (in `public/_headers`, mirrored by the Worker on API responses):
- `Content-Security-Policy` allowing `'self'`, Turnstile (`https://challenges.cloudflare.com`, scripts and frames), and the Umami Cloud script and collector origins (confirm the exact hosts at scaffold). Next's static export inlines page data scripts, so `script-src` needs `'unsafe-inline'`; a nonce is not possible on static files.
- `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` denying camera, microphone, and geolocation, `frame-ancestors 'none'`.

## Consequences

**Positive**:
- Pages are plain files on Cloudflare's network: instant loads, strong Core Web Vitals, and the site stays readable even if the Worker is down or broken.
- No adapter between Next.js and Cloudflare, no cache setup, no Worker size or CPU risk for pages.
- One platform for DNS, hosting, database, email, and bot protection; two outside accounts (Umami, Sentry). Zero monthly cost at portfolio traffic.
- The public repo shows real code, specs, and your AI workflow files.

**Negative / tradeoffs**:
- No server actions, middleware, or on demand rendering. Forms post to `/api/...` with `fetch`; anything that needs a server goes in the Worker.
- Two codebases in one repo (the Next site and the Hono Worker) with a shared types folder.
- Preview is a single shared address; two branches pushed close together overwrite each other's preview.
- `script-src 'unsafe-inline'` is needed for Next's inlined scripts, so the content security policy is looser than a server rendered site with nonces.
- On the free plan the email binding only reaches verified addresses, so the site cannot email visitors. Sending to any address needs Workers Paid ($5/month, 3,000 emails included).
- Every content edit is a commit and a rebuild (a few minutes), including after the content admin exists.
- On request project details must never be written into the public repo, including drafts and git history.
- No browser error tracking at launch; a client side bug shows up only if a visitor reports it.

**Neutral**:
- Your domain's DNS moves to Cloudflare, wherever you buy it.
- The Worker is the only runtime code path, so tests and monitoring concentrate there.

**Rules the build must honour**:
- No route may need a server. Theme is client only (a class on `<html>` set by a small inline script, no cookies). Project library filters read the address with `useSearchParams` in a client component. Every dynamic route has `generateStaticParams` and `dynamicParams = false`.
- MDX is compiled and rendered at build only; nothing evaluates MDX at runtime.
- Every API route checks `Origin`, verifies Turnstile, rejects a filled honeypot, and applies the rate limit before writing to D1 or sending email.
- Secrets live only in Wrangler secrets, Workers Builds settings, or gitignored local files; `NEXT_PUBLIC_` holds only the public values listed above.
- Preview deploys use the preview Worker and `portfolio-preview`, never production bindings.
- Turnstile's widget lists the apex domain and the preview `workers.dev` address as allowed hostnames; local development uses test keys.
- Anything generated from content (social cards, a CV PDF if feature 11 chooses one, the AI chat's content index) is generated at build time in Node, never in the Worker.

## Follow-up

- [ ] Buy the domain and point its nameservers to Cloudflare; enable Email Routing with a public address (for example `hello@`), verify your inbox as a destination, and onboard the domain for Email Sending; add the `www` to apex redirect rule.
- [ ] Create the GitHub repo `baregb/portfolio` (public), connect it in Workers Builds, and set the production and non production deploy commands above.
- [ ] Create the two D1 databases, the Turnstile widget, and the Umami Cloud and Sentry projects.
- [ ] At scaffold time, confirm Workers Builds supports Node 24 (else set its Node version build variable), that Static Assets honour `public/_headers`, and the exact Umami Cloud hosts for the policy.
- [ ] At scaffold time, confirm the current `@sentry/cloudflare` setup for a Hono Worker.
- [ ] Content admin (feature 18): confirm the chosen git based editor is still maintained when that spec is written.
- [ ] Connect the MCP servers you picked (commands in the hand off message): Cloudflare bindings and observability, Next.js DevTools, Sentry.
- [ ] Consider a Hono agent skill when the Worker is built; none was searched for, because Hono was chosen after the skill search.
- [ ] `/audit` after the scaffold: capture these conventions and tooling in root `AGENTS.md`, with the installed skills under `## Agent skills`, the connected MCP servers on its `MCP servers:` line, and the community finds you passed on (D1 plus Drizzle schema skill, pnpm, Next.js App Router patterns, community OpenNext skill, Umami MCP) on its `Declined:` line. `nextjs-on-cloudflare` is installed but does not apply; you may remove it.

## Rationale

The full decision record (context, options considered, why this option, the cross check that changed it, references) is in [rationale.md](rationale.md).
