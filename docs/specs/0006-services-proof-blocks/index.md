# 0006. Add service pages for clients and shared proof blocks (track record, FAQ, testimonials, client logos)

**Date**: 2026-11-19
**Status**: In Progress

## Summary

The site gains a second audience: people who want to hire you for a project. A new Services section (`/services` and one page per service) sells four services with what is included, a numbered track record, related projects, quotes, and honest answers, and hands the enquiry to the existing contact form. The same proof blocks (track record, FAQ, testimonials, client logos) also land on the recruiter pages, so every lens can lead with its strongest numbers. Everything stays static content in `content/`, checked at build; every number lives once, on its project, and pages point at it.

## Requirements

**User stories**:
- As a business owner looking for a developer, I want a page for the service I need that shows what you do, proof with numbers, and straight answers, so I can decide to get in touch.
- As a hiring manager on a role lens, I want the strongest numbers for that role near the top, so I see the fit in seconds.
- As any visitor, I want to see who you have built for and what they said.
- As the site owner, I want every service, quote, logo, and number in content files, checked at build, with each number written in one place only.

**Acceptance criteria** (the contract):

*Content model*
- **AC-1 (services collection)**: `content/services/<slug>.yaml` holds `status` (`draft` or `published`), `name` (1 to 40), `tagline` (1 to 60), `headline` (1 to 120), optional `headlineHighlight` (1 to 60, found exactly once in `headline`, same rule as lenses), `intro` (1 to 400), `offerings` (3 to 4 items of `{ title (1 to 40), description (1 to 160) }`), `trackRecord` (0 to 3 result refs, AC-2), `projects` (at least 1 project slug), `faq` (0 to 6 items of `{ question (1 to 120), answer (1 to 600) }`), optional `seo` (`{ title, description }`, same shape as lenses). `profile.serviceOrder` lists every service exactly once and nothing else (checked before drafts drop, like `flagshipOrder`); `checkHighlights` covers each service file; the fallback title `<name> in <profile.base>, working worldwide` must fit in 70 characters (the `seo.title` cap), else the check fails and asks for `seo.title`. The content check fails, naming the file and field, on any broken rule.
- **AC-2 (result ids and refs)**: both result schemas (`publicResult` and `onRequestResult`) gain optional `id`: lowercase letters, digits, and single hyphens, 1 to 40 characters. `check.ts` fails when two results in one project share an id (field `results[i].id`). A result ref is the string `<project-slug>/<result-id>`; the schema checks its shape (`^slug/id$`), and `check.ts` fails when it names an unknown project or result id, or when one list repeats a ref. Lenses gain `trackRecord` (0 to 3 refs) and `faq` (0 to 6 items, same shape as AC-1).
- **AC-3 (testimonials collection)**: `content/testimonials/<slug>.yaml` holds `quote` (1 to 400), `name` (1 to 80), optional `role` (1 to 60), optional `company` (1 to 80), optional `project` (an existing project slug), optional `photo` (`{ src, alt (0 to 200, empty means decorative since the caption names the person) }`, `src` under `testimonials/`, through the asset step), and `permission` (an ISO date `YYYY-MM-DD`, parsed with the same preprocess as project `updated`, never rendered). `permission` must not be after `today`, a UTC `YYYY-MM-DD` that `scripts/check-content.ts` passes to the pure `checkContent` (tests inject it). The check fails when a testimonial linked to an on request project sets `company` or `photo` (either could identify a private client). `profile.featuredTestimonials` names 0 to 2 existing testimonials.
- **AC-4 (profile additions)**: `profile` gains, required: `base` (1 to 60, "Lagos"; the city for search titles, while `location` stays the visitor facing "Remote (worldwide)"), `availability.projects` (`open`, `limited`, or `closed`), and `services` (`{ headline (1 to 120), headlineHighlight? (1 to 60, found once, through `checkHighlights`), intro (1 to 300) }`); defaulting to `[]`: `clients` (0 to 12 items of `{ name (1 to 80), logo, permission, project? }`), `serviceOrder`, and `featuredTestimonials`. A client `logo` is `imageSrc(["svg"])` under `clients/` and must exist; its width and height or viewBox is checked by the asset step (`svgHasSize`), so a bad SVG fails `pnpm build`, not `pnpm content`. A client `permission` follows the testimonial rule. The check fails when a client's `project` is on request (a logo would name a private client).
- **AC-5 (drafts)**: production builds drop draft services. `checkProduction` warns, in its current message format (`<field>: draft "<slug>" is dropped in production (drafts excluded)`, with the file), for: a draft project in a service's `projects` or `trackRecord`, in a lens `trackRecord`, or in a testimonial's `project`; a testimonial in `profile.featuredTestimonials` that drops because its project is a draft; a draft service in `serviceOrder`; and a published service left with no included project (which then drops out too). The reader drops these silently. Any section that ends up empty is not rendered. Drafts show in `pnpm dev` as they do today.
- **AC-5b (no published service)**: while no service is published, production shows no Services nav item, no home services band, no `/services` sitemap entry or card, and no service pages (`/services/[service]` keeps spec 0004's placeholder param that renders `notFound()`). `/services` still builds, with the hero and CTA band only, and carries `noindex`.

*Shared blocks*
- **AC-6 (track record)**: a section headed "Track record" (`id="track-record"`) lists the resolved refs in order as an `ol`, numbered `01` to `03` (the visible numbers `aria-hidden`). Each item (value and label as an `h3`) shows the result `value` (large), `label`, `context` when present, and the project title, linked to `/work/<slug>` when the project is a flagship and plain text when it is a card. Two tones: `plain` on lenses and `green` on service pages, where it is the page's one green block.
- **AC-7 (FAQ)**: a section headed "Questions, answered" lists each item as a native `details` and `summary` (closed at first, question as the summary, answer below). It opens by keyboard and pointer, shows a visible focus ring, and needs no JavaScript: `faq.tsx` is server markup, each `details` carrying `data-analytics-faq="<question>"` for AC-17.
- **AC-8 (testimonials)**: a section headed "What clients say" shows each quote as a `figure` with `blockquote` and `figcaption` (name, then `role · company` when present, the square photo when present). It renders on a case study (quotes linked to that project, after Key results), on a lens or service (quotes linked to any of its included projects, ordered by that page's project order, then by file name), and on home (`profile.featuredTestimonials`, in that order). On a case study, quotes are ordered by file name. A photo with empty `alt` is decorative.
- **AC-9 (client logos)**: a section labelled by an `h2` "Clients I've built for" (label style) lists `profile.clients` in order as a `ul`. Each logo is drawn in a single colour (the muted text token) from its SVG through CSS `mask-image` (URL from the asset manifest's `svgPath`, aspect ratio from its width and height, set inline), with `role="img"` and `aria-label` set to the client name; under `forced-colors: active` it uses `CanvasText` with `forced-color-adjust: none` so it stays visible. Logos do not link anywhere. It renders on home (right after the hero), `/services` (after the hero), each service page (after the hero), and `/about` (after the about body, before Skills).

*Client path*
- **AC-10 (services index)**: `/services` renders the hero band (grid pattern, no photo): label "Freelance", "Services" as the only `h1`, `profile.services.headline` as the lead with its highlight, `profile.services.intro` below it, the project availability line (AC-13), and "Start a project" (primary, to `/contact?topic=project`). Then the logo strip, then "What I can do for you" (`h2`): an `ol` with one card for each published service in `serviceOrder`, numbered `01` onward (numbers `aria-hidden`), showing name (`h3`, linking to the page), tagline, and headline. Then the client CTA band (AC-12). No green block.
- **AC-11 (service page)**: every published service has a static page at `/services/<slug>` (`generateStaticParams`, `dynamicParams = false`); any other slug is a 404. In order: the hero band (grid pattern, no photo; label "Services", `name` as the only `h1`, `headline` as the lead with its highlight, `intro`, the project availability line, "Start a project" primary and "See the proof" secondary, jumping to `#track-record`, or to `#related-projects` when the track record is empty); the logo strip; "What's included" (the offerings, a 2 column grid from `md`); the track record (green); "Related projects" (`id="related-projects"`, the included projects as library project cards, in service order); testimonials; FAQ; "Other ways I can help" (links to the other published services, in `serviceOrder`); the client CTA band.
- **AC-12 (navigation and bands)**: the nav reads Work, Services, About, Contact (`navItems` becomes a function of whether a service is published, AC-5b); the existing prefix match gives `aria-current` to Services on `/services` and every service page. The site menu's availability line shows `projects` under `/services*` and `roles` elsewhere. Service pages and `/services` end with the `CtaBand` in its `projects` audience: the project availability line (no note), the heading "Have a project in mind?", and "Start a project" (primary, the page's enquiry link via an `href` prop, with the AC-17 attributes); no CV button; the contact form stays the one way in. Home gains, after "More work", the testimonials block (when featured quotes exist), and before the closing CTA band, a services band: label "Freelance", `profile.services.headline` as an `h2`, `profile.services.intro`, the project availability line, and a "See services" link to `/services`. The band is not rendered when no service is published. Lens pages get no services band.
- **AC-13 (project availability)**: the availability line takes an audience. `roles` keeps spec 0004 AC-16 unchanged. `projects` reads `availability.projects`: `open` "Taking on new projects", `limited` "Booking a few weeks out", `closed` "Not taking projects right now"; the accent mark for `open` and `limited`, the muted mark for `closed`, never conveyed by colour alone. The `projects` line never shows `availability.note` (it is written for roles). Recruiter pages show `roles`; services pages and the home services band show `projects`; `/contact` shows both.
- **AC-14 (enquiry handover)**: "Start a project" on a service page links to `/contact?topic=project&service=<slug>`. After mount, `ContactForm` reads `window.location.search` once in an effect (never `useSearchParams`, which would push the static page to client rendering) through a pure `parseEnquiryQuery(search, services)`, and hands the result to `FormFrame` through a new `prefill` prop: a `topic` that is one of the three topic values is selected; a `service` that names a published service prefills the message with `About: <service name>.` followed by a blank line, only while the message is empty. Unknown values are ignored. The visitor can change both. The slug to name map of published services comes from `getServices()` in the server `ContactPage` (the `request-projects.ts` precedent). No Worker, schema, or database change.

*Recruiter path*
- **AC-15 (lens upgrades)**: a lens page renders, after the lens switcher and before `#work`, its track record (plain tone); after its projects, testimonials for its projects; after its skills, its FAQ. Each is left out when empty. The rest of spec 0004 AC-3 holds.

*Discoverability and tracking*
- **AC-16 (SEO)**: `PageKind` gains `services` and `service`; `SeoSource` gains `services`, and its profile gains `base` and `services`. `/services` (when a service is published, AC-5b) and every published service page are in `sitePages`, the sitemap, and the social card build (`build-cards.ts` passes the new collections to the reader). Service page title: `seo.title` or else `<name> in <profile.base>, working worldwide` (70 characters at most, AC-1); description `seo.description` or else `headline`; card label "Service", heading `name`. Index title "Services", description `profile.services.intro`, card label "Freelance", heading "Services" (fixed, so it never overflows). Each service page carries `Service` JSON-LD (`name`, `description`, `serviceType` = `name`, `areaServed` "Worldwide", `url`, and `provider` as an embedded `Person` with `@id`, `name`, and `url`, built the way `caseStudyStructuredData` embeds its author). No `FAQPage` markup.
- **AC-17 (analytics)**: three new cookieless Umami events: `service-visit` with `{ service }`, once per service page view (like `lens-visit`); `project-enquiry` with `{ service }` on a "Start a project" click (`service` is `index` for both buttons on `/services`); `faq-open` with `{ page, question }` the first time each FAQ item opens in a page view (`page` the path, `question` from `data-analytics-faq`, cut to 100 characters), sent by one global capture phase `toggle` listener in `features/analytics` that remembers the questions already sent for the current path. The click listener sends every `data-analytics-<key>` attribute (other than `-event`) of the element matched by `closest("[data-analytics-event]")` as event data (`data-analytics-service` becomes `service`). `ANALYTICS_EVENTS` gains all three names.

*Content and quality*
- **AC-18 (seed content)**: the build ships four services as drafts, written by `/develop` from case study facts for you to edit: `web-performance-seo`, `web-apps`, `payments-online-stores`, `legacy-rebuilds-migration`. Result ids are added for every ref used. Each lens gets a `trackRecord` from existing results (the SEO lens points at `beccahs-kitchen/seo-score`). Lens FAQs, testimonials, and client logos ship empty until you supply or approve the words and files. `profile.base` is "Lagos"; `profile.services` copy is drafted for you to edit.
- **AC-19 (quality bar)**: spec 0004 AC-14 holds on every new and changed page: one `h1`, at most one green block (service pages: the track record; `/services`: none; home and lenses unchanged), WCAG 2.2 AA, no sideways scroll at 390px in either theme, nothing rises with reduced motion, every block readable with JavaScript off (FAQ answers open natively), tokens only. `/styleguide` shows every new block, using a `data:` SVG as its sample logo (`public/img` is wiped each build). `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` pass. No new dependency. Vitest covers every new schema, check, and read layer rule (AC-1 to AC-5) and the new pure helpers (titles, availability labels, enquiry query parsing, click event data).

## Decision

**Chosen option**: Option 1: a Services section beside the recruiter path, with four shared proof blocks that both paths compose.

Services become a new content collection rendered at `/services` and `/services/<slug>`, built from the same design system and the same blocks (track record, FAQ, testimonials, logo strip) that the lenses, case studies, home, and about pages gain; numbers stay on projects and are referenced by id.

**Implementation skills**: `content-collections` (`jackspace/claudeskillz`, `.claude/skills/content-collections/`) for the new collections · `tailwind-4-docs` (`lombiq/tailwind-agent-skills`, `.agents/skills/tailwind-4-docs/`) for the mask and layout utilities · `web-perf` (`cloudflare/skills`, `.agents/skills/web-perf/`) for keeping the new pages light

## Feature design

**Routes** (static, thin route files importing a page component from its feature folder):

| Route | Params from | Feature folder |
|---|---|---|
| `/services` | none | `features/services/` |
| `/services/[service]` | `getServices()` | `features/services/` |

New shared components in `components/portfolio/`, all server components: `track-record.tsx`, `faq.tsx`, `testimonials.tsx`, `logo-strip.tsx`, `service-card.tsx`. `Availability` and `CtaBand` gain an `audience` prop (`CtaBand` also `href` and analytics attributes). `PageHero` is unchanged. New client code: the `faq-open` toggle listener (beside `AnalyticsClicks`), `TrackServiceVisit`, and the contact prefill effect.

**Wiring the new content through** (every caller named):
- `ContentData` and `ContentSnapshot` gain `services` and `testimonials`; `content-collections.ts`, `scripts/check-content.ts`, `scripts/build-cards.ts`, `scripts/build-assets.ts`, the site reader, and `features/content/fixtures.ts` pass them.
- `checkContent` options gain `today` (UTC `YYYY-MM-DD`).
- `collectImages` takes `{ projects, profiles, testimonials }` and adds `profile.clients[].logo` and testimonial photos (leaving out quotes tied to draft projects in production); `checkFiles` adds both to its referenced set; `testimonials` and `clients` join `RESERVED_PROJECT_SLUGS` so `images/<owner>` stays unambiguous. Spec 0002's images row gets a dated note.

**Data model sketch** (content files, enforced by `features/content/schema.ts` and `check.ts`):

| Entity | Key | Fields | Relationships |
|---|---|---|---|
| Service (new) | file slug | status, name, tagline, headline, headlineHighlight?, intro, offerings[3..4], trackRecord[0..3], projects[1..], faq[0..6], seo? | N:M Project (`projects`), N:M Result (`trackRecord`) |
| Testimonial (new) | file slug | quote, name, role?, company?, project?, photo?, permission | N:1 Project (optional) |
| Result (changed) | `<project>/<id>` | adds id? | belongs to Project |
| Lens (changed) | file slug | adds trackRecord[0..3], faq[0..6] | N:M Result |
| Profile (changed) | single | adds base, availability.projects, services (required); clients[0..12] of { name, logo, permission, project? }, serviceOrder, featuredTestimonials[0..2] (default empty) | orders Service, picks Testimonial; a client may point at one Project |

**Read layer additions** (`features/content/read.ts`, pure, resolved once):
- `getServices()` published (or all with drafts) in `serviceOrder`, each with resolved `projects`, `trackRecord` (`{ project: { title, href: string | null }, result: { value, label, context? } }[]`; `href` is `/work/<slug>` for a flagship and `null` for a card; `source` is never passed; on request titles and results are already public on cards), `faq`, `testimonials`, `seoTitle`, `seoDescription`; `getService(slug)`.
- `Lens` gains `trackRecord`, `faq`, `testimonials`.
- `getTestimonialsFor(projectSlug)`, `getFeaturedTestimonials()`.
- `getProfile()` exposes the new fields unchanged.
- A shared `resolveRefs(refs)` drops refs to excluded projects; the content check (not the reader) emits the draft warnings.

**API surface**: no new endpoint. The only new input is the contact page query string (`topic`, `service`), read in the browser.

**Value sourcing**:

| Action | Value | Source |
|---|---|---|
| Service hero | name, headline, highlight, intro | service file |
| Project availability line | label and mark | `profile.availability.projects` → fixed labels (AC-13) |
| Track record item | value, label, context | the referenced project result |
| Track record item | project title, link | referenced project; link only when `depth: flagship` |
| Track record number | `01` to `03` | position in the resolved list |
| Testimonial | quote, name, role, company, photo | testimonial file; photo from the asset manifest |
| Testimonial placement | which pages | `testimonial.project` matched to page projects; home from `featuredTestimonials` |
| Logo | mark and name | `profile.clients[i].logo` (asset manifest path) and `.name` |
| Service page title | title | `seo.title` or `"<name> in <profile.base>, working worldwide"` |
| Service JSON-LD | provider | embedded `Person` (`@id`, `name`, `url`) built like `caseStudyStructuredData` |
| `permission` check | today | UTC date passed by `scripts/check-content.ts` |
| Nav, sitemap, home band presence | any published service | `getServices().length > 0` |
| Menu availability audience | current path | `site-menu` pathname (`/services*` → `projects`) |
| Enquiry link | service slug | page param |
| Contact prefill | service name | `services` prop (slug to name map of published services) passed from the contact page at build |
| `faq-open` data | page, question | `location.pathname`; the item's question text, cut to 100 characters |
| Home services band | headline, intro | `profile.services` |

**Key invariants**:
- A number is written once, on its project result; pages only reference it.
- At most one green block per page; on service pages it is the track record.
- No quote or logo renders without a `permission` date on file; no quote or logo identifies a private (on request) client.
- A production page never shows a draft service, a draft project, or a quote tied to one.

**Security model**: public static pages, no new write path. The query string only selects a known topic or a known service name (React escapes it; unknown values are ignored). Logo SVGs render through `mask-image`, where scripts inside an SVG never run. Testimonials are other people's personal data: publishing needs their permission (recorded as `permission`), and removing a quote means deleting its file and redeploying.

**Configuration required**: none.

**Critical test scenarios**:
- Happy path: a published service with 3 refs, 2 projects, 2 quotes, and 3 FAQs renders every section in AC-11 order, verifies **AC-11**, **AC-6**, **AC-7**, **AC-8**
- Drafts: a ref to LoveSeal (draft) drops in production with one warning, and an all draft service disappears, verifies **AC-5**
- Bad content: unknown result id, duplicate result id, duplicate ref, missing `permission`, `permission` after `today`, `company` or `photo` on an on request quote, a logo tied to an on request project, a fallback title over 70 characters, and a service missing from `serviceOrder` each fail the check naming the file, verifies **AC-1** to **AC-4**
- No services: with every service a draft, production has no Services nav item, no home band, no `/services` sitemap entry, and `/services` carries `noindex`, verifies **AC-5b**
- Handover: `/contact?topic=project&service=web-performance-seo` selects the topic and prefills the message; `?service=nope` changes nothing, verifies **AC-14**
- Tracking: a `project-enquiry` click sends `{ service }`; opening one FAQ twice sends one `faq-open`, verifies **AC-17**
- Quality: axe finds 0 violations on `/services` and a service page in both themes, with JavaScript off the FAQ still opens, verifies **AC-19**

## Build plan

Journey: the new client path is built end to end first, then the recruiter pages gain the blocks.

1. [x] Content model: schemas, checks (including `today`, highlights, ids, refs, privacy rules), read layer, image wiring, and Vitest for services, testimonials, result ids and refs, lens fields, profile fields, and draft handling; update `profile.yaml` with the required fields and the fixtures the new required fields break (`features/content/fixtures.ts`, the profile cases in `schema.test.ts`), satisfies **AC-1**, **AC-2**, **AC-3**, **AC-4**, **AC-5**, **AC-19**
2. Shared blocks: track record, FAQ, testimonials, logo strip, service card, `Availability` and `CtaBand` audience variants, each added to `/styleguide`, satisfies **AC-6**, **AC-7**, **AC-8**, **AC-9**, **AC-13**
3. Client path: `/services`, `/services/[service]`, the conditional nav item and empty state, menu availability, client CTA band, contact form prefill, and the four draft services plus the result ids they use, satisfies **AC-5b**, **AC-10**, **AC-11**, **AC-12**, **AC-14**, **AC-18**
4. Discoverability and tracking: pages list, sitemap, social cards, titles, `Service` JSON-LD, the three events and the click data attributes, satisfies **AC-16**, **AC-17**
5. Recruiter path: lens track record, testimonials, and FAQ; case study testimonials; home logos, featured quotes, and services band; about logos; lens `trackRecord` seeds; then `docs/design.md`, `verify.md`, and the notes on specs 0002 and 0004, satisfies **AC-8**, **AC-9**, **AC-12**, **AC-15**, **AC-18**, **AC-19**

## Consequences

**Positive**:
- One set of blocks serves both audiences, so a lens and a service page cost content, not code.
- Numbers cannot drift: fix a result once and every page that cites it updates.
- Service pages are a second door for search traffic (location in the title, a social card, `Service` markup).

**Negative / tradeoffs**:
- Two audiences on one site: a recruiter can now find "Freelance" on home. Home and lenses keep proof first and lenses get no services band to limit this.
- More content to keep honest: four services, FAQs, and quotes go stale if left alone.
- The SEO service sells speed while your live proof scores 41 to 54 on mobile performance (rationale.md, Evidence). Publish it after that is fixed, or a client who runs PageSpeed will notice.
- Logos must be cleaned to single colour SVGs, and each client asked first.
- `profile.availability.projects` is a new required field, so every profile edit must carry it.

**Neutral**:
- Amends spec 0004 (AC-1 home composition, AC-3 lens, AC-4 case study, AC-9 about, AC-13 nav) and spec 0002 (two new collections, result ids). Step 5 adds a dated note to each.
- The contact form gains a client side query read; the Worker is untouched.

## Follow-up

- [ ] Confirm `availability.projects` (seeded `open`) and `base` ("Lagos") before publishing a service.
- [ ] Collect testimonials with written permission; collect and clean client logos (single colour SVG, permission per client, never a client you keep private).
- [ ] Fix Beccah's Kitchen mobile performance (LCP 6.5 s) and LoveSeal resources (missing canonical, layout shift 0.207), then measure again on PageSpeed and add before and after results; these become the SEO service's track record.
- [ ] Publish LoveSeal so the SEO lens and the legacy rebuilds service have their second project in production.
- [ ] Write or approve FAQ answers for each lens and service.

## Rationale

Reasoning, options, and evidence: see [rationale.md](rationale.md).
