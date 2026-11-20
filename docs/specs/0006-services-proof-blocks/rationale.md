# 0006. Rationale: service pages and shared proof blocks

Decision record for [index.md](index.md). `/develop` does not read this file.

## Context

> ⚠️ Premise note: this adds a second audience to a site built for one. A recruiter who meets "Freelance" on the first screen may read it as "not committed to a role", and a client who lands on a recruiter page sees role talk. The design answers this by keeping home and lenses proof first, giving lenses no services band, and putting services in their own section. Second, the SEO service sells speed, but your live proof scores 41 to 54 on mobile performance (Evidence below). Publishing the SEO service before fixing that invites the very check that sinks it.

The site (specs 0002 and 0004) is built for hiring managers: a profile, role lenses at `/for/<lens>`, case studies, and a library, all static content checked at build. You also take freelance work (the contact form already offers "A freelance project"), but nothing on the site speaks to a client: no list of services, no promise of what is included, no answers to the questions a client asks before getting in touch.

Your proof is strong in depth but thin at the top of each page. Results live on projects, and a lens shows only its featured project's first four. The new SEO lens shows engineering numbers (tests, migrations), not its SEO score, because there is no way to say which numbers matter for which page. There are no testimonials and no client names anywhere.

The reference that prompted this, mosesnwigberi.com, sells nine services through one page template (hero, what is included, a numbered track record with hard numbers, related projects, three honest FAQs, other services, a closing call to action), backed by a client logo strip and quotes. Its strongest element is the numbered track record; its weakest is that several claims carry no figure.

Constraints: no route may need a server (spec 0001); copy lives in content files, not code; at most one green block per page and WCAG 2.2 AA (spec 0004 AC-14); the design direction may still change, so pages compose components and tokens only.

## Options considered

### Option 1: Services section with shared proof blocks (chosen)

A `services` collection rendered at `/services` and `/services/<slug>`, plus four blocks (track record, FAQ, testimonials, logos) that services, lenses, case studies, home, and about all compose.

**Pros**: one set of blocks for both audiences; lenses get their missing numbers from the same work; clean URLs for search; nothing new to run.
**Cons**: the biggest build of the options; two audiences share one nav.

### Option 2: Services as lenses

Treat each service as another lens at `/for/<service>` on the `ProfilePage` composition.

**Pros**: almost no new code; one concept to learn.
**Cons**: a lens hero is your name and photo and the lens switcher says "Hiring for a specific role?", which is wrong for a client; no room for what is included, FAQs, or a client call to action without bending the lens design for everyone.

### Option 3: A separate freelance site

A second static site (for example a subdomain) for clients.

**Pros**: each site speaks to one audience only.
**Cons**: two builds, two deploys, and duplicated proof that drifts apart; splits search authority across two hosts.

### Option 4: Proof blocks only, no services

Add track record, FAQ, testimonials, and logos to the recruiter pages, and keep clients on the contact page.

**Pros**: smallest change; no second audience.
**Cons**: clients still find nothing written for them, which is the gap you asked to close.

## Rationale

Option 1 is the only one that serves both audiences without bending either. The four blocks are what make the reference site convincing, and your lenses need the same blocks for the same reason (the SEO lens cannot show its SEO score today). Building them once and composing them in both paths keeps the cost of a new service or lens at "write a YAML file", which is the rule spec 0004 set for lenses.

Smaller calls made inside the decision:

- **Numbers by reference, not copy.** A ref `project/result-id` keeps each number in one place with its source, which is how the content check already guards facts. Runner up: each page holds its own results, rejected because copies drift.
- **Track record placement.** On lenses it sits after the switcher in a plain tone, because the featured project already holds the green block. On service pages it is the green block, so the strongest proof gets the signature treatment. Runner up: plain everywhere, rejected because service pages would have no anchor.
- **FAQ as `details`.** Native disclosure works by keyboard and without JavaScript, and search engines read closed content. Runner up: an always open list. No `FAQPage` markup: Google limited FAQ rich results to a few authoritative government and health sites in 2023, so the markup buys nothing here.
- **`Service` JSON-LD with the home `Person` as provider.** It ties every service to the identity already marked up on home. Runner up: no markup, rejected because it costs one small pure function.
- **Logos as single colour masks.** One SVG drawn in the text token fits both themes and makes mixed brands read as one row; `mask-image` never runs scripts inside an SVG. Runner up: light and dark file pairs, rejected for doubling the files and a mixed look.
- **Permission date required.** Quotes are other people's words and names; a required, never shown date means nothing goes live without consent on record. Runner up: trust the author, rejected because it fails silently.
- **Enquiry by prefill.** A query string that selects the topic and starts the message reuses spec 0005 untouched. Runner up: a stored `service` field, rejected as a Worker change, a migration, and tests for a value that already arrives in the message.
- **Location in titles.** "In Lagos, working worldwide" targets the less crowded local search while still saying you work remotely, with `base` as the one source.
- **Drafts drop and warn.** Refs and projects pointing at drafts drop with a warning, as lens projects do today, so an unrelated deploy never fails because LoveSeal is still a draft. One deliberate difference: a lens left with no project fails the check, while a service left with no project only warns and drops, because services ship as drafts and fill in over time.
- **Privacy rules for quotes and logos.** On request projects exist to keep a client private, so a quote on one may not carry a company or a photo, and a logo may not point at one. Runner up: trust the author, rejected for the same reason as the permission date.
- **Hidden until published.** With no published service the nav item, home band, and sitemap entry stay out, so the site never advertises an empty section. Runner up: always show Services with a "coming soon" page, rejected as a dead end for clients and recruiters alike.
- **Two location fields.** `location` speaks to visitors ("Remote (worldwide)"); `base` names the city for search titles. They answer different questions, so both stay.

## Evidence

### Lighthouse baselines (2026-11-19)

Lighthouse 12.8.2, mobile with simulated throttling, run locally (the PageSpeed API was over its daily quota). PageSpeed figures may differ a little.

| Site | Performance | SEO | Accessibility | Best practices | Notes |
|---|---|---|---|---|---|
| beccahskitchen.store | 54 | 100 | 100 | 100 | LCP 6.5 s, TBT 360 ms |
| resources.lovesealchurch.org | 41 | 92 | 91 | 96 | no canonical, CLS 0.207, TBT 890 ms |
| lovesealchurch.org (legacy Laravel site) | 27 | 67 | 80 | 96 | LCP 28.7 s, CLS 1; missing meta description, link text, crawlable anchors, image alt |

### Reference site structure (mosesnwigberi.com, read 2026-11-19)

- Service template: breadcrumb, hero (title with a location, two word tagline, problem paragraph, "Start a project"), "What I can do for you" (4 cards), "The track record" (3 numbered outcomes with figures), "Related projects", "Questions, answered" (3 FAQs), "Other ways I can help", closing call to action.
- Site wide: client logo strip, four quotes on home, "Available for new projects" badge, a 15 minute booking link, no prices, no process section.
- Strongest claim style: "went from 74 to 98 on mobile PageSpeed" with the method. Weakest: "month on month growth" with no figure.
