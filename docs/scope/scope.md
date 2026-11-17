# Scope: Omogbolahan Ajibare, Portfolio

A personal portfolio that shows you as a web solutions architect, software developer, and AI assisted builder (prompt engineering, vibecoding). It is aimed at hiring managers, recruiters, and freelance clients. Work is organised around the problems you solved, using projects from `~/Downloads/Projects`. Some projects are shown in full, others as "available on request" (a summary with no links or screenshots, plus a way to ask for details).

**Build approach:** Journey (finish one complete visitor path, every step and state polished, before starting the next).
**Workflow:** Alpha (after `/develop`, run `/check verify` on the real site). The project default level of rigor. `/architect` is the recommended first stop for a feature with a real decision, but skippable when you already know the build. Any feature can carry its own tag (e.g. `· Beta`) to do more or less. Features that take visitor input (contact, request access, Ask AI, admin) carry `· Beta`, which adds `/test`.

_These are recommendations to keep your build orderly, not requirements. Skip anything that does not fit: if you already know how to build a feature, use `/develop` and skip `/architect`. You decide when a feature is `done`._

**Target:** first launch (Journey 1 and Journey 2) within about a month of 2026-11-16.

**Fast track (2026-11-17):** to reach launch sooner, related features share one spec and one build pass instead of running `/architect` → `/develop` → `/check verify` each on their own. That takes the launch path from 13 design-and-build cycles to 5:
- **A. Design system** (#4): its own spec, since every page depends on it.
- **B. Journey 1 pages** (#5, #6, #7, #9, #10, #11): one spec, one build, one verify. They all read the content model and share the design system.
- **C. Flagship content** (#8): no spec. Draft each case study straight from its repo into `content/projects/`; `pnpm content` already enforces the rules. Runs alongside B.
- **D. Forms** (#12, #14): one spec, since contact and request access share the same Worker pipeline (Origin, Turnstile, honeypot, rate limit, D1, email). Stays Beta.
- **E. SEO, analytics & launch** (#13, #15): no spec. The choices follow from spec 0001 (Cloudflare), so go straight to `/develop`.
Journeys 3 to 5 (#16 to #18) come after launch and are unchanged.

## At a glance

| # | Feature | Phase | Status |
|---|---------|-------|--------|
| 1 | Stack & architecture | Foundation | done |
| 2 | Coding standards & tooling | Foundation | done |
| 3 | Content model | Foundation | done |
| 4 | Design system & UI foundation (A) | Foundation | in-progress |
| 5 | Home page (B) | Journey 1 | planned |
| 6 | Role lenses (B) | Journey 1 | planned |
| 7 | Case study page (B) | Journey 1 | planned |
| 8 | Flagship case studies (C) | Journey 1 | planned |
| 9 | Project library (B) | Journey 1 | planned |
| 10 | About & skills (B) | Journey 1 | planned |
| 11 | CV download (B) | Journey 1 | planned |
| 12 | Contact (D) | Journey 1 | planned |
| 13 | SEO, social cards & analytics (E) | Journey 1 | planned |
| 14 | Request access (D) | Journey 2 | planned |
| 15 | Launch (E) | Launch | planned |
| 16 | Ask AI about my work | Journey 3 | planned |
| 17 | Writing | Journey 4 | planned |
| 18 | Content admin | Journey 5 | planned |

## Foundations

### 1. Stack & architecture · done · Beta
Decide how the site is built, where content lives, where it is hosted, the domain, and git hosting, then scaffold a runnable project. It is a personal project, so it uses your personal identity, not VerdantDevCore. The choice should leave room for the later AI chat and content admin without a rebuild.
**Done when:** the decision is recorded in a spec, and the empty scaffold boots locally and passes a production build.
- [x] Decide the stack (spec): `/architect stack & architecture`
- [x] Scaffold from the decision: `/develop stack & architecture`
- [x] Verify it: `/check verify stack & architecture`
- [x] Test it: `/test stack & architecture`
Spec [0001](../specs/0001-stack-architecture/index.md) · code in `app/`, `worker/`, `wrangler.jsonc`

### 2. Coding standards & tooling · done
Capture conventions and tooling from the real scaffolded project, then install lint, format, and checks.
**Done when:** root `AGENTS.md` reflects the real stack, and lint, format, and typecheck run clean.
- [x] Capture conventions + tooling choices: `/audit`
- [x] Build it: `/develop tooling`
  - [x] ESLint (Next, TypeScript, jsx-a11y) and Prettier (Tailwind plugin)
  - [x] Pre-commit hook: husky + lint-staged, then typecheck
  - [x] GitHub Actions CI: lint, format check, typecheck, test, build
Code in `eslint.config.mjs`, `prettier.config.mjs`, `.husky/`, `.github/workflows/ci.yml`

### 3. Content model · done · Beta
The shape of everything the site shows: a project (problem, constraints, decision and tradeoffs, what was built, result, stack, a "how AI was used" note), its visibility (public or available on request), problem categories, role lens tags, and featured order. Every page reads from this.
**Done when:** one project can be described fully in the model, tagged for any role lens, and marked public or on request, with no page needing a field the model lacks.
- [x] Design it (spec): `/architect content model`
- [x] Build it: `/develop content model`
  - [x] Tooling and schemas: packages, scripts, lint-staged and CI wiring, strict collection schemas, a proven failing check (AC-2, AC-4, AC-7, AC-10, AC-12)
  - [x] Build rules: section splitter, `checkContent` and the check script, rule test suites (AC-2, AC-3, AC-5, AC-7, AC-8, AC-10, AC-12)
  - [x] Read layer: typed read functions, ordering, drafts, derived values (AC-1, AC-6, AC-8, AC-9, AC-11)
  - [x] Proof content: profile, about, three lenses, Beccah's Kitchen, membership charity data migration (AC-13)
- [x] Verify it: `/check verify content model`
- [x] Test it: skipped, the build already shipped 143 Vitest tests covering every rule, and verify passed
Spec [0002](../specs/0002-content-model/index.md) · code in `features/content/`, `content-collections.ts`, `scripts/check-content.ts`, `content/`

### 4. Design system & UI foundation · in-progress
Visual identity and base components, held to your premium app standard: light and dark theme switcher, purposeful motion that respects reduced motion, loading states everywhere, themed toasts and modals (no native dialogs), and WCAG 2.2 AA.
**Done when:** `design.md` covers type, colour, spacing, motion, and components; base components work by keyboard and in both themes.
- [x] Design it (spec): `/architect design system & UI foundation`
- [ ] Build it: `/develop design system & UI foundation`
  - [ ] Tokens, fonts, and theme: colour, type, and motion tokens, IBM Plex, the no flash theme script and switcher, contrast and no literal colour tests, `no-alert` (AC-2, AC-3, AC-4, AC-5, AC-6, AC-9, AC-14)
  - [ ] Components: primitives, form fields, `Modal`, `Toaster` (AC-6, AC-8, AC-9, AC-10, AC-11)
  - [ ] Shell, motion, and styleguide: skip link, header with mobile menu, footer, loading skeleton, view transitions, section entry, `/styleguide` (AC-7, AC-11, AC-12, AC-13)
  - [ ] `docs/design.md` and a green check run (AC-1, AC-15)
- [ ] Verify it: `/check verify design system & UI foundation`
Spec [0003](../specs/0003-design-system.md)

## Journey 1: The recruiter path

A hiring manager opens the link you sent with an application, sees quickly that you fit the role, reads proof, and downloads your CV or gets in touch. Built completely, every state included, before anything else.

### 5. Home page · planned · needs a decision
Your positioning in one look: who you are, the problems you solve, the strongest proof, and clear paths into the role lenses, case studies, CV, and contact.
**Done when:** a first time visitor can tell within one screen what you do and reach a case study, the CV, or contact in one click, on phone and desktop.
**Fast track B:** designed and built with the other Journey 1 pages: `/architect journey 1 pages`, then `/develop journey 1 pages`.
- [ ] Design it (spec): `/architect journey 1 pages` (shared with #5, #6, #7, #9, #10, #11)

### 6. Role lenses · planned · needs a decision
A tailored view per role (solutions architect, software developer, AI assisted builder and prompt engineering, plus any others you add) with its own headline, ordered projects, and skills, at a link you can send with each application.
**Done when:** each lens has a shareable address, shows a headline and project order for that role, and a visitor can switch lenses or see everything.
**Fast track B:** designed and built with the other Journey 1 pages: `/architect journey 1 pages`, then `/develop journey 1 pages`.
- [ ] Design it (spec): `/architect journey 1 pages` (shared with #5, #6, #7, #9, #10, #11)

### 7. Case study page · planned · needs a decision
The template every case study uses: problem, constraints, decision and tradeoffs, a simple architecture diagram, what was built, results, stack, and how AI was used. On request projects show the summary and a request button instead of links and screenshots.
**Done when:** a public and an on request case study both render fully, with next and previous navigation and a clear way to contact or request details.
**Fast track B:** designed and built with the other Journey 1 pages: `/architect journey 1 pages`, then `/develop journey 1 pages`.
- [ ] Design it (spec): `/architect journey 1 pages` (shared with #5, #6, #7, #9, #10, #11)

### 8. Flagship case studies · planned
Write the 6 to 8 deep case studies, drafted from each project's repo and docs and approved by you. Suggested picks (swap any): LVSC data migration and membership app, Ledger Engine, Webstore with two currency payments, LoveSeal messages modernisation, VerdantDevCore WordPress rescue, Beccah's Kitchen, and your spec driven AI workflow as its own story. The decision is the final picks, the angle of each, and which are public or on request.
**Done when:** every flagship is written, approved by you, marked public or on request, and has real numbers or facts in its results (no invented outcomes).
**Fast track C:** no spec. The picks above are the starting list; draft each from its repo, you approve it, and `pnpm content` enforces the rules.
- [x] Design it (spec): skipped, fast track
- [ ] Draft them: `/develop flagship case studies` (can run alongside B)

### 9. Project library · planned · needs a decision
Every other project from the folder as a short card, filterable by problem, role, and stack, with clear "available on request" badges.
**Done when:** all chosen projects appear, filters work and are reflected in the address, and empty filter results show a helpful state.
**Fast track B:** designed and built with the other Journey 1 pages: `/architect journey 1 pages`, then `/develop journey 1 pages`.
- [ ] Design it (spec): `/architect journey 1 pages` (shared with #5, #6, #7, #9, #10, #11)

### 10. About & skills · planned · needs a decision
Your story, how you work (including your AI assisted workflow), and a skills section grouped by what you can do, not a wall of logos.
**Done when:** the page reads well on phone and desktop and links back to the case studies that prove each skill.
**Fast track B:** designed and built with the other Journey 1 pages: `/architect journey 1 pages`, then `/develop journey 1 pages`.
- [ ] Design it (spec): `/architect journey 1 pages` (shared with #5, #6, #7, #9, #10, #11)

### 11. CV download · planned · needs a decision
A downloadable CV that matches the site. The decision is one general CV or one per role lens, and whether it is written by hand or generated from site content.
**Done when:** a visitor can download a current CV from the home page, each role lens, and the about page, and the download is counted.
**Fast track B:** designed and built with the other Journey 1 pages: `/architect journey 1 pages`, then `/develop journey 1 pages`.
- [ ] Design it (spec): `/architect journey 1 pages` (shared with #5, #6, #7, #9, #10, #11)

### 12. Contact · planned · needs a decision · Beta
A contact form for job and project enquiries, with spam protection and a notification to you.
**Done when:** a visitor can send a message and sees a themed confirmation, invalid input shows clear errors, a failed send says so, and you are notified.
**Fast track D:** one spec for both forms, which share the Worker pipeline.
- [ ] Design it (spec): `/architect forms` (shared with #12 and #14)

### 13. SEO, social cards & analytics · planned
Metadata, sitemap, structured data, and good looking link previews for LinkedIn and messaging apps, plus privacy friendly analytics with no cookies (page views, lens visits, case study reads, CV downloads) and error monitoring.
**Done when:** every public page has a title, description, and social card; the sitemap lists them; analytics records those events without a cookie banner.
**Fast track E:** no spec; Cloudflare Web Analytics (no cookies) and Next metadata follow from spec 0001.
- [x] Design it (spec): skipped, fast track
- [ ] Build it: `/develop SEO, social cards & analytics`

## Journey 2: The available on request path

A visitor sees a project marked available on request, asks for details, and gets a confirmation, while you get notified with who asked and about which project.

### 14. Request access · planned · needs a decision · Beta
A short request form tied to a named project, with spam protection, a confirmation to the visitor, and a notification to you.
**Done when:** a request from any on request project reaches you with the project name, the visitor sees a themed confirmation, and errors are handled clearly.
**Fast track D:** one spec for both forms, which share the Worker pipeline.
- [ ] Design it (spec): `/architect forms` (shared with #12 and #14)

## Launch

### 15. Launch · planned
Put Journeys 1 and 2 live on your domain: production deploy, a short privacy note covering the forms and analytics, a 404 page, and a final pass on speed and accessibility.
**Done when:** the site is live on your domain over HTTPS, passes Core Web Vitals and an accessibility check, and every link and form works in production.
- [ ] Ship it: `/develop launch`

## Journey 3: Ask AI about my work

A visitor asks a question about your work and gets an accurate answer based only on your published content, with links to the relevant case studies and a path to contact you. It also serves as a live prompt engineering showcase.

### 16. Ask AI about my work · planned · needs a decision · Beta
A chat grounded in your case studies, skills, and CV, that never reveals on request details and admits when it does not know.
**Done when:** answers cite the matching case studies, on request projects stay at summary level, off topic or abusive questions are handled politely, and running costs have a cap.
- [ ] Design it (spec): `/architect ask AI about my work`

## Journey 4: Writing

A visitor reads an article about a real decision you made, follows it to the related case study, and gets in touch.

### 17. Writing · planned · needs a decision
An article list and article page, linked to related case studies, with the first two articles published (for example, choosing video hosting by cost for a course platform).
**Done when:** the list and article pages render with SEO and social cards, each article links its related case study, and two articles are live.
- [ ] Design it (spec): `/architect writing`

## Journey 5: Content admin

You sign in privately, add or edit a project, case study, or article, preview it, and publish it without touching code.

### 18. Content admin · planned · needs a decision · Beta
A private dashboard for managing site content, behind sign in that only you can use.
**Done when:** you can create, edit, preview, and publish content from the dashboard, nobody else can reach it, and changes appear on the live site.
- [ ] Design it (spec): `/architect content admin`

## Deferred
Out of scope for this build pass, kept so the plan stays honest.
- **Testimonials**: quotes from clients and colleagues, once you collect them
- **Case study videos**: short motion pieces for flagship projects · needs a decision
- **CV per application**: a CV tuned to a specific job advert · needs a decision

## Legend

**The decision box.** Every feature carries exactly one, the sub task whose label ends with `(spec)`. Its wording varies (`Design it (spec)` normally, `Decide the stack (spec)` on Stack & architecture), so skills locate it by that `(spec)` suffix, never by an exact label. Every other box is an execution box and `/architect` never ticks one.

**Feature lifecycle**: the scope updates as a feature moves; each row is what it shows and who sets it:

| State | Set by | The feature shows |
|---|---|---|
| `planned` · needs a decision | `/scope` | one box: `Design it (spec): /architect <feature>` |
| `in-progress` (designed) | **`/architect` at spec capture** | `Design it` ticked; spec linked; `Build it: /develop <feature>` + **2 to 5 milestones**; the tier's closing boxes (`Verify it` Alpha+, `Test it` Beta+, `Review it` + `Document it` GA); any surfaced follow up enrolled |
| `in-progress` (building) | `/develop` | milestone sub boxes tick one by one; code pointer filled |
| `in-progress` (verified) | `/check verify` | `Build it` + milestones ticked; `Verify it` ticked |
| `done` | **you, when you decide it is** (any skill sets it when you say so); `/sync` reconciles | boxes you ran ticked, skipped ones marked skipped; the tier's last stage (`Prototype` after `/develop`; `Alpha` after `/check verify`; `Beta`/`GA` after `/test`) is the suggested point to call it done; `/sync` captures conventions |

- **Next step** = the first unticked box (always a command or a tracked milestone).
- **needs a decision** = run `/architect` first; otherwise straight to `/develop` (or `/audit` for standards & tooling). The tag drops once the spec is captured.
- **Atomic build tasks live in the spec's `## Build plan`, not here**: the scope carries only the milestone rollup.
- **Status** `planned` → `in-progress` → `done`, plus `existing` (pre workflow) and `dropped` (taken out of scope, kept for history).
- **Approach tag** beside a heading overrides the project default for that feature; no tag means it inherits it.
- **Workflow tier tag** beside a heading (e.g. `· Beta`) sets that one feature's rigor above or below the project default; no tag inherits the default. It decides the feature's check boxes and each skill's next suggestion.
- **Workflow** (header line) is the project default, what runs after `/develop`: **Prototype** = nothing (trust develop's own build time self check); **Alpha** = `/check verify`; **Beta** = `/check verify` then `/test`; **GA** = adds a fresh model `/check review` then `/document`. A feature built on an unratified decision (an `Assumed` spec) stays flagged, but that never blocks `done`.
- **Pointer line** (`spec <n> · code in <path>`): the spec link added by `/architect`, the code path by `/develop`.
