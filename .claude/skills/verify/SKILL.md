---
name: verify
description: How to build, serve, and drive this portfolio's static export in a real browser to verify a change. Use before /check verify or /verify on any page or Worker change.
---

# Verify this portfolio

## Build and serve

```bash
pnpm build                                      # content check, asset step, static export to out/
npx wrangler dev --port 8787 --ip 127.0.0.1     # out/ plus the Worker, same as production
```

Run wrangler in the background, poll `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8787/` until 200, and stop it when done (confirm with `lsof -nP -iTCP:8787 -sTCP:LISTEN`). Unknown slugs return the real 404 page (`not_found_handling: 404-page`); `/api/*` returns JSON.

## Browser

No Playwright in the repo. A cached copy works from a script in the scratchpad:

```js
import { createRequire } from "node:module";
const require = createRequire("/Users/<you>/.npm/_npx/<hash>/node_modules/"); // find with: ls ~/.npm/_npx/*/node_modules/playwright
const { chromium } = require("playwright");
```

Theme follows the system: pass `colorScheme: "dark"` to `newContext`. Also useful: `reducedMotion: "reduce"`, `javaScriptEnabled: false`, `acceptDownloads: true`.

## Selectors that matter

- Green block: `main section.bg-block` (not `.bg-block`, stat tiles inside also match)
- Hero grid band: `.grid-band`
- Library filters: `#filter-problem`, `#filter-role`, `#filter-stack`; the count is `form [role="status"]` (the toaster has its own `role="status"`)
- Cards: `[id^="project-"]`; skills on about: `[id^="skill-"]`
- CV button: `a[data-analytics-event="cv-download"]`
- Form slots: `[data-form-slot]`
- The nav and theme switcher live in the full screen menu, a native popover (`[data-site-menu]`, opened by `header > div > button[popovertarget]`). It sits inside `header`, so a bare `header button[popovertarget]` also matches its close button. Open, it covers the whole page, including the menu button.

## Gotchas

- `.reveal` sections sit at opacity 0 until scrolled into view (CSS scroll timeline, works without JavaScript). Scroll before calling text hidden.
- Filter changes build on the live address, so back to back `selectOption` calls (even `Promise.all`) all stick. If one is dropped, that is a regression of the filter race (`changeFilterQuery` in `features/library/filter.ts`).
- `goto` to the same path with only a new hash is a same document navigation; open a fresh page to test a hash on first load.
- ArrowDown on a focused select in headless Chromium does not change the value; use `selectOption`.
- The verify checklist per feature lives in `docs/specs/NNNN-*/verify.md`.
