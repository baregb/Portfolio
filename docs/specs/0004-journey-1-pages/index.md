# 0004. Build the recruiter path as static pages composed from content and the design system

**Date**: 2026-11-18
**Status**: In Progress

## Summary

This spec designs every page on the recruiter path in one go: home, the role lens pages, the case study page, the project library, about and skills, the CV download, and a simple contact page. Every page is a static file built from the content in `content/` (spec 0002) and drawn only with the design system's tokens and components (spec 0003), so a change of art direction never means rewriting a page. Home leads with proof (your strongest case study as the green block with real numbers), each lens is a tailored copy of home at its own address that you can send with an application, and the CV is one PDF you supply. The contact and request details pages ship now with your links, and group D later adds the forms to those same pages, so no link ever breaks.

## Requirements

**User stories**:
- As a hiring manager opening the link from an application, I want to see within one screen who you are, what you do, and where the proof is, so I can decide quickly whether to read on.
- As a recruiter for a specific role, I want a page tailored to that role, with the most relevant projects first, so I don't have to dig.
- As a technical reviewer, I want each case study to show the problem, the constraints, the decision and its tradeoffs, what was built, the results, and how AI was used, so I can judge how you think.
- As a visitor, I want to filter all your projects by problem, role, and stack, and share the filtered view by its address.
- As any visitor, I want to download your CV or get in touch in one click from home, any lens, and the about page.
- As the site owner, I want every page to come from my content files, so adding a project or a lens never needs code.

**Acceptance criteria**:
- **AC-1 (home, proof first)**: `/` renders, in this order: (1) the hero band with the grid pattern: a label (`roleLine` · `location`), the name as the only `h1` (display size), the profile headline as the lead with its highlighted phrase (AC-15), the availability line (AC-16), the photo (AC-2), and three actions: "See case studies" (primary, jumps to the featured section `#work`), the CV button (AC-10), and "Contact" (to `/contact`); (2) the lens switcher with "Everything" marked current (AC-3); (3) the first `getFeatured()` flagship as the page's one green block, with up to four of its `results` as large stat tiles (the tile row is left out when it has no results; the label, title, summary, and link always render) and a link to its case study ("Read the case study", or "See the summary" with the "Available on request" badge when it is on request); (4) "More work": the remaining featured flagships as project cards plus a "See all work" link to `/work` (only the link when no other featured flagship exists); the featured section carries `id="work"`; (5) "Problems I solve": each `getCategories()` entry with its description and project count, linking to `/work?problem=<slug>`; (6) "Skills": each `getSkillGroups()` group with its skill names, linking to `/about#skills`; (7) the closing call to action band (contact and CV). At 390px and at 1280px wide, the name, role line, headline, and all three hero actions are visible without scrolling.
- **AC-2 (photo)**: On home and every lens the hero is split (changed 2026-11-18 at your request): from `md` the profile photo fills the right side of the hero band from top to bottom and out to the screen edge; on phones it runs full width across the top of the hero as a band about a quarter of the screen tall, so the hero actions still fit on the first screen of home. Square corners and a hairline border. The crop centres on `profile.photo.focus` (default `50% 25%`). The about page shows the same photo as a 2:3 portrait with square corners. Alt text is always `profile.photo.alt`.
- **AC-3 (role lenses)**: Every lens in `getLenses()` has a static page at `/for/<lens-slug>` (`generateStaticParams`, `dynamicParams = false`); any other slug is a 404. It renders: the home hero, but with the label `<lens.name>`, the lead `lens.headline` (with its highlighted phrase), and `lens.intro` below it; the lens switcher with this lens marked `aria-current="page"`; the lens's projects in lens order, the first flagship among them as the green block and the rest as project cards, the first project section carrying `id="work"` for the hero's "See case studies" action; the lens's skills (name and description, linking to `/about#skill-<slug>` only when that skill appears in `getSkillGroups()`, plain text otherwise), left out when the lens has none; and the closing call to action band. The lens switcher lists every lens in `lensOrder` plus "Everything" (`/`), works by keyboard, and wraps on phones without horizontal scroll.
- **AC-4 (public case study)**: Every flagship in `getFlagships()` has a static page at `/work/<slug>`; cards and unknown slugs are a 404. A public flagship renders, in order: the hero band (label: primary category · sector; `h1` title; summary as the lead; a spec sheet with Client (`clientLabel`), Role, Period (AC-17), Sector, and Stack; the project's links as external links), with the cover image beside the text from `lg` and below it on phones, shown whole (never cropped) however tall it is; the results as the page's one green block (every result as a stat tile with its context); then the six sections in fixed order, each under an `h2` with its fixed heading text, in a measured reading column. The diagram, when present, opens "What I built" as a figure with its alt text and its `description` in a "Diagram description" disclosure. Screenshots, when present, follow "What I built" as captioned figures. "How AI was used" ends with the `aiTools` names. A "Skills shown" row links each skill to `/about#skill-<slug>`.
- **AC-5 (on request case study)**: An on request flagship at `/work/<slug>` renders the hero band with an "Available on request" badge, the title, summary, and a spec sheet with Client (the descriptor only), Role, Period, Sector, and Stack; its results, when it has any, as the green block (no source is ever rendered, for any project); then its `brief` as four `h2` sections (Problem, Approach, Outcome, How AI was used); then a request panel ("The full case study, code, and screenshots are available on request.") with a "Request details" button linking to `/request/<slug>`. It never renders links, a cover, screenshots, a diagram, or a client name (the types already forbid them).
- **AC-6 (case study navigation)**: Every case study page ends with previous and next links from `getFlagshipNeighbours(slug)` (labelled "Previous case study" and "Next case study", each showing the neighbour's title; the first page has no previous, the last no next, no wrap), a link to `/work`, and the closing call to action band.
- **AC-7 (project library)**: `/work` lists every project from `getProjects()` in library order as project cards, flagships and cards together. A project card shows: primary category, title, summary, client label, period, `headlineResult` when present, up to four stack names, and one badge ("Case study" for a public flagship, "Available on request" for any on request project). A flagship card links to `/work/<slug>`; a public card shows its live and repository links when present and is not itself a link; an on request card shows "Request details" linking to `/request/<slug>`. Each card has `id="project-<slug>"`.
- **AC-8 (library filters)**: Three labelled native selects, Problem (categories), Role (lenses), and Stack (stack entries, matching a project's `stack` plus `aiTools`), each with "All" first, filter the list. Filters combine with AND; within one filter a project matches when it has that value. The choice is written to the address as `?problem=&role=&stack=` (unset filters left out) with `window.history.replaceState` (which `useSearchParams` follows, and which avoids a navigation and a payload fetch on every change), so the back button is not flooded, and opening a filtered address restores the filters. An unknown value in the address is ignored (that select shows "All"). A polite live region announces "N projects". No match shows an empty state ("No projects match these filters") with a "Clear filters" button that resets the selects and the address. With JavaScript off, every project still shows and the filter bar is absent; with it on, the first paint shows the full list, never a skeleton.
- **AC-9 (about and skills)**: `/about` renders the hero band (label "About", the name as `h1`, the profile headline as the lead, the 2:3 portrait), the about body as styled prose, then "Skills" (`id="skills"`): each `getSkillGroups()` group as an `h3` with its skills, each skill (`id="skill-<slug>"`) showing its name, description, and the projects that prove it (a flagship links to `/work/<slug>`, a card to `/work#project-<slug>`), then the closing call to action band.
- **AC-10 (CV)**: You place one PDF at `content/cv/cv.pdf`. The asset step copies it to `/cv/<name-slug>-cv.pdf` (from `profile.name`, so `/cv/omogbolahan-ajibare-cv.pdf`). The CV button reads "Download CV" with "PDF, <size>" beside it (size read from the file at build, rounded to KB), renders as a plain `<a>` (never `next/link`, so the PDF is not prefetched or routed) with the `download` attribute and `data-analytics-event="cv-download"`, and appears in the home hero, every lens hero, the about page, the contact page, and every closing call to action band. With no file, the content check only warns (so `pnpm dev`, `pnpm test`, `pnpm typecheck`, and the pre-commit hook keep working), the asset step fails the build when `CONTENT_DRAFTS` is not `true`, and with drafts on the button renders disabled with "CV coming soon".
- **AC-11 (contact and request pages)**: `/contact` renders the hero band (label "Contact", `h1` "Get in touch", a lead line), the availability line, every `profile.links` entry as an external link labelled by kind (GitHub, LinkedIn, Website) with its address shown, and the CV button. Every on request project (flagship or card) has a static page at `/request/<slug>` (other slugs are a 404) showing "Request details" as the label, the project title as `h1`, its summary, one line explaining that details are shared on request, the same links as `/contact`, and a link back to the project (a flagship to `/work/<slug>`, a card to `/work#project-<slug>`). Both pages leave a marked spot where group D mounts its form. Request pages carry `noindex`.
- **AC-12 (images)**: An asset step runs after the content build and before `next build`. It honours `CONTENT_DRAFTS` the same way the read layer does (the dev script passes `true`), and it empties `public/img/` and `public/cv/` before writing, so a removed image, or one whose project became on request, never ships. For each image the included content references (profile photo, covers, screenshots, diagrams), it writes AVIF and WebP at widths 640, 960, 1280, and 1920 that do not exceed the source width (always at least one, at the source width when it is under 640) as `public/img/<src without extension>-<width>.<avif|webp>`, copies SVG diagrams unchanged (their width and height come from sharp metadata; an SVG with neither a size nor a `viewBox` fails), and writes a manifest of intrinsic width, height, and the widths it made, plus the CV address and size, to the git ignored `.generated/assets.json` (never into `public/`, so it is not published). A `Picture` component renders `<picture>` with AVIF and WebP sources, a `srcset`, `sizes`, `width` and `height` (no layout shift), and the alt text; it loads lazily except the hero photo and the case study cover, which load eagerly with high fetch priority. A referenced image the step cannot process fails the build, naming the file. `public/img/` and `public/cv/` are generated and git ignored.
- **AC-13 (navigation and metadata)**: The header nav lists Work (`/work`), About (`/about`), and Contact (`/contact`), with `aria-current` on the active section (a case study marks Work; a request page marks none). Every page sets its title and description: home `<name> · <roleLine>` as an absolute title (outside the template) and the profile headline; a lens `seoTitle` and `seoDescription`; a case study `seoTitle` and `seoDescription`; about `about.seo.title ?? "About"` and `about.seo.description ?? profile.headline`; a request page "Request details: <title>" and the project summary; `/work` and `/contact` fixed copy from this spec. Titles use the template `%s · <name>`. Request pages and `/styleguide` carry `noindex`. Social cards, canonical addresses, and the sitemap belong to feature 13.
- **AC-14 (quality bar)**: Every page holds the design rules: at most one green block per page: exactly one on home, on a lens with a flagship, and on a case study with results, and none on library, about, contact, or request; the grid pattern only in hero bands; content boxes square and controls round; tokens only (the literal colour scan now also covers `features/**/*.tsx`). Every page meets WCAG 2.2 AA: one `h1`, headings in order, keyboard reachable, visible focus, landmarks, link text that makes sense alone, and external links announced. At 390px wide no page scrolls sideways, in either theme. With reduced motion nothing rises or crossfades. With JavaScript off every page shows all its content. `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` pass, and the only new dependency is `sharp` (a dev dependency, chosen in spec 0001).
- **AC-15 (content model additions)**: `profile.photo` gains optional `focus` (a CSS position like `50% 25%`, two percentages from 0 to 100). `profile` and every lens gain optional `headlineHighlight` (1 to 60 characters); the content check fails, naming the file, when it is not found exactly once inside that file's `headline`. The hero wraps that phrase in the highlight style; with none set, the headline renders plain.
- **AC-16 (availability)**: The availability line shows a status mark and a fixed label per `availability.status`: `open` "Open to new roles", `selective` "Open to the right role", `unavailable` "Not looking right now", followed by `availability.note` when present. The mark uses the accent colour for `open` and `selective` and the muted colour for `unavailable`, and the status is never conveyed by colour alone.
- **AC-17 (period)**: Periods render as `Mon YYYY to Mon YYYY` with English short month names (for example "Jun 2026 to Sep 2026"), `to now` when `end` is null, and a single `Mon YYYY` when start and end are the same month.

## Decision

**Chosen option**: Option 1: one static route per page under the App Router, built only from the read layer (spec 0002) and composed only from design system components (spec 0003) plus a small set of shared portfolio pieces, with lenses as tailored home pages at `/for/<lens>`, case studies at `/work/<slug>`, client side filters in the address, and a build time asset step for images and the CV.

**Implementation skills**: `content-collections` (`jackspace/claudeskillz`, `.claude/skills/content-collections/`) for rendering compiled MDX sections · `tailwind-4-docs` (`lombiq/tailwind-agent-skills`, `.agents/skills/tailwind-4-docs/`) · `web-perf` (`cloudflare/skills`, `.agents/skills/web-perf/`) for the image pipeline and eager hero images

## Feature design

**Routes** (all static, every dynamic route has `generateStaticParams` and `dynamicParams = false`; route files stay thin and import a page component from its feature folder):

| Route | Source of params | Feature folder |
|---|---|---|
| `/` | none | `features/home/` |
| `/for/[lens]` | `getLenses()` | `features/lenses/` |
| `/work` | none | `features/library/` |
| `/work/[slug]` | `getFlagships()` | `features/case-study/` |
| `/about` | none | `features/about/` |
| `/contact` | none | `features/contact/` |
| `/request/[slug]` | `getProjects()` filtered to `visibility: "onRequest"` | `features/contact/` |

**Component inventory**:

Existing (spec 0003): `Button` gains a file mode (`file` prop: renders a plain `<a>` with `download` and passes `data-*` attributes through, never `next/link`); the rest are used as they are: `Container`, `Section` (`plain`, `grid` for hero bands, `accent` for the green block), `Card`, `Tag`, `Badge`, `StatTile`, `SpecSheet`, `Button`, `TextLink`, `Icon`, `VisuallyHidden`, the site header, footer, and skip link.

Net new, shared across pages (`components/portfolio/`, content aware composites, tokens and existing components only):

| Component | Props (key) | Used by |
|---|---|---|
| `PageHero` | `label`, `title` (the `h1`), `lead`, `highlight?`, `children` (actions, extra text), `media?` | home, lens, about, contact, request, library |
| `HighlightedText` | `text`, `phrase?` | `PageHero` |
| `ProfilePhoto` | `photo`, `variant: "square" \| "portrait"`, `priority?` | home and lens heroes, about |
| `Availability` | `availability` | home and lens heroes, contact |
| `LensSwitcher` | `lenses`, `current: string \| null` (`null` = Everything) | home, lens |
| `FeaturedProject` | `project: Flagship` | home, lens (the green block) |
| `ProjectCard` | `item: LibraryItem` (a slim view model built on the server by `toLibraryItem(project)`) | home, lens, library |
| `CtaBand` | `cv: CvAsset` | home, lens, case study, about |
| `CvButton` | `cv: CvAsset`, `variant` (uses the new `Button` file mode) | heroes, `CtaBand`, contact |
| `Picture` | `image` (`src`, `alt`), `sizes`, `priority?`, `fit: "cover" \| "contain"` | photo, cover, screenshots, diagram |
| `Prose` | `code` (compiled MDX) | case study sections, about body |
| `ExternalLinks` | `links: readonly { label, href }[]`, built by `profileLinks(profile)` (labels from `LINK_LABELS`) and `projectLinks(project)` ("Live site", "Repository", then each `other[].label`) | case study hero, project card, contact, request |

`Prose` renders compiled sections with `MDXContent` from `@content-collections/mdx/react` and an element map (`h3`, `h4`, `p`, `ul`, `ol`, `li`, `a` → `TextLink` with `external` set for `https:` links, `strong`, `em`, `code`, `pre`, `blockquote`, `hr`, `table`) styled with tokens, inside `max-w-prose`. No typography plugin. Sections render in server components only.

**Page composition**: as written in AC-1 (home), AC-3 (lens), AC-4 to AC-6 (case study), AC-7 and AC-8 (library), AC-9 (about), and AC-11 (contact and request). The home and lens pages share one `ProfilePage` composition in `features/home/` that takes `{ hero, lenses, current, projects, skills?, categories? }`, so a lens is the same page with different values, not a second design.

**Library filters** (`features/library/`): a server component maps each project to a slim `LibraryItem` (the card fields plus `categorySlugs`, `lensSlugs`, and `stackSlugs`; never whole `Project` objects, which carry compiled MDX) and passes those plus the filter options to a client component that reads `useSearchParams` inside a `Suspense` boundary whose fallback is the same full list (no skeleton, no flash). The client component and `ProjectCard` import only types from `features/content/`, never the read layer itself (it reads `process.env` and would pull every collection into the browser bundle). Filtering is a pure function `filterProjects(items, { problem?, role?, stack? })` in `features/library/filter.ts`; parsing the address is a pure `parseFilters(params, options)` that drops unknown values. Writing the address uses `window.history.replaceState`.

**Asset step** (`scripts/build-assets.ts`, Node 24 with type stripping, side effects at this edge only): reads the generated content (as `scripts/check-content.ts` does), applies `CONTENT_DRAFTS` (`parseContentDrafts`), empties `public/img/` and `public/cv/`, collects every image the included content references, writes the variants, copies `content/cv/cv.pdf` to `public/cv/<name-slug>-cv.pdf` when present (failing when it is absent and drafts are off), and writes `.generated/assets.json` as `{ images: { [src]: { width, height, widths, format: "raster" | "svg" } }, cv: { href, bytes } | null }`. Width selection is a pure function `variantWidths(sourceWidth)` (`[640, 960, 1280, 1920]` filtered to `<= sourceWidth`, or `[sourceWidth]` when that is under 640). `pnpm build` becomes `pnpm content && pnpm assets && next build`; `pnpm dev` runs `CONTENT_DRAFTS=true pnpm assets` once after the content build (run it again after adding an image). `features/media/manifest.ts` reads `.generated/assets.json` with `fs` at module scope (never a static JSON import, so `tsc` and Vitest work without it); when the file is absent it returns an empty manifest (`images: {}`, `cv: null`), and `Picture` throws for a missing image only during `next build` (`process.env.NEXT_PHASE === "phase-production-build"`), rendering nothing otherwise. It exposes `CvAsset = { href, sizeLabel } | null`.

**Data model sketch** (no database; additions to the spec 0002 content model, which stays the source of truth for everything else):

| Entity | New field | Type and rule |
|---|---|---|
| Profile | `photo.focus` | optional string, `^(100\|[1-9]?\d)% (100\|[1-9]?\d)%$`, default `50% 25%` when absent |
| Profile | `headlineHighlight` | optional string, 1 to 60, must occur exactly once in `headline` |
| Lens | `headlineHighlight` | optional string, 1 to 60, must occur exactly once in that lens's `headline` |
| CV file | `content/cv/cv.pdf` | optional file; the content check allows exactly this path in `content/cv/` and warns when it is missing; the asset step fails a build with drafts off when it is missing |

**State transitions**: library filters only: each of `problem`, `role`, `stack` is unset or one valid slug; changing a select writes the address; "Clear filters" sets all three to unset. No other state.

**API surface**: no HTTP endpoints. The interfaces are the routes above, the component props above, and these pure functions (each with a unit test):

| Function | Signature | Notes |
|---|---|---|
| `formatPeriod` | `(period: { start: string; end: string \| null }) => string` | AC-17 |
| `availabilityLabel` | `(status) => string` | AC-16 |
| `filterProjects` | `(projects, filters) => readonly Project[]` | AC-8, keeps library order |
| `parseFilters` | `(params: URLSearchParams, options) => Filters` | AC-8, drops unknown values |
| `variantWidths` | `(sourceWidth: number) => readonly number[]` | AC-12 |
| `cvFileName` | `(name: string) => string` | AC-10, `Omogbolahan Ajibare` → `omogbolahan-ajibare-cv.pdf` |
| `projectHref` | `(project: Project) => string \| null` | flagship → `/work/<slug>`, card → `null` |
| `projectAnchor` | `(project: Project) => string` | flagship → `/work/<slug>`, card → `/work#project-<slug>` |
| `requestHref` | `(project: Project) => string \| null` | on request → `/request/<slug>`, public → `null` |

**Value sourcing**:

| Action | Value produced / displayed | Source |
|---|---|---|
| Home and lens hero | name, role line, location, headline, photo, availability, links | `getProfile()` |
| Home and lens hero | highlighted phrase | `profile.headlineHighlight` / `lens.headlineHighlight` (AC-15) |
| Home and lens hero | photo crop | `profile.photo.focus`, default `50% 25%` |
| Lens hero | label, lead, intro | `lens.name`, `lens.headline`, `lens.intro` |
| Lens switcher | lens names and order, current lens | `getLenses()` (`lensOrder`); current from the route param, `null` on home |
| Green block (home) | project, its results | `getFeatured()[0]`, its `results` (first four) |
| Green block (lens) | project | first flagship in `lens.projects` order; none when the lens has no flagship (then all its projects render as cards and the page has no green block, as AC-14 allows) |
| More work | projects | `getFeatured().slice(1)` |
| Problems I solve | category name, description, count | `getCategories()`; count = included projects whose `categories` contain the slug, from `getProjects()` |
| Skills (home) | groups and skill names | `getSkillGroups()` |
| Project card | category, title, summary, client, period, proof, stack, badge, links | `categories[0].name`, `title`, `summary`, `clientLabel`, `formatPeriod(period)`, `headlineResult`, `stack.slice(0, 4)` names, `depth` + `visibility`, `links` (public only) |
| Case study hero | label | `categories[0].name` · `sector.name` |
| Case study spec sheet | client, role, period, sector, stack | `clientLabel`, `role`, `formatPeriod(period)`, `sector.name`, `stack` names in file order |
| Case study | sections, results, diagram, screenshots, cover, links, AI tools, skills | `sections.<key>.code`, `results`, `diagram`, `screenshots`, `cover`, `links`, `aiTools` names, `skills` |
| Section headings | heading text | the fixed headings in spec 0002 (`SECTIONS` in `features/content/rules.ts`) |
| On request case study | brief headings and text | fixed headings Problem, Approach, Outcome, How AI was used; text from `brief.problem`, `brief.approach`, `brief.outcome`, `brief.ai` |
| Previous and next | neighbour titles and slugs | `getFlagshipNeighbours(slug)` |
| Library | projects and order | `getProjects()` (library order, spec 0002 AC-9) |
| Library filters | options | `getCategories()`, `getLenses()`, `getStackEntries()`; project membership from `categories`, `lenses`, `stack` + `aiTools` |
| Library filters | current values | the address (`useSearchParams`), parsed by `parseFilters` |
| About | body, portrait, skills with proving projects | `getAbout().body.code`, `profile.photo`, `getSkillGroups()` |
| CV button | address, size | `cvFileName(profile.name)`; `cv.bytes` from `.generated/assets.json`, rounded to KB; `null` when the file is absent |
| Contact and request | links and their labels | `profile.links`; labels from the existing `LINK_LABELS` in the footer, moved to `components/portfolio/` and shared |
| Request page | title, summary, back link | `getProject(slug)` (on request only), `projectAnchor(project)` |
| Images | variants, dimensions | `.generated/assets.json` from the asset step |
| Metadata | titles and descriptions | per AC-13; fixed copy below |

**Fixed copy** (written here so the build does not invent it; you can edit any line in code later):
- Home section headings: "Hiring for a specific role?", "Featured case study" (green block label), "More work", "Problems I solve", "Skills".
- Closing call to action band: heading "Want to talk about a role or a project?", actions "Get in touch" and the CV button.
- `/work`: label "Work", `h1` "Projects and case studies", lead "Every project I can show, from full case studies to short summaries. Filter by the problem, the role, or the stack." Title "Work", description the same lead.
- `/contact`: lead "Hiring, or have a project in mind? Here is where to find me." Title "Contact", description "How to reach Omogbolahan Ajibare about a role or a project." (the name from `profile.name`).
- Request panel: "The full case study, code, and screenshots are available on request." Request page line: "I share the details of this project privately. Reach me through any of the links below and mention the project."
- Library empty state: "No projects match these filters" and "Try fewer filters, or clear them to see everything."

**Key invariants**:
- Pages import content only from `features/content/` and never read `content/` themselves.
- No page renders a field its project variant cannot have; the read layer's union types enforce it, so no casts.
- No `source` field is ever rendered.
- Each page has exactly one `h1`; one green block at most (AC-14).
- Every internal link targets a route this spec builds; `/request/<slug>` and `/contact` exist before group D, which only adds forms.
- Nothing needs a server: no `cookies()`, `headers()`, server actions, or runtime image work.

**Security model**: public static pages, no user data. The on request rules are enforced by the content check and the types (spec 0002); this spec adds one more guard: the request pages and on request case studies render only `title`, `summary`, `client.descriptor`, `role`, `period`, `sector`, `categories`, `stack`, `aiTools`, `skills`, `results` (without source), and `brief`. The CV PDF is public by design; keep private contact details (phone, home address) out of it.

**Configuration required**: none. No new environment variables. `sharp` is added as a dev dependency.

**Critical test scenarios**:
- Happy path: a first time visitor on a phone opens `/`, sees the name, headline, and three actions in one screen, opens the featured case study, reads it, follows next, then downloads the CV, verifies **AC-1**, **AC-4**, **AC-6**, **AC-10**
- Happy path: opening `/for/solutions-architect` shows that lens's headline, intro, and project order, and the switcher moves to another lens and back to Everything, verifies **AC-3**
- Failure case: `/work?problem=nope&role=software-developer` ignores `nope`, filters by role, and a combination with no match shows the empty state, whose "Clear filters" restores every project and a clean address, verifies **AC-8**
- Failure case: removing `content/cv/cv.pdf` fails `pnpm build` with drafts off and shows a disabled "CV coming soon" with drafts on, verifies **AC-10**
- Failure case: a `headlineHighlight` that is not in the headline fails `pnpm content`, naming the file, verifies **AC-15**
- Privacy: the on request case study and request page HTML contain no link, image, or client name, and no `source` text appears anywhere in `out/`, verifies **AC-5**, **AC-11**
- Unknown slugs: `/work/<a card slug>`, `/for/nope`, and `/request/<a public slug>` are 404s, verifies **AC-3**, **AC-4**, **AC-11**

## Build plan

Journey order: the recruiter's path is finished one step at a time, each polished in both themes, at 390px, by keyboard, and with JavaScript off before the next. Shared pieces land with the first page that needs them. Between milestones some internal links (`/work`, `/about#skill-*`, `/request/*`) point at routes a later milestone of this same build adds; that is expected, and `/check verify` runs only after M4.

1. Content model additions: `photo.focus` and `headlineHighlight` in the schemas, `headlineHighlight` added to the hand built `Lens` type and its mapping in `features/content/read.ts`, the substring check, the `content/cv/cv.pdf` rule in `checkContent` (a warning only) and the stray file rule, tests for each, satisfies **AC-15**, **AC-10**
2. Asset step: add `sharp`, write `scripts/build-assets.ts` with `variantWidths` and `cvFileName` (unit tested), draft handling, emptying the output folders, the `.generated/assets.json` manifest and `features/media/manifest.ts`, the CV copy and its production check, the git ignore entries, and wire `pnpm assets` into `build`, `dev`, and CI, satisfies **AC-12**, **AC-10**
3. Shared pieces for the hero: the `Button` file mode, `Picture`, `ProfilePhoto`, `HighlightedText`, `Availability` (with `availabilityLabel` tested), `PageHero`, `CvButton`, `CtaBand`, `ExternalLinks` (moving `LINK_LABELS` out of the footer), the title template in the root layout, satisfies **AC-2**, **AC-10**, **AC-13**, **AC-16**
4. Home: `LensSwitcher`, `FeaturedProject`, `ProjectCard` (with `formatPeriod`, `projectHref`, `requestHref` tested), the `ProfilePage` composition, `/`, and the Work, About, and Contact nav entries as each route lands, satisfies **AC-1**, **AC-2**, **AC-17**, **AC-13**
5. Case study: `Prose`, `/work/[slug]` for public and on request flagships, the diagram figure and disclosure, screenshots, previous and next, metadata, satisfies **AC-4**, **AC-5**, **AC-6**, **AC-13**
6. Contact and request: `/contact` and `/request/[slug]` with the form placeholder spot and `noindex` on request pages; run one test build with no on request project, and if an empty `generateStaticParams` breaks the export, return a placeholder param that renders `notFound()`, satisfies **AC-11**, **AC-13**
7. Role lenses: `/for/[lens]` on the `ProfilePage` composition, lens skills, metadata, satisfies **AC-3**, **AC-13**
8. Project library: `/work` with `filterProjects` and `parseFilters` (unit tested), the client filter bar in `Suspense`, the live count, the empty state, card anchors, satisfies **AC-7**, **AC-8**
9. About and skills: `/about` with the portrait, prose body, skill groups and anchors, satisfies **AC-9**, **AC-2**
10. Close out: extend the literal colour scan to `features/**/*.tsx`; note in spec 0003 that the photo is now square (superseded by spec 0004); update `docs/design.md` (square photo, the `components/portfolio/` table, page composition rules); write `verify.md` for this spec; a full lint, typecheck, test, and build run; a 390px, both themes, keyboard, reduced motion, and JavaScript off pass on every route, satisfies **AC-14**

**Milestones for the scope**: (M1) content additions, assets, hero pieces, and home, steps 1 to 4; (M2) case studies, contact, and request, steps 5 and 6; (M3) lenses and library, steps 7 and 8; (M4) about, docs, and the green check, steps 9 and 10.

## Consequences

**Positive**:
- Every page is a plain file served from the edge, so it is fast and cannot fail at runtime.
- A new project, lens, or skill needs only a content file; the pages, filters, and lens routes pick it up.
- Lenses reuse the home composition, so one design decision covers four pages, and each lens has its own address and title for applications.
- The contact and request pages exist now, so group D only adds forms and no link is ever broken.
- Pages hold no look decisions, so a new art direction stays a token and component change.

**Negative / tradeoffs**:
- The CV is a separate PDF you maintain by hand; it can drift from the site. The "PDF, size" label and the build check make a missing file loud, but not a stale one.
- Filters need JavaScript. Without it visitors see the whole list, which is fine for a few dozen projects but would not scale to hundreds.
- `headlineHighlight` duplicates a phrase from the headline; editing the headline without the highlight fails the content check, which is the point but can surprise you.
- The asset step adds build time (sharp encoding AVIF is slow) and does not watch for new images in dev.
- A lens without a flagship, or an on request case study without results, has no green block, so those pages carry less visual weight.
- The case study cover today is a tall phone screenshot (600 by 1300); shown whole it is narrow on desktop. Wider covers will look better.

**Neutral**:
- `docs/design.md` and spec 0003 (AC-14 and its direction note) said the profile photo is round; this spec makes it square (your call on 2026-11-18) and supersedes spec 0003 on that one point. Step 10 updates `design.md` and adds a note to spec 0003's photo line.
- The `LINK_LABELS` map moves from the footer to `components/portfolio/` so the footer, contact, and request pages share it.
- Social cards, canonical addresses, the sitemap, and analytics are feature 13; this spec only adds the `data-analytics-event` hook on the CV button.

## Follow-up

- [x] Add your CV PDF at `content/cv/cv.pdf` (added 2026-11-18; the content check now accepts exactly this path, the missing file warning comes in build step 1).
- [x] Add a `linkedin` entry to `profile.links` (added 2026-11-18: `https://www.linkedin.com/in/gbolahanaji`).
- [ ] Set `headlineHighlight` on the profile and each lens to pick the phrase the hero highlights.
- [ ] Feature 13 conflict to settle: spec 0001 chose Umami (custom events), but the scope's fast track note for #13 says Cloudflare Web Analytics, which has no custom events. Counting CV downloads (feature 11's "Done when") and lens visits needs custom events, so Umami as in spec 0001 fits; fix the scope note when building #13.
- [ ] Group D (forms): mount the contact form at the marked spot on `/contact` and the request form on `/request/<slug>`; the valid on request slugs are exactly this spec's `/request/[slug]` params, which answers spec 0002's open question on how the Worker learns them (emit the same list at build).
- [ ] Feature 15 (launch): design the 404 page; this spec uses the Next default.
- [ ] `/sync` after the build: record the `components/portfolio/` layer, the asset step, and the "pages compose only" rule in root `AGENTS.md`.

## Rationale

Reasoning and options: see [rationale.md](rationale.md).
