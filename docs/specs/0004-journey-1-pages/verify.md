# Verify: Journey 1 pages · spec 0004 · updated 2026-11-18
_Steps derived from spec 0004 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

Run against the real static export: `pnpm build`, then serve `out/` (`pnpm serve` for the Worker plus assets at http://localhost:8787). Check each page at 390px and 1280px, in light and dark, with the keyboard, with reduced motion, and with JavaScript off.

## UI / manual

### Home
- [ ] Open `/` at 390x844 → without scrolling you see the role line and location label, the name (the only `h1`), the headline, the availability line, and all three actions (See case studies, Download CV, Contact); the same at 1280x800 → AC-1
- [ ] Sections run in order: hero (grid band), "Hiring for a specific role?" with Everything marked current, the green block for the first featured flagship, "More work" (other featured flagships, or only "See all work"), "Problems I solve", "Skills", the closing call to action → AC-1
- [ ] The green block shows the flagship's label, title, summary, up to four large result tiles, and "Read the case study" (or "See the summary" with the "Available on request" badge for an on request flagship) → AC-1
- [ ] "See case studies" jumps to `#work`, and the green block sits clear of the sticky nav → AC-1
- [ ] Each "Problems I solve" box shows the category description and its project count, and links to `/work?problem=<slug>` with that filter applied → AC-1, AC-8
- [ ] "Skills" lists each skill group with its skill names, and "See all skills" opens `/about#skills` → AC-1
- [ ] The photo is square with square corners and a hairline border: about 112px above the label on phones, about 192px in the right column from `md`; its alt text is `profile.photo.alt` → AC-2
- [ ] Set `photo.focus: 50% 0%` in `content/profile.yaml`, rebuild → the square crop moves up; remove it → the crop centres on `50% 25%` → AC-2, AC-15

### Role lenses
- [ ] Open `/for/solutions-architect` → the label is the lens name, the lead is the lens headline, the lens intro shows below it, and the name is still the `h1` → AC-3
- [ ] The lens switcher marks this lens with `aria-current="page"`; Tab reaches every option, Enter moves to another lens and back to Everything (`/`); at 390px it wraps with no sideways scroll → AC-3
- [ ] Projects follow the lens file's order; the first flagship among them is the green block and the rest are cards; "See case studies" lands on the first project section (`#work`) → AC-3
- [ ] Lens skills show name and description; a skill that about lists links to `/about#skill-<slug>`, any other is plain text; with no lens skills the section is absent → AC-3
- [ ] `/for/nope` → 404 → AC-3

### Case studies
- [ ] `/work/beccahs-kitchen`: hero label "Commerce and payments · Food and hospitality", `h1` title, summary lead, spec sheet (Client, Role, Period, Sector, Stack), the project's links as external links; the cover sits beside the text from `lg` and below it on phones, shown whole, never cropped → AC-4
- [ ] The results show as the page's one green block, every result with its context; then the six sections in fixed order (Problem, Constraints, Decision and tradeoffs, What I built, Results, How AI was used) as `h2`s in a reading column; "How AI was used" ends with the AI tool names; "Skills shown" links each skill to `/about#skill-<slug>` → AC-4
- [ ] Add a diagram and a screenshot to a public flagship (with `pnpm assets`) → the diagram opens "What I built" as a figure with a working "Diagram description" disclosure; the screenshot follows the section as a captioned figure → AC-4, AC-12
- [ ] `/work/membership-charity-data-migration`: the "Available on request" badge, title, summary, spec sheet with the client descriptor only, the results green block, the four brief sections (Problem, Approach, Outcome, How AI was used), and the request panel whose "Request details" opens `/request/membership-charity-data-migration`; no project link, cover, screenshot, diagram, or client name in the HTML → AC-5
- [ ] The first case study has only "Next case study", the last only "Previous case study", each with the neighbour's title; both end with "See all work" and the closing call to action → AC-6
- [ ] A card slug at `/work/<card slug>` and `/work/nope` → 404 → AC-4

### Project library
- [ ] `/work` lists every project in library order as cards: category, title, summary, client, period, the headline result when present, up to four stack names, and the right badge; a flagship card is one link to its case study; each card has `id="project-<slug>"` → AC-7
- [ ] Add a public card with `links` and an on request card (as drafts with `pnpm dev`) → the public card shows its live and repository links and is not itself a link; the on request card shows "Request details" to `/request/<slug>` → AC-7
- [ ] Change Problem, Role, and Stack → the list filters with AND, the address becomes `?problem=&role=&stack=` (unset ones left out), the back button is not flooded with entries, and a screen reader hears "N projects" → AC-8
- [ ] Open `/work?problem=nope&role=software-developer` → Problem shows "All", Role shows Software developer, and the list is filtered by role only → AC-8
- [ ] Open `/work?problem=data-migration&role=ai-assisted-builder` → "No projects match these filters" with "Try fewer filters, or clear them to see everything."; "Clear filters" resets every select, the list, and the address to `/work` → AC-8
- [ ] Choose Stack "Claude Code" → projects that list it in `aiTools` match → AC-8
- [ ] With JavaScript off → every project shows and the filter bar is absent; with it on, the first paint is the full list, never a skeleton, and the list does not jump when the filters wake up → AC-8

### About
- [ ] `/about`: label "About", the name as `h1`, the headline lead, the 2:3 portrait with square corners; the about body as styled prose; "Skills" (`id="skills"`) with each group as an `h3` and each skill (`id="skill-<slug>"`) showing its name, description, and the projects that prove it (a flagship links to `/work/<slug>`, a card to `/work#project-<slug>`); then the closing call to action → AC-9, AC-2
- [ ] Follow a "Skills shown" link from a case study → it lands on that skill box, highlighted, clear of the sticky nav → AC-9

### CV
- [ ] The CV button reads "Download CV" with "PDF, 120 KB" beside it, is a plain `<a download>` to `/cv/omogbolahan-ajibare-cv.pdf` with `data-analytics-event="cv-download"`, and appears in the home hero, every lens hero, the about page (call to action), the contact page, and every call to action band; clicking downloads the PDF → AC-10
- [ ] Move `content/cv/cv.pdf` away and run `pnpm content` → a warning only; `pnpm build` → fails naming the missing file; `pnpm dev` → the button is a disabled "CV coming soon"; put the file back → AC-10

### Contact and request
- [ ] `/contact`: label "Contact", `h1` "Get in touch", the lead line, the availability line, GitHub and LinkedIn as external links showing their addresses, and the CV button; the HTML has the `data-form-slot="contact"` spot → AC-11
- [ ] `/request/membership-charity-data-migration`: label "Request details", the project title as `h1`, its summary, the line about sharing details privately, the same links as `/contact`, "Back to <title>" linking to the case study, `noindex`, and the `data-form-slot="request"` spot → AC-11
- [ ] `/request/beccahs-kitchen` (public) and `/request/nope` → 404 → AC-11

### Navigation, metadata, and the quality bar
- [ ] The header nav lists Work, About, and Contact; the current section has `aria-current`; a case study marks Work; a request page and a lens mark none → AC-13
- [ ] Titles: home "Omogbolahan Ajibare · Web solutions architect and software developer" (no template), a lens its `seoTitle · Omogbolahan Ajibare`, a case study its `seoTitle · …`, "About · …", "Work · …", "Contact · …", "Request details: <title> · …"; descriptions per AC-13; request pages and `/styleguide` carry `noindex` → AC-13
- [ ] On every page: one `h1`, headings in order, the grid only in the hero band, at most one green block (one on home, lenses, and case studies with results; none on library, about, contact, request), content boxes square and controls round → AC-14
- [ ] On every page at 390px, light and dark: no sideways scroll; Tab shows a visible focus ring on every control; external links say "(opens in a new tab)" to screen readers → AC-14
- [ ] With reduced motion on: nothing rises in and routes do not crossfade. With JavaScript off: every page shows all its content → AC-14

## Commands
- [ ] `pnpm content` → passes; with a `headlineHighlight` that is not in its headline (profile or a lens) it fails, naming the file and `headlineHighlight` → AC-15
- [ ] `pnpm content` with `photo.focus: center` → fails with "must be two percentages from 0 to 100" → AC-15
- [ ] `pnpm assets` → writes AVIF and WebP for the profile photo (640, 960) and the cover (600), the CV to `public/cv/`, and `.generated/assets.json`; `public/img/`, `public/cv/`, and `.generated/` are git ignored → AC-12
- [ ] Reference a missing or broken image → `pnpm assets` fails naming the file → AC-12
- [ ] Mark a project with images as a draft → `pnpm build` leaves its images out of `out/img/` → AC-12
- [ ] `grep -r "counted 2026-11-17" out/` (any result `source` text) → no match → AC-5
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` → all pass; the only new dependency is `sharp` (dev) → AC-14
- [ ] With no on request project (mark it a draft), `pnpm build` → passes; `/request/_` is a 404 placeholder → AC-11

## Value sourcing
- [ ] Change `roleLine`, `location`, and `headline` in `content/profile.yaml` → the home hero label and lead follow → Value sourcing: home hero
- [ ] Set `headlineHighlight` on the profile and on a lens → that phrase is highlighted in the home and lens leads; remove it → the lead renders plain → Value sourcing: highlighted phrase
- [ ] Change a lens's `name`, `headline`, `intro` → its hero follows → Value sourcing: lens hero
- [ ] Reorder `lensOrder` → the switcher follows → Value sourcing: lens switcher
- [ ] Reorder `featured` → the green block shows the new first flagship; a flagship with more than four results shows only the first four → Value sourcing: green block (home)
- [ ] Reorder a lens's `projects` so a card comes first → the first flagship still takes the green block; a lens with no flagship has no green block and shows all its projects as cards → Value sourcing: green block (lens)
- [ ] Add a third featured flagship → "More work" shows the second and third → Value sourcing: more work
- [ ] Add a project to a category → its count on home goes up; a draft counts only with drafts on → Value sourcing: problems I solve
- [ ] Add a skill to a group used by a project → it appears under Skills on home and about → Value sourcing: skills
- [ ] On a card: category is the first category, client is `client.name` or the descriptor, period follows `formatPeriod` (single month, "to now"), the proof is `results[0]` → Value sourcing: project card
- [ ] Case study hero label is the first category · sector; the spec sheet stack is in file order → Value sourcing: case study hero and spec sheet
- [ ] Change `flagshipOrder` → previous and next follow it → Value sourcing: previous and next
- [ ] Library order: an ongoing project before ended ones, newest end month first → Value sourcing: library
- [ ] Filter options list only categories, lenses, and stack entries that included projects use → Value sourcing: library filters
- [ ] Remove `seo` from `content/about.mdx` → the about title is "About" and the description the profile headline → Value sourcing: metadata
- [ ] Replace `content/cv/cv.pdf` with a bigger file → the size label changes after `pnpm assets` → Value sourcing: CV button
- [ ] Add a `website` link to the profile → it shows as "Website" on contact, request, and the footer → Value sourcing: contact and request links

## Acceptance-criteria coverage
- AC-1 home steps 1 to 6 · AC-2 home photo, about · AC-3 lens steps · AC-4 case study steps 1 to 3, 7 · AC-5 on request case study, source grep · AC-6 neighbours · AC-7 library cards · AC-8 library filters, problems link · AC-9 about steps · AC-10 CV steps · AC-11 contact and request, empty build · AC-12 asset commands, diagram · AC-13 nav and metadata · AC-14 quality bar, commands · AC-15 content commands, focus · AC-16 availability (shown on home, lenses, contact, call to action; check each status label) · AC-17 card period step
