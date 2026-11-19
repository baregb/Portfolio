# Review, feat/seo-analytics, 2026-11-19

**Reviewed by**: Sonnet 5.5 (author on a different session)
**Scope**: 41 files (20 tracked changed, 21 new), branch vs main (uncommitted)
**Verdict**: Approve with nits

## Summary
Feature 13 adds one page list (`features/seo/pages.ts`) that drives metadata, the sitemap and the social card script, JSON-LD on home/about/case studies, robots, build-time cards (satori + resvg), and cookieless Umami with three custom events. The design is clean: pure builders, typed results for env validation, build failing by variable name, one shared source of truth for pages. No correctness or security blockers found; vitest (117 tests in seo/analytics/app), eslint and prettier pass on the touched paths. The issues are metric accuracy for `case-study-read`, a robots.txt/noindex interaction, and untested browser glue.

## Minor
### 🟡 `case-study-read` can fire without any reading, `features/analytics/track-events.tsx:33-45`
**Problem**: The observer fires as soon as the wrapper is intersecting. On a tall viewport, a short case study (the on-request variants are much shorter than the public ones), or a back navigation that restores scroll to the bottom, the block is visible on load and the event is sent with no scroll.
**Why it matters**: The scope defines this event as a "case study read"; inflated counts make the number unreliable, and nobody will notice later.
**Suggested fix**: Require the block to be intersecting after some real engagement (for example a minimum dwell time, or a scroll event having occurred), or document that the on-request pages count as read on open. At minimum, add a `data` field such as `visibility` so on-request reads can be filtered out.

### 🟡 robots.txt blocks the pages that rely on `noindex`, `app/robots.ts:11`
**Problem**: `/request/` and `/styleguide` are `Disallow`ed and also carry `robots: { index: false }` in their metadata. A crawler that obeys the Disallow never fetches the page, so it never sees the `noindex`; a linked URL can still appear in results as a bare entry. The same applies to preview and local builds (`Disallow: /` with no `noindex` meta anywhere).
**Why it matters**: The intent (keep these out of search) is only half enforced by either mechanism alone. Low risk here because nothing links to the styleguide, but request detail pages are linked from the site.
**Suggested fix**: Pick one mechanism per case: leave request/styleguide crawlable and rely on `noindex`, or keep the Disallow and accept the bare-URL risk and drop the redundant meta. For `workers.dev` previews, consider also emitting a `noindex` meta (or an `X-Robots-Tag` header on the preview deploy).

### 🟡 `data-domains` silently drops events from any other host, `features/analytics/analytics-script.tsx:20`
**Problem**: `data-domains` is the exact hostname of `NEXT_PUBLIC_SITE_URL`. Umami compares hostnames exactly, so traffic on `www.` (if it is served rather than redirected) or any alias records nothing, with no error anywhere.
**Why it matters**: A deploy-time misconfiguration shows up weeks later as an empty dashboard.
**Suggested fix**: Add a launch checklist line (feature 15) to confirm one canonical host with a redirect from the others, or pass both apex and `www` in `data-domains`.

### 🟡 Browser glue is untested, `features/analytics/track.ts:12-22`, `analytics-clicks.tsx`, `track-events.tsx`
**Problem**: The pure parts (config, pages, metadata, structured data, card, site URL) are well covered, but `track` has real branching (tracker present, tracker not yet loaded and queued on `load`, no script element, no window) and the lens "once per lens" ref logic and the delegated click lookup have no test. `app/robots.ts`, `app/sitemap.ts` and `features/seo/index.ts` (`seoMetadata`, `defaultSocialMetadata`) also have no direct test.
**Why it matters**: Test signal is configured; these are the places a regression would silently stop events. Runtime `/check verify` covered them once, not on every change.
**Suggested fix**: A jsdom (or stubbed `window`/`document`) test for `track` covering the three paths, and one for `clickedEvent`; a small test that `sitemap()`/`robots()` return the expected shape for an indexable and a non-indexable URL.

### 🟡 `track` queues a listener per call and never removes it, `features/analytics/track.ts:19-21`
**Problem**: While the script has not loaded, every call adds a `load` listener. If the script is blocked (ad blocker, offline) the `load` never fires and the listeners (and their data) stay for the life of the page.
**Why it matters**: Tiny leak, bounded by a handful of events per page, so not urgent; also an event raised after the script finished loading but before `window.umami` is defined (not a normal state) would be dropped.
**Suggested fix**: Keep one module-level queue drained by a single `load` listener, and clear it on `error`.

## Nits
- ⚪ `public/_headers:9`, `https://api-gateway.umami.dev` can go now that `gateway.umami.is` is confirmed (already noted by the author); update the comment above it at the same time.
- ⚪ `features/seo/index.ts:41`, `seoMetadata` returns `{}` for a path with no page entry; `pages.test.ts` guards static routes, but a thrown error would match the "fail loudly" rule better than silently losing the canonical and card.
- ⚪ `features/case-study/case-study-page.tsx:21`, the `@/features/analytics` import sits between `@/components/ui/*` imports; move it with the other `@/features` imports.
- ⚪ `features/analytics/config.ts:40`, `EventData` is declared after `knownEvent` with no blank line; move it up with the other types.
- ⚪ `features/seo/structured-data.ts:20` and `app/sitemap.ts:10`, home is the bare origin in the sitemap and JSON-LD but `https://host/` in the canonical/`og:url` (Next adds the slash). Equivalent URLs, but consistent output is easier to audit.
- ⚪ `package.json:16`, `pnpm dev` does not run `pnpm cards`, so `/og/*.png` 404 locally until a build has run; a line in the dev docs would save a confusing moment.

## Strengths
- Single page list feeds metadata, sitemap and cards, with a test that every static route has an entry and that request/styleguide are never listed.
- Env handling follows the house pattern: pure `readSiteUrl`/`readUmamiWebsiteId` returning typed results, errors name the variable, all production build checks aggregated into one message.
- Analytics is safe by construction: tracker only with a valid id, canonical host only, Do Not Track honored, failures never break the page, event names allow-listed (`knownEvent`), delegated click listener keeps components free of tracking code.
- JSON-LD escapes `<` and has a test; robots/indexability logic is conservative (localhost and `workers.dev` never indexed).
- Card script colours come from the real theme tokens with a test against `app/globals.css`, and a missing token fails the build by name.

## Test coverage
Strong for the pure modules: `config`, `site-url`, `pages`, `metadata`, `structured-data`, `card` (including the real tokens file) and the title-suffix guard all have meaningful assertions, including error cases. Not covered: `track.ts` branches, the click delegation and once-per-lens logic, the `case-study-read` observer, `robots.ts`, `sitemap.ts`, and the `features/seo/index.ts` binding. `scripts/build-cards.ts` is covered only by the build and `/check verify`, which is reasonable for a build script.
