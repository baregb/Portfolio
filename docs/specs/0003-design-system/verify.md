# Verify: design system & UI foundation · spec 0003 · updated 2026-11-18
_Steps derived from spec 0003 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

Run against the production build (`pnpm serve`, or `pnpm build` and serve `out/` with clean URLs). Check light and dark separately where a step says "both themes".

## UI / manual

- [x] Clear site data, set the OS to dark, open `/` → the very first paint is dark, no light flash; `<html>` has class `dark` and `data-theme-setting="system"` → AC-4
- [x] Same, with the OS in light → first paint is light → AC-4
- [x] In the header switcher pick Light, reload → stays light; `localStorage.theme` is `light` → AC-4
- [x] Pick System, then switch the OS theme while the page is open → the page follows live; `localStorage.theme` is removed → AC-4
- [x] Tab to the theme switcher, use the arrow keys → the choice moves and applies, a screen reader announces "Theme, Light, radio button, 2 of 3" or similar; the selected option is filled even before JavaScript loads (throttle JS or view source) → AC-4
- [x] Block site data (private window with storage blocked) → switching still works for the visit, no errors in the console → AC-4
- [x] Press Tab once on any page → "Skip to content" appears; Enter moves focus to `<main id="main">` → AC-12
- [x] Tab through `/styleguide` → every link, button, field, and switcher option shows the 2px green focus ring, offset 2px, in both themes → AC-6
- [x] On `/styleguide`, click "Open modal" by keyboard → focus moves into the dialog, Tab stays inside, Escape closes it, focus returns to "Open modal"; the page behind does not scroll while open; clicking the dimmed area closes it → AC-9
- [x] Click each toast button → success and info appear with an icon, close after about 5 seconds, and pause while hovered or focused; the error toast stays until dismissed; a screen reader reads success and info politely and the error at once → AC-10
- [x] Click a toast button 5 times quickly → at most 3 toasts show; the oldest leave first → AC-10
- [x] Click "Click to send" → a spinner shows, the button stays focused, `aria-busy="true"` is set, further clicks do nothing for 2 seconds → AC-11
- [x] "Pending", "Disabled", and "Disabled link" buttons look muted; the disabled link is plain text with no `href` → AC-8, AC-11
- [x] The external link and external button open a new tab and carry "(opens in a new tab)" for screen readers → AC-8
- [x] The email field shows its error under it; the input has `aria-invalid="true"` and `aria-describedby` pointing at the error text; required fields announce "required" → AC-8
- [x] At any width, the header shows the name and a menu button; it opens a full screen menu with large bold centred links and the theme switcher; the close button sits where the menu button was; Escape or the close button closes it and focus returns to the button; the page behind does not scroll; it opens with JavaScript off too → AC-12 (full screen menu since 2026-11-19)
- [x] At 390px wide, `/` and `/styleguide` have no horizontal scroll in either theme → AC-8, AC-14
- [x] With the OS set to reduce motion, scroll `/styleguide` and navigate between `/` and `/styleguide` → nothing rises or crossfades; with it off, the green block rises in and routes crossfade → AC-7
- [x] With JavaScript off, `/` and `/styleguide` show all their content (nothing waits for an animation) → AC-7
- [x] The grid pattern appears only in the hero band and the header demo; the green block appears once on `/styleguide`; cards, tags, badges, and spec sheets are square; buttons, nav, switcher, and toasts are round → AC-14
- [x] Body paragraphs on `/styleguide` stay under about 70 characters per line on a wide screen → AC-14
- [x] View source of `/styleguide` → `<meta name="robots" content="noindex, nofollow">`; it is not in the header nav → AC-13
- [x] `/styleguide` shows the type scale, every colour token with light and dark values and contrast ratios, and every component in every listed state → AC-13
- [x] The header shows "Omogbolahan Ajibare" (from `content/profile.yaml` `name`); the footer shows the role line, location, the GitHub link from `links`, and the current year → AC-12 (value sourcing)
- [x] The swatch ratios on `/styleguide` match `pnpm test` (for example `fg` on `bg`: 16.51:1 light, 15.29:1 dark) → AC-5, AC-13 (value sourcing)
- [x] Network tab on a production page → fonts load from `/_next/static/media/`, no request to `fonts.googleapis.com` or `fonts.gstatic.com`; headlines render in Bricolage Grotesque, body in Geist, labels in Geist Mono → AC-3

## Commands

- [x] `pnpm test` → all pass, including every contrast pair in both themes, the literal colour scan, the theme script, and the design doc colour table → AC-2, AC-4, AC-5, AC-1
- [x] Add `color: #ff0000` to a class in any file under `components/` and run `pnpm test` → fails naming the file and line; undo → AC-2
- [x] Change `--color-muted` in `app/globals.css` to `#9aa59f` and run `pnpm test` → the muted contrast pairs fail and the design doc table check fails; undo → AC-5, AC-1
- [x] Add `alert("x")` to any component and run `pnpm lint` → fails on `no-alert`; undo → AC-9
- [x] `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` → all pass; `package.json` adds only `lucide-react` as a runtime dependency → AC-15
- [x] `grep -c 'Loading page\|\$RC' out/styleguide.html` after a build → 0 (no streamed skeleton on first load) → AC-11

## Acceptance-criteria coverage

- AC-1 design.md: the doc table check, the `--color-muted` break step
- AC-2 tokens, no literals: `pnpm test`, the literal colour break step
- AC-3 fonts: the network step
- AC-4 theme: the six theme steps and `pnpm test`
- AC-5 contrast: `pnpm test`, the `--color-muted` break step, the swatch step
- AC-6 focus: the Tab through step
- AC-7 motion: the reduced motion and JavaScript off steps
- AC-8 components: the button, link, field, and 390px steps
- AC-9 modal: the modal step and the `no-alert` step
- AC-10 toasts: the two toast steps
- AC-11 loading: the pending step and the no streamed skeleton command
- AC-12 shell: the skip link, full screen menu, and header and footer steps
- AC-13 styleguide: the noindex and contents steps
- AC-14 grid, block, shapes, measure: the shapes and measure steps
- AC-15 checks and dependency: the full command run
