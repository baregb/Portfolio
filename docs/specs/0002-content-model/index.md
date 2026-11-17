# 0002. Model site content as checked MDX and YAML collections

**Date**: 2026-11-17
**Status**: In Progress

## Summary

Everything the site shows (projects, role lenses, tags, your profile, and your about story) lives as small MDX and YAML files in `content/`, checked against strict schemas and cross file rules every time content is built. Flagship case studies are written as one MDX file with six fixed headings, and the build splits them into named sections the page template can place. On request projects can only hold short, safe text: the rules reject links, images, client names, and long bodies, and the pre-commit hook runs those rules on what you are committing, so a local commit that would leak private details is blocked. Every page reads content through one small set of typed functions, and any broken rule fails the build with the file named.

## Requirements

**User stories**:
- As the site owner, I want to describe any project once, tag it for any role lens, and mark it public or on request, so every page can show it without extra fields.
- As the site owner, I want my commits blocked when they would put private details of an on request project into the public repo.
- As a page builder (later specs), I want typed read functions that return content already ordered, filtered, and resolved, so pages stay thin.

**Acceptance criteria**:
- **AC-1**: A public flagship with every required field and the six body sections passes `pnpm content`. `getProject(slug)` returns its structured fields, its six sections by key (`problem`, `constraints`, `decision`, `built`, `results`, `ai`), each as `{ code, markdown }` with the heading removed, its resolved taxonomy entries and lenses, `clientLabel` (`client.name ?? client.descriptor`), `headlineResult` (`results[0]`), and `seoTitle`/`seoDescription` (falling back to `title`/`summary`).
- **AC-2**: An on request project fails `pnpm content`, with an error naming the file and the field, when it holds any of: MDX body text, `client.name`, `links`, `cover`, `screenshots`, `diagram`, `seo` on a card, or a `source` on any result. An on request flagship without a complete `brief` (`problem`, `approach`, `outcome`, `ai`) also fails. An on request card with a `brief` fails. Any image file under `content/images/<on-request-slug>/` fails.
- **AC-3**: A public flagship fails `pnpm content`, naming the file and the problem, when: a section is missing, duplicated, out of order, empty, or under an unknown H2; there is text before the first H2; `cover` is missing; `results` is empty; a result has no `source`; or `skills` is empty. `##` inside a code block does not start a section.
- **AC-4**: A card (either visibility) with any body text or a `brief` fails. Cards never get a route: `getFlagships()` excludes them, and it is the only source for case study route params.
- **AC-5**: Every reference resolves: project `sector`, `categories`, `stack`, `skills`, and `aiTools`; lens `projects` and `skills`; profile `featured`, `flagshipOrder`, and `lensOrder`; and each skill's `group` against `profile.skillGroups`. An unknown slug fails, naming the referencing file, the field, and the slug. An `aiTools` slug must name a stack entry whose `group` is `ai`, and must not also appear in that project's `stack`.
- **AC-6**: `getLenses()` returns lenses in `profile.lensOrder`. Each lens returns its projects and skills in file order. A project may belong to any number of lenses, including none. Each project returned by any read function carries `lenses: { slug, name }[]` (the lenses that list it, in `lensOrder`), which is what the library's role filter uses.
- **AC-7**: With `CONTENT_DRAFTS=true`, drafts appear in every read function; with it unset or `false`, drafts are excluded everywhere. A draft named in a lens or profile list is dropped, and a warning names it. In production mode the check fails if, after dropping drafts, any lens has no projects, or there is no featured project, no flagship, or no lens. Any other `CONTENT_DRAFTS` value fails. Every schema rule applies to drafts too.
- **AC-8**: `featured` may name only flagships. `flagshipOrder` must list every flagship (drafts included) exactly once and nothing else; membership is checked before drafts are dropped. A failure names the missing, extra, or duplicated slug. `getFlagshipNeighbours(slug)` follows the filtered order with no wrap.
- **AC-9**: `getProjects()` returns projects in library order: ongoing first, then end month newest first, then start month newest first, then title (compared with `Intl.Collator("en", { sensitivity: "base" })`), then slug.
- **AC-10**: The rules reject any value past the limits in the data model; a period not in `YYYY-MM` form (with a message showing the expected form) or ending before it starts; an `updated` value not in `YYYY-MM-DD` form; a non kebab case slug; a project slug of `profile`; a non `https` link; an empty alt text; an image `src` that is absolute, contains `..`, does not start with the owner's folder (the project slug, or `profile/` for the profile photo), has an extension other than `png`, `jpg`, `jpeg`, or `webp` (`svg` allowed only for `diagram`), or names a file that does not exist.
- **AC-11**: `getSkillGroups()` returns groups in `profile.skillGroups` order, each listing its skills (name order) with the included projects that name them (library order). Skills with no included project, and groups with no remaining skills, are left out. `getCategories()`, `getStackEntries()`, and `getSectors()` return only entries used by at least one included project, in name order.
- **AC-12**: `pnpm content` fails on any file in `content/` that matches no collection and is not an image, on any image no included or draft project (or the profile) references, and when the content build itself reports an invalid document. It exits non zero in every case, so it blocks the pre-commit hook and CI.
- **AC-13**: Proof content passes in both draft modes: a real public flagship (Beccah's Kitchen), a real on request flagship (`membership-charity-data-migration`, titled "Membership charity data migration"), the profile, the about page, three lenses (solutions architect, software developer, AI assisted builder), and only the taxonomy entries those use. `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` pass locally and in CI.

## Decision

**Chosen option**: Option 1: strict per type schemas in Content Collections (MDX projects and about page, YAML lenses, taxonomies, and profile), a build time section splitter, and a pure rule checker run by a content check script on every content build, behind one typed, pure read layer.

`pnpm content` runs `content-collections build` (per file schemas and the section transform), then `scripts/check-content.ts` (every cross file rule, stray files, and images, in both draft modes). lint-staged runs it whenever staged files touch `content/`, so it checks exactly what is being committed.

**Implementation skills**: `content-collections` (`jackspace/claudeskillz`, `.claude/skills/content-collections/`) · `zod` (`pproenca/dot-skills`, `.claude/skills/zod/`) · `vitest` (`antfu/skills`, `.agents/skills/vitest/`)

The `content-collections` skill is written for the Vite plugin and pins versions from November 2025. Its schema, transform, and `compileMDX` guidance applies; its Vite setup does not (this project uses the CLI). Where it differs from the current official Content Collections docs, the docs win.

## Feature design

**Files and collections**:

| Collection | `directory` / `include` | Parser |
|---|---|---|
| `projects` | `content/projects` / `*.mdx` | frontmatter + MDX body |
| `lenses` | `content/lenses` / `*.yaml` | YAML |
| `categories` | `content/categories` / `*.yaml` | YAML |
| `stack` | `content/stack` / `*.yaml` | YAML |
| `skills` | `content/skills` / `*.yaml` | YAML |
| `sectors` | `content/sectors` / `*.yaml` | YAML |
| `profile` | `content` / `profile.yaml` | YAML (one file; "exactly one" checked in code, since collections are arrays) |
| `about` | `content` / `about.mdx` | frontmatter + MDX body (one file, checked in code) |
| images | `content/images/<project-slug>/*`, `content/images/profile/*` | not a collection; checked by the script |

The slug is the filename without its extension and must match `^[a-z0-9]+(-[a-z0-9]+)*$`. `profile` is reserved and can't be a project slug (it names the profile image folder). Filenames make slugs unique. Dotfiles are ignored everywhere.

**Data model sketch**:

*Project* (`projects`). Every object is strict (`z.strictObject`), so an unknown or forbidden key fails rather than being dropped. The schema is a nested discriminated union, `visibility` then `depth` (Zod 4), so an error names the failing field instead of "invalid union". Each variant declares `content: z.string()` (the frontmatter parser adds it). "Must be empty" means empty after trimming whitespace.

| Field | Type and limits | Public flagship | Public card | On request flagship | On request card |
|---|---|---|---|---|---|
| `title` | string, 1 to 70 | required | required | required | required |
| `summary` | string, 1 to 160 (cards, meta description) | required | required | required | required |
| `status` | `draft` \| `published` | required | required | required | required |
| `depth` | `flagship` \| `card` | `flagship` | `card` | `flagship` | `card` |
| `visibility` | `public` \| `onRequest` | `public` | `public` | `onRequest` | `onRequest` |
| `updated` | `YYYY-MM-DD` (a YAML date is accepted and normalised to this string) | optional | optional | optional | optional |
| `client.descriptor` | string, 1 to 80 (for example "a UK membership charity") | required | required | required | required |
| `client.name` | string, 1 to 80 | optional | optional | forbidden | forbidden |
| `role` | string, 1 to 60 (for example "Lead developer") | required | required | required | required |
| `period.start` | `YYYY-MM` | required | required | required | required |
| `period.end` | `YYYY-MM` or `null` (ongoing); the key must be present | required | required | required | required |
| `sector` | slug → Sector | required | required | required | required |
| `categories` | slug[] → Category, 1 to 3, first is primary | required | required | required | required |
| `stack` | slug[] → Stack, at least 1, display order | required | required | required | required |
| `skills` | slug[] → Skill | at least 1 | optional | at least 1 | optional |
| `aiTools` | slug[] → Stack with `group: ai`, none also in `stack` | optional (default `[]`) | optional | optional | optional |
| `aiNote` | string, 1 to 200 | forbidden | optional | forbidden | optional |
| `results` | `{ value (1 to 40), label (1 to 60), context? (1 to 160), source? (1 to 300) }[]`; `results[0]` is the headline | at least 1, `source` required | optional, `source` required | optional, `source` forbidden | optional, `source` forbidden |
| `links` | `{ repo?, live?, other?: { label (1 to 40), url }[] }`, `https` only | optional | optional | forbidden | forbidden |
| `cover` | `{ src, alt (1 to 200) }` | required | optional | forbidden | forbidden |
| `screenshots` | `{ src, alt (1 to 200), caption? (1 to 160) }[]` | optional | optional | forbidden | forbidden |
| `diagram` | `{ src (svg or png), alt (1 to 200), description (1 to 600) }` | optional | forbidden | forbidden | forbidden |
| `brief` | `{ problem, approach, outcome, ai }`, plain text, each 1 to 600 | forbidden | forbidden | required | forbidden |
| `seo` | `{ title? (1 to 70), description? (1 to 160) }` | optional | forbidden | optional | forbidden |
| MDX body | the six fixed H2 sections | required | must be empty | must be empty | must be empty |

On public projects, `source` is a private note on where a number comes from. It is not rendered, but it sits in the public repo, so write it to be safe in public. On request results carry no source at all. On a flagship page, `results[]` renders as stat tiles and the `Results` section is the narrative; on cards and home, `headlineResult` is the one proof point.

*Flagship body sections*: exactly these H2 headings, in this order, matched exactly after trimming. Split on depth 2 heading nodes from a real Markdown parse (mdast), never a line regex, so `##` in code blocks and setext headings behave correctly. H3 and deeper are free inside a section. Text before the first H2, and an empty section, both fail.

| H2 heading | Section key |
|---|---|
| `## Problem` | `problem` |
| `## Constraints` | `constraints` |
| `## Decision and tradeoffs` | `decision` |
| `## What I built` | `built` |
| `## Results` | `results` |
| `## How AI was used` | `ai` |

Each section is `{ code, markdown }`. `markdown` is the source slice under the heading, with the heading removed; Ask AI uses it as plain text. `code` is the output of `compileMDX` on a copy of the document whose `content` is that slice; confirm that its cache key includes the content, so sections never collide. Standard Markdown only for now; the case study page spec may add MDX components. Sections render only in server components, so compiled MDX never ships to the browser.

*About* (`about`, exactly one file): `seo` (`{ title? (1 to 70), description? (1 to 160) }`, optional) plus a free MDX body (your story and how you work; it must not be empty). It is compiled whole with `compileMDX`, and returned as `{ code, markdown }`. The about and skills spec may add structure.

*Lens* (`lenses`): `name` (1 to 40), `headline` (1 to 120), `intro` (1 to 400), `projects` (slug[] → Project, ordered, at least 1, no duplicates), `skills` (slug[] → Skill, ordered, may be empty, no duplicates), `seo` (`{ title? (1 to 70), description? (1 to 160) }`, optional; falls back to `name` and `headline`).

*Category*: `name` (1 to 40), `description` (1 to 200).
*Stack*: `name` (1 to 40), `group` (optional; `frontend` \| `backend` \| `data` \| `infrastructure` \| `ai` \| `tooling`).
*Skill*: `name` (1 to 60), `group` (string, must equal one entry of `profile.skillGroups`), `description` (1 to 200).
*Sector*: `name` (1 to 40).

*Profile* (`profile`, exactly one file): `name` (1 to 60), `roleLine` (1 to 80), `headline` (1 to 160), `location` (1 to 60), `photo` (`{ src, alt (1 to 200) }`, `src` under `profile/`), `availability` (`{ status: open | selective | unavailable, note?: 1 to 120 }`), `links` (`{ kind: github | linkedin | website, url }[]`, `https`, each kind at most once), `featured` (slug[] → flagships, 1 to 6, no duplicates), `flagshipOrder` (slug[] → every flagship, no duplicates), `lensOrder` (slug[] → every lens, exactly once each), `skillGroups` (string[], 1 to 40 each, ordered, unique, at least 1).

**Relationships**:

| From | To | Cardinality | Stored on |
|---|---|---|---|
| Project | Sector | N:1 | project `sector` |
| Project | Category | N:M (1 to 3, first primary) | project `categories` |
| Project | Stack | N:M (ordered) | project `stack`, `aiTools` (disjoint) |
| Project | Skill | N:M | project `skills` |
| Lens | Project | N:M (ordered) | lens `projects` (also exposed as `project.lenses`) |
| Lens | Skill | N:M (ordered) | lens `skills` |
| Skill | skill group | N:1 | skill `group` → `profile.skillGroups` |
| Profile | Project | ordered lists | `featured`, `flagshipOrder` |
| Profile | Lens | ordered list | `lensOrder` |

**State transitions**:
- Project `status`: `draft` → `published`. A project can go back to `draft`, which removes it from production on the next build. There is no archive: delete the file (and its image folder) to retire a project.
- Project `depth`: `card` → `flagship` (promotion: change the field, add the body and the flagship fields, add it to `flagshipOrder`). Demotion is the reverse.
- Moving `visibility` from `onRequest` to `public` is safe. Moving `public` to `onRequest` cannot remove history: anything already committed stays in git. Treat that as a disclosure decision, not a content edit.

**Where each rule runs**:

| Rule kind | Runs in | Why there |
|---|---|---|
| Field shape, forbidden fields, limits, slug and path format, period order, `updated` format | Zod schemas in `content-collections.ts` | per file; reported with file and field |
| Body sections, empty bodies | the project transform, via `splitSections` | needs the body |
| References, ordering, drafts, minimum counts, image existence, orphan and on request images, stray files, exactly one profile and about | `checkContent` (pure), called by `scripts/check-content.ts` with a snapshot that includes the file and image lists | spans files; the script is the file system edge |

`scripts/check-content.ts` runs on Node 24 directly (type stripping). It imports the generated collections from `.content-collections/generated/index.js` by relative path, walks `content/` (skipping dotfiles), runs `checkContent` in both draft modes, prints warnings as one JSON line each (`level`, `message`, `file`), prints every error, and exits 1 on any error. It also exits 1 if `content-collections build` reported an invalid document but still exited 0. So every module it imports (`features/content/check.ts` and anything that file imports) uses relative imports with explicit `.ts` extensions, `import type` for types, and only erasable TypeScript syntax (no enums or namespaces). `tsconfig.json` gains `allowImportingTsExtensions: true` (valid with `noEmit`).

**Read layer** (`features/content/`, the only module pages import content from; pure functions over the generated collections and the `includeDrafts` flag, never throwing, because the script has already enforced every rule):

| Function | Inputs | Returns | Used by |
|---|---|---|---|
| `getProfile()` | none | `Profile` | home, about, lenses, SEO |
| `getAbout()` | none | `About` (`seo`, `{ code, markdown }`) | about page |
| `getProjects()` | none | `readonly Project[]`, library order | project library, Ask AI index |
| `getProject(slug)` | `slug: string` | `Project \| undefined` (unknown or excluded draft) | case study page, request access |
| `getFlagships()` | none | `readonly Flagship[]` in `flagshipOrder` | `generateStaticParams` for case studies |
| `getFlagshipNeighbours(slug)` | `slug: string` | `{ previous?: ProjectRef; next?: ProjectRef }` (empty if not a flagship) | case study next and previous |
| `getFeatured()` | none | `readonly Flagship[]` in `featured` order | home |
| `getLenses()` | none | `readonly Lens[]` in `lensOrder`, projects and skills resolved | lens switcher, lens routes |
| `getLens(slug)` | `slug: string` | `Lens \| undefined` | lens page |
| `getCategories()`, `getStackEntries()`, `getSectors()` | none | used entries only, name order | library filters |
| `getSkillGroups()` | none | `{ group, skills: { skill, projects }[] }[]`, empty ones removed | about and skills |
| `splitSections(markdown)` | MDX body | `{ ok: true, sections } \| { ok: false, error }` | the project transform |
| `checkContent(snapshot, { includeDrafts })` | collections + file and image lists + flag | `{ ok: true, warnings } \| { ok: false, errors }` (each `{ file, field?, message }`) | the check script, tests |

`Project` is a discriminated union of `PublicFlagship`, `PublicCard`, `OnRequestFlagship`, and `OnRequestCard` (on `depth` and `visibility`), so a page cannot read `links` from an on request project without a type error. `ProjectRef` is `{ slug, title }`. The library's stack filter matches a project's `stack` plus `aiTools`.

**Value sourcing**:

| Action | Value produced / displayed | Source |
|---|---|---|
| any read | slug | filename without extension (`_meta`) |
| `getProject` | six sections `{ code, markdown }` | `splitSections` over the body, compiled per section in the project transform |
| `getProject` | `seoTitle`, `seoDescription` | `seo.title ?? title`, `seo.description ?? summary` |
| `getProject` | `clientLabel` | `client.name ?? client.descriptor` |
| `getProject` | `headlineResult` | `results[0]`, or `undefined` |
| `getProject` | resolved sector, categories, stack, skills, AI tools | slugs in the project file, joined to taxonomy files |
| `getProject` | primary category | first entry of `categories` |
| `getProject` | `lenses` | lenses whose `projects` list the slug, in `lensOrder` |
| `getProject` | AI note | flagship `ai` section (public), `brief.ai` (on request flagship), `aiNote` (cards, optional) |
| any read | whether drafts are included | `CONTENT_DRAFTS`, read and validated once in `features/content/env.ts` |
| `getProjects` | library order | `period.end` (null first), `period.end` desc, `period.start` desc, title (collator), slug |
| `getFlagships` | order | `profile.flagshipOrder`, minus excluded drafts |
| `getFlagshipNeighbours` | previous and next | position in the filtered `flagshipOrder`, no wrap |
| `getFeatured` | items and order | `profile.featured`, minus excluded drafts |
| `getLenses` / `getLens` | lens order; project and skill order; SEO | `profile.lensOrder`; the lens file's lists minus excluded drafts; `seo ?? { name, headline }` |
| taxonomy getters | which entries appear | entries referenced by at least one included project |
| `getSkillGroups` | group order; projects per skill | `profile.skillGroups`; included projects whose `skills` contain the slug |
| sitemap (spec 13) | `lastmod` | `updated` when present, else omitted |
| card | badge, request button vs links | `visibility` (the request form is spec 14's) |
| image components (later) | file path | `content/images/` + `src`; resizing is spec 0001's image script, which must pass SVG through unchanged |
| request access (spec 14) | project name for a slug | `getProject(slug).title` at build; how the Worker learns valid slugs is spec 14's |

**Key invariants**:
- On request files contain nothing beyond the allowed fields and an empty body, have no image folder, and carry no result sources.
- A public flagship body is exactly the six non empty sections in order.
- Every slug reference resolves. Lists hold no duplicates. `stack` and `aiTools` are disjoint.
- `flagshipOrder` equals the set of all flagships. `featured` holds only flagships.
- In production, no lens is empty, and at least one featured project, one flagship, and one lens remain. No draft is reachable from any read function.
- Every file in `content/` belongs to a collection or is an image referenced by a project or the profile.
- Content is compiled only at build. Nothing reads `content/` at runtime, and the Worker never imports the content module.

**Security model**: There is no runtime surface and no sign in. Everything in `content/` is public, because the repo is public. The only sensitive class is on request project detail. The defence is structural (the forbidden fields can't be written, there's no body or image folder, the brief is short plain text, and results carry no source), and it is enforced on staged content by lint-staged before a local commit exists. It does not cover commits that skip the hook: `--no-verify`, the GitHub web editor, a clone without husky installed, and the future content admin. CI catches these after the fact, but the text is then in history. The remaining risk is human (a brief written with too much detail), so the owner approves all on request text before it is committed. Test fixtures for the privacy rules use invented data only, never real client detail.

**Configuration required**:
- `CONTENT_DRAFTS`: build variable, not public (no `NEXT_PUBLIC_` prefix). Set to `true` by the `dev:next` script and in the preview Worker's Workers Builds build variables; unset in production. Unset or `false` excludes drafts; any other value fails. (`check-content.ts` ignores it and always checks both modes.)

**Critical test scenarios** (Vitest, fixture based, beside the source; fixtures use invented data):
- Happy path: a complete public flagship fixture splits into six `{ code, markdown }` sections and passes `checkContent`, and `getProject` returns resolved fields, lenses, `clientLabel`, `headlineResult`, and SEO fallbacks. Verifies **AC-1**, **AC-6**.
- Privacy: the project schema rejects each forbidden on request field in turn, a result `source`, a non empty body, a missing `brief.ai`, and a card `brief`, and each error message names the field. `checkContent` rejects an on request image folder. Verifies **AC-2**, **AC-4**.
- Sections: `splitSections` rejects a missing, duplicated, misordered, unknown, or empty section and text before the first H2, and ignores `##` inside a code fence. Verifies **AC-3**.
- References: an unknown slug in each reference field fails with file, field, and slug; a non `ai` stack entry in `aiTools` fails; a slug in both `stack` and `aiTools` fails. Verifies **AC-5**.
- Drafts: in production mode, a draft in a lens is dropped with a warning, a lens left empty fails, and zero featured projects fails; in draft mode the draft is kept. Verifies **AC-7**.
- Ordering: `flagshipOrder` missing a draft flagship fails; a duplicate or a card fails; neighbours don't wrap; library order holds on mixed periods and equal titles. Verifies **AC-8**, **AC-9**.
- Taxonomies: unused categories, skills, and groups are left out. Verifies **AC-11**.
- Files: a stray `.md` file, an orphan image, a bad image path, and a missing image file each fail. Verifies **AC-10**, **AC-12**.
- Real content: the generated collections pass `checkContent` in both draft modes. Verifies **AC-13**.

## Build plan

The Journey approach means this feature is finished whole (every rule enforced, proof content in, tests green) before the design system starts. Inside it, the order follows dependencies: wiring and a proven failing check first, then per file rules, cross file rules, the read layer, and finally real content. That way each step can be checked by the one before it.

**Milestone 1: tooling and schemas**
1. Install `@content-collections/core`, `@content-collections/cli`, `@content-collections/mdx`, `zod` (v4), and `mdast-util-from-markdown`, at current versions. Confirm against the official docs that `defineCollection` accepts a Standard Schema object (needed for strict objects and unions) and the current `compileMDX` signature. Satisfies **AC-13**.
2. Wire the scripts:
   - `content` = `content-collections build && node scripts/check-content.ts`
   - `build` = `pnpm content && next build`
   - `typecheck` = `pnpm content && next typegen && tsc ...`
   - `test` = `pnpm content && vitest run`
   - `serve` = `pnpm build && wrangler dev`
   - `dev` = `pnpm content && pnpm run "/^dev:(content|next)$/"`, with `dev:content` = `content-collections watch` and `dev:next` = `CONTENT_DRAFTS=true next dev`

   Then move the lint-staged config to `lint-staged.config.mjs`, adding a `content/**` entry that runs `pnpm content` as a function (so no file names are appended). Add a `pnpm content` step before `pnpm lint` in CI. Add the `content-collections` path alias to `tsconfig.json` and Vitest, plus `allowImportingTsExtensions`. Ignore `.content-collections/` in git, ESLint, and Prettier. Satisfies **AC-2**, **AC-7**, **AC-12**.
3. Write `content-collections.ts`: eight collections with strict Zod schemas (the nested project union, about, lens, the four taxonomies, profile), every per file limit, slug and image path formats, and period and `updated` rules with clear messages. Prove the failure path: a forbidden field fixture must make `pnpm content` exit non zero. If `content-collections build` exits 0 on an invalid document, make the check script detect that (or drive the build through the programmatic builder and its error events) and exit 1. Satisfies **AC-2**, **AC-4**, **AC-10**, **AC-12**.

**Milestone 2: build rules**

4. Write `features/content/sections.ts` (`splitSections`, pure, mdast based, typed result) and call it from the project transform. Compile each section with `compileMDX` on a per section document copy, fail on any body text for cards and on request projects, and compile the about body. Satisfies **AC-1**, **AC-2**, **AC-3**, **AC-4**.
5. Write `features/content/check.ts` (`checkContent`, pure, Node runnable imports) and `scripts/check-content.ts` (the edge). Cover references, `aiTools` rules, skill groups, duplicates, `featured` and `flagshipOrder`, `lensOrder`, draft dropping with warnings, production minimums, exactly one profile and about, image existence, orphan and on request images, and stray files. Satisfies **AC-2**, **AC-5**, **AC-7**, **AC-8**, **AC-10**, **AC-12**.
6. Write Vitest suites for the schemas (each forbidden field, asserting the field appears in the message), `sections.ts`, and `check.ts`, using invented fixtures. Satisfies **AC-2**, **AC-3**, **AC-4**, **AC-5**, **AC-7**, **AC-8**, **AC-10**, **AC-12**.

**Milestone 3: read layer**

7. Write `features/content/env.ts` (validates `CONTENT_DRAFTS`), `types.ts` (the discriminated `Project` union and the resolved types), and `index.ts` (every read function in the table: derived values, used only taxonomies, empty group removal, ordering). Satisfies **AC-1**, **AC-4**, **AC-6**, **AC-7**, **AC-8**, **AC-9**, **AC-11**.
8. Add Vitest cases for ordering, neighbours, lens resolution and `project.lenses`, derived values, and taxonomy filtering. Satisfies **AC-1**, **AC-6**, **AC-8**, **AC-9**, **AC-11**.

**Milestone 4: proof content**

9. Write the profile (photo included), the about page, the three lenses, and the taxonomy entries the two projects use. Ask the owner for location, availability, the LinkedIn URL, the photo, and the about story points, rather than guessing. Satisfies **AC-13**.
10. Draft the Beccah's Kitchen public flagship from `~/Downloads/Projects/beccahs-kitchen` (and its sibling folders) and its docs. Use real results only: countable facts from the repo with their sources, and ask the owner where none exist. For the cover, use an image from the repo, or ask the owner for a screenshot. Draft `membership-charity-data-migration` as an on request flagship, from summary level facts only and with no client name anywhere (slug, title, descriptor, text). Show the owner the full on request text and get approval before committing it. Satisfies **AC-1**, **AC-2**, **AC-13**.
11. Add a Vitest case that runs `checkContent` over the real generated collections in both draft modes, then run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`. Satisfies **AC-13**.

## Consequences

**Positive**:
- On request privacy rests on structure, checked on staged content before a local commit exists, not on remembering to hide something at render.
- Every rule, including references, runs on every content build: at commit, typecheck, test, CI, and deploy.
- Pages get one typed, pure import with content already ordered, filtered, and resolved. The type system stops a page from reading a field a project variant can't have.
- Every case study tells the same six part story, and Ask AI gets plain text sections for free.

**Negative / tradeoffs**:
- More up front ceremony: a new tag means a new YAML file, and a promotion touches the project file and `flagshipOrder`.
- Fixed H2 headings constrain the writing. A case study that wants a different shape needs a spec change.
- Every commit touching `content/`, and every typecheck, test, and build, runs the content build and check, which adds seconds and grows with the MDX.
- The production minimums run at commit too, so you can't commit a state where a lens holds only drafts.
- The hook only protects local commits made with husky installed. `--no-verify`, the web editor, and the content admin bypass it, and CI then catches a leak only after it is in history.
- The check modules must use `.ts` extension imports and erasable syntax so Node can run them, which differs from the rest of the codebase.
- A visibility change from public to on request can't undo history.
- `pnpm dev` doesn't run the cross file check on each edit; a broken reference shows at commit.

**Neutral**:
- The `content-collections` and `zod` skills are installed in `.claude/skills/` only (copied, not mirrored into `.agents/skills/` like the existing ones).
- Images are stored as source paths. Resizing and the picture component stay with spec 0001's image script.

## Follow-up

- [ ] Record in root `AGENTS.md` `## Agent skills`: `content-collections` (`jackspace/claudeskillz`) and `zod` (`pproenca/dot-skills`), both in `.claude/skills/` only. On the `Declined:` line: the other Zod skills found (`anivar/zod-skill` and smaller ones), and no MCP server for Content Collections or Zod (none found).
- [ ] Content conventions (the on request rule, the six section headings, the `content/` layout, `.ts` extension imports in check modules, and `CONTENT_DRAFTS`) are project wide and belong in root `AGENTS.md` `## Rules`.
- [ ] Set `CONTENT_DRAFTS=true` in the preview Worker's Workers Builds build variables; leave it unset for production.
- [ ] Content admin (feature 18): it must run the same schemas and `checkContent` before it commits, because it bypasses the pre-commit hook.
- [ ] Request access (feature 14): decide how the Worker learns valid on request slugs (for example, a build emitted list), since it can't read content at runtime.
- [ ] Case study page (feature 7): own the image resizing script (passing SVG through) and the picture component, decide on MDX components for sections, and render sections in server components only.
- [ ] Writing (feature 17): add an `articles` collection, with related projects as slug references checked by `checkContent`.
- [ ] CV download (feature 11): may add a CV field to the lens schema if it chooses one CV per lens.
- [ ] Ask AI (feature 16): build its grounding index from the read layer's `markdown` sections and briefs (included content only).

## Rationale

Reasoning and options: see [rationale.md](rationale.md).
