# Portfolio

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Stack

- **Language / Runtime**: TypeScript (strict) in the site and the Worker; Node 24 (`.node-version`)
- **Framework**: Next.js 16 App Router with `output: "export"` (static files in `out/`); one Hono Worker for `/api/*` only (`worker/index.ts`)
- **Key dependencies**: Tailwind CSS v4, Cloudflare Workers Static Assets, D1 + Drizzle (forms), Content Collections (MDX), Sentry (Worker only)
- **Package manager**: pnpm through Corepack (`corepack enable pnpm`)
- Full decision: [spec 0001](docs/specs/0001-stack-architecture/index.md)

## Build approach

Journey (finish one complete visitor path, every step and state polished, before starting the next).

## Commands

```bash
pnpm install
pnpm dev               # site at http://localhost:3000
pnpm build             # static export to out/
pnpm serve             # build, then site + Worker at http://localhost:8787 (full check before pushing)
pnpm typecheck         # site and Worker
pnpm exec vitest run   # tests
```

## Specs

Stored in `docs/specs/NNNN-title/` (`index.md`, `rationale.md`, `verify.md`). The plan lives in `docs/scope/scope.md`.

## Rules

- Functional style: pure functions by default, side effects only at the edges (Worker handlers, build scripts). Data is immutable (`const`, `readonly`); module level variables are constants. No classes where a function works.
- Expected failures return a typed result (e.g. `{ ok: false, error }`); throw only for real bugs.
- Folder by feature: `features/<feature>/` holds that feature's components, helpers, and types. Route files in `app/` stay thin; shared UI goes in `components/`.
- Strict types, no `any`. Named exports only, except files that must default export: Next `page`/`layout`/`not-found`, config files, `worker/index.ts`.
- No route may need a server: dynamic routes use `generateStaticParams` with `dynamicParams = false`; no server actions, cookies, or headers reads; MDX compiles at build only.
- API errors are always JSON `{ error: "<code>" }` with the right status, logged as one structured JSON line (level, message, path, method). Never leak internals or secrets in a response or log.
- Validate env vars and bindings: `NEXT_PUBLIC_*` at build, Worker bindings and secrets before use; fail loudly and name what is missing. Secrets live only in Wrangler secrets, Workers Builds settings, or gitignored `.env.local` / `.dev.vars`.
- Every API route checks `Origin`, verifies Turnstile, rejects a filled honeypot, and applies the rate limit before writing to D1 or sending email.
- Accessibility: every UI piece meets WCAG 2.2 AA (keyboard use, labels, visible focus, contrast, reduced motion).
- Conventional commits: `feat(contact): ...`, `fix(worker): ...`, `test(worker): ...`.

## Tooling

Chosen here, installed by `/develop tooling`:
- Lint: ESLint flat config with `eslint-config-next` and `typescript-eslint`. Format: Prettier with `prettier-plugin-tailwindcss`.
- Pre-commit: lint and format staged files, then `pnpm typecheck`.
- CI: GitHub Actions on push and PR (install, lint, typecheck, test, build). Workers Builds still does the deploys.
- Tests: Vitest, `*.test.ts` beside the source (`test-preferences.json`). Every feature gets typecheck + `/check verify`; Beta features and all Worker code also get a Vitest suite.

## Git

- integration: on
- branch prefix: feat/
- commit: per-milestone

## Agent skills

Installed in `.agents/skills/` (mirrored in `.claude/skills/`):
- [cloudflare](.agents/skills/cloudflare/): `cloudflare/skills`, choosing Cloudflare products and reading Cloudflare errors
- [wrangler](.agents/skills/wrangler/): `cloudflare/skills`, Wrangler CLI for dev, deploy, D1, and secrets
- [workers-best-practices](.agents/skills/workers-best-practices/): `cloudflare/skills`, production Worker code and config
- [workers-development](.agents/skills/workers-development/): `cloudflare/skills`, running and debugging the Worker locally
- [cloudflare-email-service](.agents/skills/cloudflare-email-service/): `cloudflare/skills`, the email sending binding and Email Routing
- [turnstile-spin](.agents/skills/turnstile-spin/): `cloudflare/skills`, Turnstile widget and server side Siteverify
- [web-perf](.agents/skills/web-perf/): `cloudflare/skills`, Core Web Vitals and loading performance
- [tailwind-4-docs](.agents/skills/tailwind-4-docs/): `lombiq/tailwind-agent-skills`, Tailwind v4 utilities and config
- [hono](.agents/skills/hono/): `honojs/skills`, Hono routing, middleware, validation, and testing for the API Worker
- [vitest](.agents/skills/vitest/): `antfu/skills`, Vitest config, mocking, coverage, and filtering
- [sentry-get-started](.agents/skills/sentry-get-started/): `getsentry/sentry-for-ai`, setting up Sentry
- [sentry-instrument](.agents/skills/sentry-instrument/): `getsentry/sentry-for-ai`, adding Sentry to the Worker
- [sentry-fix-stack-traces](.agents/skills/sentry-fix-stack-traces/): `getsentry/sentry-for-ai`, source maps for readable traces
- [sentry-debug-issue](.agents/skills/sentry-debug-issue/): `getsentry/sentry-for-ai`, working a Sentry issue to a fix
- [nextjs-on-cloudflare](.agents/skills/nextjs-on-cloudflare/): `cloudflare/skills`, does NOT apply (it runs Next on a server); do not follow it

Declined: D1 + Drizzle schema skill, pnpm skill, Next.js App Router patterns skill, community OpenNext skill, Umami MCP
MCP servers: Cloudflare bindings and observability (recommended), Next.js DevTools (recommended), Sentry (recommended), ESLint `@eslint/mcp` (recommended, after ESLint is installed)

## Context files

<!-- Nested AGENTS.md files are listed here as they are created -->

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
