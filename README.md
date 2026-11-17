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
| `pnpm cf-typegen` | Regenerates Worker binding types after editing `wrangler.jsonc` |
| `pnpm deploy:production` / `pnpm deploy:preview` | Deploys the production or preview Worker |

## Layout

- `app/`: Next.js App Router pages. Every route is generated at build time; nothing may need a server.
- `worker/`: the Hono API Worker (`worker/index.ts`), with its own `tsconfig.json`.
- `public/_headers`: security headers for every page.
- `wrangler.jsonc`: Worker config. Top level is production, `env.preview` is the preview Worker.
- `docs/`: scope and specs.
