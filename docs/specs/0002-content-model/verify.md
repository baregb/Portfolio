# Verify: content model · spec 0002 · updated 2026-11-17
_Steps derived from spec 0002 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

Each "break it" step changes one file, runs `pnpm content`, checks the result, then puts the file back (`git checkout -- content/` or undo the edit). Every failure must exit non zero and name the file and the field.

## Commands

- [ ] `pnpm content` on the committed content → "Content check passed: 2 projects, 3 lenses, both draft modes.", exit 0 → AC-13
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` → all pass → AC-13
- [ ] Add `links: { repo: https://example.com }` to `content/projects/membership-charity-data-migration.mdx` → fails: `links: is not allowed on an on request project` → AC-2
- [ ] Add `name: Example` under `client` in the same file → fails naming `client.name` → AC-2
- [ ] Add `source: x` to its first result → fails naming `results[0].source` → AC-2
- [ ] Remove `ai` from its `brief` → fails: `brief.ai: is required` → AC-2
- [ ] Add a line of body text under its frontmatter → fails: "an on request project must have no body text" → AC-2
- [ ] Create `content/images/membership-charity-data-migration/x.png` → fails: on request project must have no images → AC-2
- [ ] Copy the on request file to a card (`depth: card`, keep `brief`) → fails: `brief: is not allowed on an on request card` → AC-4
- [ ] Delete `## Constraints` and its text from `content/projects/beccahs-kitchen.mdx` → fails: missing section "## Constraints" → AC-3
- [ ] Swap the `## Problem` and `## Constraints` sections → fails: sections are out of order → AC-3
- [ ] Put a line of text above `## Problem` → fails: text before the first section → AC-3
- [ ] Put a fenced code block containing `## Problem` inside `## What I built` → still passes → AC-3
- [ ] Remove `cover` from Beccah's Kitchen → fails: `cover: is required` → AC-3
- [ ] Remove `source` from its first result → fails: `results[0].source: is required` → AC-3
- [ ] Set Beccah's Kitchen `sector: nope` → fails: unknown sector "nope", naming the file and `sector` → AC-5
- [ ] Add `postgres` to Beccah's Kitchen `aiTools` → fails: "is not a stack entry with group: ai", and "is also in stack" → AC-5
- [ ] Set a skill's `group` to a name not in `profile.skillGroups` → fails naming the skill file and `group` → AC-5
- [ ] Set Beccah's Kitchen `status: draft` → fails in production mode: the AI assisted builder lens has no projects, plus a warning that the draft is dropped → AC-7
- [ ] `CONTENT_DRAFTS=maybe pnpm build` → fails: `CONTENT_DRAFTS must be "true", "false", or unset` → AC-7
- [ ] Remove `membership-charity-data-migration` from `profile.flagshipOrder` → fails: flagship is missing → AC-8
- [ ] List `beccahs-kitchen` twice in `profile.featured` → fails: listed more than once → AC-8
- [ ] Set `period: { start: 2026-09, end: 2026-08 }` on Beccah's Kitchen → fails: `period.end: must not be before start` → AC-10
- [ ] Set `period.start: 2026-9` → fails, showing the YYYY-MM form → AC-10
- [ ] Set `updated: 17/11/2026` → fails, showing the YYYY-MM-DD form → AC-10
- [ ] Set the cover `src` to `/beccahs-kitchen/cover.jpg`, then `../cover.jpg`, then `beccahs-kitchen/cover.gif`, then `beccahs-kitchen/missing.jpg` → each fails with its own message → AC-10
- [ ] Rename `content/sectors/charity.yaml` to `Charity.yaml` → fails: slug must be kebab case (plus the unknown sector it leaves behind) → AC-10
- [ ] Set a link to `http://example.com` → fails: must be an https URL → AC-10
- [ ] Add `content/notes.md` → fails: matches no collection and is not an image → AC-12
- [ ] Add an unreferenced `content/images/beccahs-kitchen/old.png` → fails: image is not referenced → AC-12
- [ ] Stage a broken content file and run `git commit` → the pre-commit hook stops the commit → AC-12

## Value sourcing (read layer)

Check these by rendering the value on a scratch page with `pnpm dev`, or in a Vitest case over `createContentReader`:

- [ ] `getProject("beccahs-kitchen").slug` is the filename → value: slug
- [ ] Its six `sections` each hold `{ code, markdown }`, headings removed, and no two `code` values are the same → value: sections
- [ ] `seoTitle` and `seoDescription` equal `title` and `summary`; add `seo.title` and it wins → value: SEO fallbacks
- [ ] `clientLabel` is "Beccah's Kitchen"; remove `client.name` and it becomes the descriptor → value: clientLabel
- [ ] `headlineResult` is the "1,277" result; reorder `results` and it follows `results[0]` → value: headlineResult
- [ ] `sector`, `categories`, `stack`, `skills`, `aiTools` come back as named objects, and `primaryCategory` is the first category → value: resolved taxonomy
- [ ] `lenses` lists every lens that names the project, in `profile.lensOrder`; reorder `lensOrder` and it follows → value: project lenses
- [ ] The AI note comes from the `ai` section (public flagship), `brief.ai` (on request flagship), or `aiNote` (cards) → value: AI note
- [ ] With `CONTENT_DRAFTS=true` a draft project appears in `getProjects()`; unset, it does not → value: drafts flag
- [ ] `getProjects()` puts ongoing projects first, then by end month and start month newest first, then title, then slug → value: library order
- [ ] `getFlagships()` follows `profile.flagshipOrder` minus excluded drafts; `getFlagshipNeighbours` has no `previous` on the first and no `next` on the last → value: flagship order and neighbours
- [ ] `getFeatured()` follows `profile.featured` minus excluded drafts → value: featured
- [ ] `getLenses()` follows `profile.lensOrder`, each lens keeping its file order, with SEO falling back to `name` and `headline` → value: lens order and SEO
- [ ] `getCategories()`, `getStackEntries()` (stack plus aiTools), and `getSectors()` list only entries an included project uses, in name order → value: taxonomy getters
- [ ] `getSkillGroups()` follows `profile.skillGroups` and drops skills and groups with no included project → value: skill groups
- [ ] `updated` is "2026-11-17" on Beccah's Kitchen (for the sitemap later) → value: lastmod
- [ ] A card or on request project exposes `visibility` for the badge and has no `links` field to read → value: card badge

## Acceptance-criteria coverage

- AC-1: value sourcing steps, `features/content/read.test.ts`, `content.test.ts`
- AC-2: on request break steps, `schema.test.ts`, `check.test.ts`, `sections.test.ts` (`bodyTextError`)
- AC-3: section and cover break steps, `sections.test.ts`, `schema.test.ts`
- AC-4: card brief step, `schema.test.ts`, `read.test.ts` (flagships only)
- AC-5: reference break steps, `check.test.ts`
- AC-6: lens value steps, `read.test.ts`
- AC-7: draft and `CONTENT_DRAFTS` steps, `check.test.ts`, `read.test.ts`, `env.test.ts`
- AC-8: flagshipOrder and featured steps, `check.test.ts`, `read.test.ts`
- AC-9: library order step, `read.test.ts`
- AC-10: format and image path steps, `schema.test.ts`, `check.test.ts`
- AC-11: taxonomy and skill group steps, `read.test.ts`
- AC-12: stray file, orphan image, and hook steps, `check.test.ts`
- AC-13: the first two commands, `content.test.ts`
