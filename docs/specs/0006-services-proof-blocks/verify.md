# Verify: services and proof blocks · spec 0006 · updated 2026-11-20
_Steps derived from spec 0006 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

Two builds, each served with `npx wrangler dev --port 8787 --ip 127.0.0.1`:
- **Drafts**: `CONTENT_DRAFTS=true NEXT_PUBLIC_SITE_URL=https://example.com NEXT_PUBLIC_UMAMI_WEBSITE_ID=11111111-2222-3333-4444-555555555555 pnpm build` (the four services are drafts, so they show only here).
- **Production**: the same without `CONTENT_DRAFTS` (services hidden while all are drafts).

For events, stub the tracker before load: `window.umami = { track: (e, d) => window.__ev.push([e, d]) }`.

## UI / manual (drafts build)
- [x] `/services` → one `h1` "Services", label "Freelance", lead is `profile.services.headline` with "fast, findable" highlighted, the project availability line, "Start a project" to `/contact?topic=project`, an `ol` of 4 service cards numbered 01 to 04 in `serviceOrder`, the client CTA band, no green block → AC-10, AC-13
- [x] `/services/web-performance-seo` → sections in order: hero (label "Services", `h1` the name, "See the proof" to `#track-record`), What's included (4 offerings), Track record (the one green block), Related projects (`#related-projects`), Questions, answered, Other ways I can help (3 links), client CTA band with no CV → AC-11, AC-12
- [x] Each service page's track record → numbered 01 to 03 (numbers `aria-hidden`), value and label in an `h3`, context when present, "From" a project title linked to `/work/<slug>` for a flagship and plain text for a card, no `source` text anywhere → AC-6
- [x] A service whose track record has 2 results → 2 columns from `md`, no filled empty cell → AC-6
- [x] FAQ → closed at first, opens by click and by keyboard (Enter or Space on the summary), plus icon turns to a cross, visible focus ring → AC-7
- [x] With JavaScript off, a service page's FAQ still opens and shows its answer → AC-7, AC-19
- [x] Nav in the menu → Work, Services, About, Contact; Services has `aria-current` on `/services` and every service page → AC-12
- [x] Menu availability line → "Taking on new projects" on `/services*`, "Open to the right role" elsewhere; `/contact` hero shows both lines → AC-12, AC-13
- [x] Home → the services band (label "Freelance", the services headline, intro, project availability, "See services" to `/services`) sits above the closing CTA band; lenses show no services band → AC-12
- [x] `/contact?topic=project&service=web-performance-seo` → Topic shows "A freelance project", Message starts "About: Web performance and SEO." followed by a blank line; both editable → AC-14
- [x] `/contact?topic=hire&service=nope` → nothing prefilled → AC-14
- [x] `/services/nope` → 404 → AC-11

## UI / manual (production build)
- [x] No Services nav item, no services band on home, no `/services` in `sitemap.xml`, no `out/og/services*.png` → AC-5b
- [x] `/services` → hero and CTA band only, `robots` meta `noindex, nofollow` → AC-5b
- [x] `/services/web-apps` → 404 → AC-5, AC-5b
- [x] Each lens → a plain Track record section right after the lens switcher and before the green featured block: solutions architect (14 of 14, 111, 1,848), software developer (1,277, 95, 174,097), AI assisted builder (1,277, 95), SEO specialist (100 only; the LoveSeal ref drops) → AC-15, AC-5
- [x] Home, about, and case studies → no logo strip and no quotes section while `profile.clients` and `content/testimonials/` are empty (nothing empty renders) → AC-8, AC-9
- [x] `/styleguide` Proof blocks → logo strip (3 sample marks in the muted colour, each `role="img"` with its name), plain track record, quotes, FAQ, 2 service cards linking to the styleguide, 3 project availability labels, the client CTA band → AC-19

## Tracking (drafts build, stubbed tracker)
- [x] Open a service page → one `service-visit` `{ service: "<slug>" }` → AC-17
- [x] Open the same FAQ item three times → one `faq-open` `{ page: "/services/<slug>", question: "<question>" }` → AC-17
- [x] Click "Start a project" on a service page → `project-enquiry` `{ service: "<slug>" }`; on `/services` (hero or band) → `{ service: "index" }` → AC-17
- [x] Click the CV button → `cv-download` with no data (unchanged) → AC-17

## SEO (drafts build)
- [x] Service page title "<name> in Lagos, working worldwide · Omogbolahan Ajibare", at most 70 characters before the suffix; canonical on `https://example.com/services/<slug>`; `og:image` `/og/services-<slug>.png` returns 200 → AC-16
- [x] Service page JSON-LD `@type: Service` with `areaServed: "Worldwide"` and `provider` a `Person` with `@id` `https://example.com/#person` → AC-16
- [x] `/services` card heading is the fixed "Services", label "Freelance"; no `FAQPage` markup anywhere → AC-16

## Value sourcing
- [x] Change `availability.projects` to `limited`, rebuild → services pages and the band read "Booking a few weeks out"; `closed` → "Not taking projects right now" with the muted mark; role pages unchanged → AC-13
- [x] Change `profile.base` to another city → service titles follow; a name long enough to push the title past 70 characters fails `pnpm content` asking for `seo.title` → AC-1, AC-16
- [x] Point a lens `trackRecord` at a card's result → its "From" line is plain text, not a link → AC-6
- [x] Add a testimonial tied to `beccahs-kitchen` (with `permission` today or earlier) → it shows on that case study after Key results, on every lens and service listing Beccah's Kitchen, and on home only if named in `featuredTestimonials` → AC-8
- [x] Add a client logo SVG with a viewBox under `content/images/clients/` and a `profile.clients` entry → it shows on home after the hero, on `/services`, each service page, and about before Skills, drawn in the muted colour in both themes → AC-9

## Commands
- [x] `pnpm content` with a `permission` dated tomorrow → fails naming the file and field → AC-3
- [x] `pnpm content` with `company` or `photo` on a quote tied to `membership-charity-data-migration` → fails → AC-3
- [x] `pnpm content` with a client `project: membership-charity-data-migration` → fails → AC-4
- [x] `pnpm content` with an unknown result id or a repeated ref in a `trackRecord` → fails → AC-2
- [x] `pnpm lint && pnpm typecheck && pnpm test && pnpm build` → all pass → AC-19
- [x] axe (WCAG 2.2 AA) on every page in both themes, both builds → 0 violations; at 390px wide no page scrolls sideways → AC-19

## Acceptance-criteria coverage
- AC-1 value sourcing (title) · AC-2 commands · AC-3 commands · AC-4 commands · AC-5 production (refs drop) · AC-5b production · AC-6 drafts (track record), value sourcing (card) · AC-7 drafts (FAQ, no JS) · AC-8 production, value sourcing · AC-9 production, value sourcing · AC-10 drafts (`/services`) · AC-11 drafts (service page, 404) · AC-12 drafts (nav, menu, band) · AC-13 drafts, value sourcing · AC-14 drafts (prefill) · AC-15 production (lenses) · AC-16 SEO · AC-17 tracking · AC-18 drafts (four services, lens seeds) · AC-19 commands, styleguide
