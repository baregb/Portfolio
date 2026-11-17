# Review, feat/content-model, 2026-11-17

**Reviewed by**: Sonnet 5.5 (author model not stated)
**Scope**: 65 files read (code, config, content, specs; vendored skills and lockfile skimmed only), branch vs main (merge base 1637d38, plus uncommitted edits to `docs/scope/scope.md` and `docs/specs/0002-content-model/verify.md`)
**Verdict**: Changes requested

## Summary
The branch adds the content model from spec 0002: strict Zod schemas wired into Content Collections, a mdast based section splitter, a pure cross file checker plus the Node check script, a typed read layer, tooling (lint-staged, CI, scripts), and proof content. The code is clean, functional, and well tested. I ran `pnpm content`, `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, and `vitest run` (143 tests): all green. In a scratch copy I also broke the content on purpose (forbidden field on an on request project, card with body text, on request body text, on request image folder, stray `.md`, draft flagship in production): every case failed with the file and field named and exit 1. One real gap: `CONTENT_DRAFTS` validation is only reachable through a module nothing imports yet, so AC-7 and a ticked verify item are not true today.

## Major
### 🟠 `CONTENT_DRAFTS` is never validated at build, `features/content/env.ts:9` / `scripts/check-content.ts` / `features/content/index.ts:19`
**Problem**: AC-7 and the spec's "Configuration required" say any `CONTENT_DRAFTS` value other than unset, `true`, or `false` fails the build. The only caller of `parseContentDrafts` is `features/content/index.ts`, and nothing under `app/` or `components/` imports that module yet, so `next build` never evaluates it. `check-content.ts` deliberately ignores the variable. I confirmed `CONTENT_DRAFTS=maybe node scripts/check-content.ts` prints "Content check passed" and exits 0. The verify.md line "`CONTENT_DRAFTS=maybe pnpm build` -> fails" is ticked `[x]` (uncommitted diff), but I could not make it true by reading the code: `pnpm build` is `pnpm content && next build`, and neither step imports the read layer.
**Why it matters**: A typo such as `TRUE` or `1` in the preview Worker's build variables silently builds in production mode (drafts hidden), the opposite of what the preview exists for. The spec's own fail loudly rule (AGENTS.md: "fail loudly and name what is missing") is not met, and the verify checklist now records a pass that does not hold.
**Suggested fix**: Call `parseContentDrafts(process.env.CONTENT_DRAFTS)` at the top of `scripts/check-content.ts` and exit 1 with the error, so every `pnpm content` (commit, typecheck, test, CI, build) enforces it. Alternatively validate in `next.config.ts`. Then re-run and re-tick the verify item, or untick it until a page imports the read layer. Add a test that exercises the failure through whichever entry point is chosen.

## Minor
### 🟡 Read layer has no server-only guard, `features/content/index.ts:1`
**Problem**: The module pulls in `allProjects` etc., which hold every draft, every on request brief, and all compiled MDX. Spec says sections render only in server components, but nothing enforces it. If any client component later imports `features/content`, the whole generated set (drafts included, since filtering happens in the reader, not in the data) ships to the browser, and `process.env.CONTENT_DRAFTS` is `undefined` there.
**Why it matters**: A silent leak of unpublished drafts and bundle bloat, with no build error.
**Suggested fix**: Add a server-only marker (Next's `server-only` import for the barrel, kept out of `read.ts` so Vitest can still import it), or an ESLint `no-restricted-imports` rule for `features/content` inside `"use client"` files.

### 🟡 lint-staged does not format `.mdx`, but CI checks it, `lint-staged.config.mjs:3-7`
**Problem**: Prettier handles `.mdx` (it is not in `.prettierignore`; only `*.md` is), and CI runs `pnpm format:check`. The staged glob list covers ts/js/json/css/yml/yaml only; `content/**` runs just `pnpm content`.
**Why it matters**: An unformatted `content/projects/*.mdx` or `about.mdx` passes the pre-commit hook and then fails CI.
**Suggested fix**: Add `mdx` to the `prettier --write` glob (or ignore `content/**/*.mdx` in `.prettierignore` if prose should stay as written, matching the Markdown policy).

### 🟡 On request privacy is structural only for fields; YAML comments and free text pass, `features/content/schema.ts:165-176`
**Problem**: Spec says on request files contain "nothing beyond the allowed fields". A YAML comment in the frontmatter (for example `# client is Acme Ltd`) is not a field, is dropped by the parser, and is committed to the public repo without any check. Likewise `title`, `summary`, `role`, `client.descriptor`, and the `brief.*` strings accept URLs or markdown links, though the summary says the rules reject links.
**Why it matters**: This is the one class of data the hook exists to protect; the hook gives a stronger sense of safety than it delivers for comments.
**Suggested fix**: In the check script, read raw text of on request project files and reject lines containing `#` comments in the frontmatter, and reject `http(s)://`, `www.`, and markdown link syntax in on request text fields. Or document the accepted residual risk next to the "owner approves all on request text" line in the spec.

### 🟡 Unsourced numeric claims in public flagship prose, `content/projects/beccahs-kitchen.mdx:92`
**Problem**: The Results narrative states "70 data model tests at the first release" and "two admin roles keep the developer account read only for business data". Neither has a `source` note, unlike the four stat tiles, and the spec asks for real results with sources.
**Why it matters**: Public portfolio claims that a reviewer cannot trace; easy to drift from the repo.
**Suggested fix**: Add a source for each in the repo (or move them into `results[]` with a `source`), or drop the figures.

## Nits
- ⚪ `features/content/schema.ts:80-87`, `updated` accepts `2026-02-31` (regex only), and a YAML Date for it normalises silently to 2026-03-03. A calendar check (round trip through `Date`) would close it.
- ⚪ `.github/workflows/ci.yml:34-39`, `.husky/pre-commit:5-6`, `package.json:17,21`, content build and check run up to four times in CI (explicit step, then typecheck, test, build) and twice per commit (lint-staged then typecheck). Cheap today; drop the explicit CI step or the redundant ones as MDX grows.
- ⚪ `package.json:12`, `CONTENT_DRAFTS=true next dev` is POSIX only; `cross-env` or `node --env` would keep Windows contributors working. Low value for a solo repo.
- ⚪ `AGENTS.md`, spec 0002 "Follow-up" items (record `content-collections` and `zod` skills, content conventions in `## Rules`, `.ts` extension imports in check modules) are not in this diff yet; fine if `/sync` is planned before merge.

## Strengths
- Strict, readable schema design: nested discriminated unions, per variant `strictObject` with messages like "is not allowed on an on request project", and a `withReadableIssues` wrapper so errors name `results[0].source` instead of comma joined paths.
- `checkContent` is pure and takes a snapshot; the script is a thin edge. Both draft modes run on every build, duplicate errors are de-duplicated, and a document that failed to build is still caught ("did not build") even if the CLI exits 0.
- Section splitter uses a real mdast parse (code fences and setext headings handled), with precise errors; each section compiles from its own copy so cache keys never collide (asserted in a test).
- Read layer is pure and tolerant: resolve once, throw only for real bugs, readonly types, discriminated `Project` union so pages cannot read `links` from an on request project.
- Tests are broad and tied to ACs (143 passing), with invented fixtures only and a real content test over both draft modes.

## Test coverage
Strong. `schema.test.ts`, `check.test.ts`, `sections.test.ts`, `read.test.ts`, `env.test.ts`, and `content.test.ts` cover each AC with failure paths, not only the happy path. Gaps: `content-collections.ts` itself (the transform's `fail()` paths for card or on request body text and an empty about body) has no Vitest case; I exercised them by hand and they work, but only the manual verify list guards them. `scripts/check-content.ts` (file walking, both mode merge, exit code) is also only covered by hand. Neither blocks merge. The `CONTENT_DRAFTS` failure path (Major above) has a unit test for the parser but no test of any real build entry point.
