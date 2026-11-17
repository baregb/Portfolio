# 0002. Content model: decision record

Build spec: [index.md](index.md).

## Context

Every page on the site (home, role lenses, case studies, library, about, and later Ask AI, Writing, and the content admin) reads the same content. Spec 0001 fixed the container: MDX files in the repo, schema checked at build by Content Collections, compiled to static files, nothing evaluated at runtime. What it left open is the shape: which entities exist, which fields each one has, how they reference each other, and which rules the build enforces.

The forces:
- **A privacy promise in a public repo.** Some projects are "available on request". Spec 0001 rules that their details must never be written to the repo, drafts and history included. A rule that relies on the template hiding fields fails the first time a file is committed with them.
- **Recruiter speed.** A role lens is a link sent with an application, so it must never open empty or out of order. Case studies need a consistent story (problem to result) that a reader can scan in seconds.
- **Honest results.** The scope bans invented outcomes, so numbers need a trail back to their source.
- **Later consumers.** Ask AI needs clean, sectioned text. The content admin (a git based editor) needs editable files rather than code. Writing and the CV will extend the model.
- **A solo maintainer.** Mistakes should fail the build with a message that names the file, not show up as a broken page in production.

## Options considered

### Option 1: Strict per type schemas, YAML taxonomies, a section splitter, and a pure rule checker (chosen)

Projects are MDX with a strict schema for each depth and visibility pair. Taxonomies, lenses, and the profile are YAML collections referenced by slug. Flagship bodies are split at build into six named sections. Rules that span files sit in a pure checker behind a typed read layer.

**Pros**: privacy enforced structurally and at commit; consistent case studies; typed, resolved reads; rules are fixture testable.
**Cons**: the most files and ceremony; fixed headings constrain the writing; every commit touching content runs the full build and check.

### Option 2: Free form MDX with string tags

One `projects` collection with loose frontmatter (`tags: string[]`, `visibility`) and a free MDX body. Pages filter and hide at render.

**Pros**: fastest to start; fewest files; any story shape.
**Cons**: on request details can be committed and only hidden at render, which breaks spec 0001's rule. Tag typos split filters. There's no guarantee of a consistent case study, and nothing for Ask AI to chunk by.

### Option 3: Typed TypeScript data plus MDX bodies

Taxonomies, lenses, and ordering as typed `const` arrays in code. MDX only for bodies.

**Pros**: the strongest compile time types; no YAML parsing; refactors are easy.
**Cons**: the content admin can't edit code, so every tag or reorder is a code change. Content and code mix in one folder, and taxonomy entries have no natural home for descriptions.

## Rationale

The privacy promise decides most of it. Only Option 1 blocks an on request leak before a local commit exists: strict schemas reject the forbidden keys, the body and image folder must be empty, and lint-staged runs the full content check on staged files. (Commits that skip the hook still get through; CI catches those afterwards.) Option 2 hides fields at render, which is exactly the failure spec 0001 warns about.

Recruiter speed and later consumers decide the rest. Fixed sections give every case study the same scannable arc, and give Ask AI quotable chunks. Lens order living in the lens file means the order you send is the order you wrote. YAML taxonomies (rather than Option 3's code constants) stay editable by the future content admin and carry descriptions for filters. The extra ceremony is a real cost, but it buys build failures that name the file, which suits a solo maintainer better than silent drift.

Calls made inside the chosen option:
- **Cross file rules live in a pure `checkContent`, run by a Node script on every content build (and so at commit through lint-staged), rather than when the read layer loads.** The first draft ran it at load, but the same model cross check showed that no page imports the read layer yet, so nothing would have enforced the rules; it also found that load time checks repeat warnings per build worker and miss the commit. The script makes every rule a commit time rule and keeps the read layer pure. Runner up: transforms with `context.documents()`, which report in watch mode but are harder to unit test.
- **lint-staged runs the check, not the later `pnpm typecheck` step,** because lint-staged hides unstaged changes while its tasks run, so the check sees exactly what is being committed.
- **Stray files and on request image folders fail the check.** A schema only validates files its collections match, and forbidding image references does not stop the image files themselves being committed.
- **The project schema is a nested discriminated union** (`visibility`, then `depth`), so errors name the failing field instead of "invalid union".
- **On request results carry no source**, and on request flagships carry `brief.ai`. The source note would describe the private system, while the AI note is required on every project by the scope.
- **The library's role filter is lens membership,** exposed as `project.lenses`, because `role` is free text and lenses are already the curated role views.
- **The LVSC proof project uses a neutral slug and title** (`membership-charity-data-migration`), because the slug and title are public, and the owner judged the client's name to be a disclosure.
- **Strict objects everywhere.** A stray key fails instead of being stripped, which matters most for on request files. Runner up: Zod's default strip, which would silently accept a committed `links:` key.
- **`aiTools` reference stack entries with `group: ai`.** This reuses the checked taxonomy rather than adding a fifth one. Runner up: free strings, which drift.
- **Briefs are plain text, up to 600 characters each.** Short plain text keeps on request copy at summary depth and out of MDX. Runner up: Markdown, which invites detail.
- **Library order puts ongoing projects first, then the newest end month.** Current work reads as current. Runner up: start month newest first.
- **Neighbours don't wrap.** A reader at the end of the story sees an end, not a loop back to the first project. Runner up: wrap around.
- **Skill group order lives in `profile.skillGroups`.** It is the one place to curate About, and it gives `skill.group` something to check against. Runner up: a group taxonomy collection, which would be one more folder for a short list.
- **`CONTENT_DRAFTS` is a separate, non public build variable.** It is read in one module and validated strictly. Runner up: deriving it from `NEXT_PUBLIC_SITE_URL`, which couples drafts to an unrelated value.
- **The Content Collections CLI runs before Next** (matching 0001's build order), not the Next config adapter, so the content build doesn't depend on Turbopack plugin support.
