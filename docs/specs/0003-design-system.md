# 0003. Design system and UI foundation

**Date**: 2026-11-17
**Status**: Proposed

## Summary

The site uses an "engineering blueprint" look: IBM Plex Sans for reading, IBM Plex Mono for labels and numbers, hairline boxes, a faint grid in header bands, and one deep green accent. Every colour, size, and timing lives as a token (a named value) in `app/globals.css`, with light and dark values, and a three way switch (System, Light, Dark) picks the theme with no flash. The base components (buttons, tags, stat tiles, spec sheets, form fields, modal, toast, header, footer) are built by hand on native HTML, so the site ships almost no JavaScript, and a hidden `/styleguide` page shows every one of them in both themes for checking.

## Context

Every page in Journeys 1 and 2 needs the same type, colour, spacing, motion, and components. Without a shared system each page would invent its own look, and the premium app standard (both themes, purposeful motion, loading states, themed toasts and modals, WCAG 2.2 AA) would be met unevenly or not at all.

The site is a static export (spec 0001): no server, theme set by a class on `<html>` from a small inline script, no cookies. Most pages are read only, so client JavaScript should stay small. Tailwind v4 is installed and reads its theme from CSS. Content comes from the typed read layer (spec 0002), which already supplies stat tile values (`results[]`), stack tags, and the profile.

You compared four directions on a samples page with real content (editorial technical, engineering blueprint, bold expressive, minimal soft) and picked the blueprint direction with a deep green accent, a three way theme switch that follows the system, subtle motion, and components built on native HTML.

## Requirements

**User stories**:
- As a hiring manager, I want a site that reads clearly and looks considered in my preferred theme, so that I trust the work before I read it.
- As a keyboard or screen reader user, I want every control to be reachable, labelled, and visibly focused, so that I can use the whole site.
- As the builder of later pages, I want ready tokens and components, so that each page is assembled, not designed again.

**Acceptance criteria**:
- **AC-1**: `docs/design.md` documents the direction, type scale, colour tokens (light and dark values), spacing, rules and radius, grid usage, motion tokens and rules, and every component with its variants, states, and when to use it.
- **AC-2**: All colours, fonts, durations, and easings are tokens in `app/globals.css` (Tailwind v4 `@theme`), each colour with a light and a dark value, and Tailwind utilities map to them (for example `bg-bg`, `text-fg`, `text-muted`, `border-line`, `text-accent`). No file under `components/` or `app/` contains a literal colour (hex, `rgb(`, `hsl(`, `oklch(`); a Vitest test fails if one does.
- **AC-3**: IBM Plex Sans (400, 500, 600) and IBM Plex Mono (400, 500) load through `next/font/google`, self hosted at build with `display: swap` and a metric matched fallback, exposed as `--font-sans` and `--font-mono`. A production page makes no request to Google.
- **AC-4**: The theme setting is `system`, `light`, or `dark`, default `system`. An inline script in `<head>` runs before first paint, reads `localStorage.theme`, resolves `system` with `matchMedia('(prefers-color-scheme: dark)')`, and sets the `dark` class and `color-scheme` on `<html>`, so no page ever flashes the wrong theme. While the setting is `system`, an OS theme change applies live. The theme switcher offers all three choices, works by keyboard (a radio group: arrow keys move, the current choice is announced), and saves the choice. If storage throws, the switch still works for the visit.
- **AC-5**: In both themes, every text and background pair meets WCAG 2.2 AA (4.5:1 normal text, 3:1 large text), and every UI boundary that carries meaning (input borders, focus ring, toggles) meets 3:1 against its neighbours. A Vitest test reads the token values from `app/globals.css` and checks every listed pair.
- **AC-6**: Every interactive element shows a 2px accent focus ring on `:focus-visible`, offset 2px. No rule removes focus outlines without replacing them.
- **AC-7**: Motion uses only the duration and easing tokens. Sections fade in with an 8px rise as they enter the viewport, using CSS scroll driven animation where supported and nothing otherwise, so content is fully visible with no JavaScript. Route changes crossfade through React `<ViewTransition>`. Buttons and links give hover and press feedback. Under `prefers-reduced-motion: reduce`, every animation and view transition is turned off.
- **AC-8**: These components exist in `components/ui/` (primitives) and `components/site/` (shell), typed, named exports, each usable by keyboard and correct in both themes: `Button` (primary, secondary, ghost; sizes sm and md; `pending` and disabled states; renders a link when given `href`), `TextLink` (internal and external, external marked for screen readers), `Container`, `Section` (plain or `grid` band), `Card` (hairline box), `Tag`, `StatTile`, `SpecSheet`, `Icon` (Lucide wrapper), `Spinner`, `Skeleton`, `VisuallyHidden`, `TextField`, `TextArea`, `Modal`, `Toaster` with `useToast`, `ThemeSwitcher`, `SkipLink`, `SiteHeader`, `SiteFooter`.
- **AC-9**: `Modal` is built on `<dialog>` with `showModal()`: focus moves into it, Tab stays inside, Escape closes it, focus returns to the control that opened it, the page behind does not scroll, and it is labelled by its title. Closing on a backdrop click is an option. The ESLint `no-alert` rule is on, so `alert`, `confirm`, and `prompt` fail lint.
- **AC-10**: Toasts appear in a fixed region: success and info toasts in a polite live region, error toasts in an assertive one. Each shows an icon and text (never colour alone) and a dismiss button. Success and info toasts close after 5 seconds, pausing while hovered or focused; error toasts stay until dismissed. At most 3 show at once; older ones leave first.
- **AC-11**: Loading states: `Button` shows a spinner and sets `aria-busy` while `pending`, and ignores clicks then. `Skeleton` blocks hold layout while content loads (a gentle pulse, static under reduced motion). `app/loading.tsx` renders a page skeleton during client navigation. Images sit in fixed aspect ratio boxes on the surface colour, so nothing shifts as they load.
- **AC-12**: The root layout renders, in order, a skip link to `#main`, `SiteHeader` (name from the profile, nav from one constant, `ThemeSwitcher`), `<main id="main">`, and `SiteFooter`. Below the `md` breakpoint the nav folds into a menu button that opens a panel (`aria-expanded`, Escape closes it, focus returns to the button). The nav constant lists only routes that exist; later pages add their own entries.
- **AC-13**: `/styleguide` shows the type scale, every colour token as a swatch with its contrast ratio against the background in the current theme, and every component in every variant and state (including pending, disabled, error, empty, and loading), with a theme switcher and buttons that open the modal and each toast. It sets `robots: noindex`, is not in the nav, and is left out of the sitemap.
- **AC-14**: The blueprint grid appears only on `Section variant="grid"` bands (hero and page headers), never behind running text. Body text columns stay under 70 characters wide.
- **AC-15**: `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` pass. The only new runtime dependency is `lucide-react`.

## Options considered

### Option 1: Tokens in Tailwind v4 plus your own components on native HTML

Tokens in CSS through `@theme`; components written by hand on `<dialog>`, `<button>`, and a small toast region.

**Pros**:
- The least client JavaScript of any option, which suits a mostly static site.
- Native `<dialog>` gives a focus trap, Escape, and a top layer for free.
- Full control of the blueprint look with nothing to restyle or fight.

**Cons**:
- You own the accessibility details of the toast, the menu, and the switcher, so they need tests.

### Option 2: shadcn/ui (Radix plus Tailwind), restyled

Copy in shadcn components and restyle them to the blueprint look.

**Pros**:
- Fast start with proven accessible behaviour.

**Cons**:
- Brings Radix and its client JavaScript to every page that uses a part.
- Its default look is very recognisable; restyling it fully costs most of the time it saves.

### Option 3: Radix Primitives, unstyled

Use Radix Dialog, Toast, and Radio Group, styled by hand.

**Pros**:
- Strong accessibility with full styling control.

**Cons**:
- Adds client JavaScript and a dependency for parts the platform already provides.

## Decision

**Chosen option**: Option 1: Tokens in Tailwind v4 plus your own components on native HTML.

Build the blueprint design system as CSS tokens in `app/globals.css` and hand built components in `components/ui/` and `components/site/`, with Lucide for icons and nothing else added.

**Implementation skills**: `tailwind-4-docs` (`lombiq/tailwind-agent-skills`, `.agents/skills/tailwind-4-docs/`) · `web-perf` (`cloudflare/skills`, `.agents/skills/web-perf/`)

## Rationale

The site is read far more than it is used, so every kilobyte of client code is a cost a recruiter on a phone pays for no benefit. The platform now covers the hard parts: `<dialog>` handles focus and Escape, CSS handles scroll animation and theming, and React 19.3 ships `<ViewTransition>` with no setup in Next 16. That leaves only a toast region, a menu, and a radio group to build by hand, all small and testable.

The blueprint look is distinctive, so a component kit's default style would have to be stripped out anyway. Square hairline boxes and mono labels are cheaper to build directly than to restyle. Tokens in CSS keep Tailwind v4 as the single source, and a contrast test on those tokens turns WCAG AA from a promise into a check that runs on every commit.

Settled calls, each with the runner up:
- **Where `design.md` lives**: `docs/design.md`, next to the specs and scope (runner up: the repo root, which clutters it).
- **Theme mechanism**: a `dark` class on `<html>` plus a Tailwind `@custom-variant dark`, as spec 0001 set (runner up: a `data-theme` attribute, equivalent but would diverge from spec 0001).
- **Theme switcher shape**: a three choice segmented radio group with icons and text labels (runner up: a dropdown menu, one more click).
- **Section entry animation**: CSS `animation-timeline: view()` inside `@supports` (runner up: an IntersectionObserver script, which needs JavaScript and risks hidden content).
- **Corners**: square (0) for boxes and cards, 2px for buttons and inputs, to keep the drawing feel (runner up: 6px everywhere, softer but generic).
- **Shadows**: none; hairline borders separate surfaces. Only the modal gets a soft shadow to lift it off the page.
- **Form fields now**: `TextField` and `TextArea` are built here so the forms feature only wires behaviour (runner up: leave them to the forms spec, which would split the visual system).
- **Agent skill search for Lucide**: skipped; it is an icon set with no setup worth a skill.

## Feature design

**Direction**: engineering blueprint. Hairline 1px rules, square boxes, mono labels in small caps style (uppercase, 0.06em tracking), spec sheet key and value lists, and a 24px grid pattern only in header bands. The deep green accent marks links, primary actions, focus, and key numbers. Reference: direction B on the samples page.

**Tokens (starting values; the contrast test must pass, adjust a value if it fails)**:

| Token | Light | Dark | Use |
|---|---|---|---|
| `--color-bg` | `#f4f7f5` | `#0a1310` | page background |
| `--color-surface` | `#fbfcfb` | `#0f1a16` | boxes, cards, inputs, image placeholders |
| `--color-fg` | `#0f1a15` | `#dcebe3` | body text |
| `--color-muted` | `#4f5f57` | `#8aa397` | secondary text, labels |
| `--color-line` | `#c9d6cf` | `#22382d` | decorative hairlines (not meaningful boundaries) |
| `--color-line-strong` | `#6f8379` | `#557566` | input borders, meaningful boundaries (3:1) |
| `--color-grid` | `rgb(29 107 72 / 0.09)` | `rgb(92 200 150 / 0.08)` | grid band pattern |
| `--color-accent` | `#1d6b48` | `#5cc896` | links, primary button, focus ring, key numbers |
| `--color-accent-ink` | `#ffffff` | `#06140d` | text on accent |
| `--color-accent-soft` | `#e3efe8` | `#13261c` | success toast and selected states |
| `--color-danger` | `#b42318` | `#f97066` | errors |
| `--color-danger-soft` | `#fdecea` | `#2a1311` | error toast background |

Pairs the contrast test checks (both themes): fg, muted, accent, and danger on bg and on surface; accent ink on accent; fg on accent soft and on danger soft; line strong and accent on bg (3:1).

**Type scale** (Plex Sans unless noted; display sizes use `clamp`):

| Role | Size | Weight | Notes |
|---|---|---|---|
| display | `clamp(2.25rem, 5vw, 3.25rem)` | 600 | line height 1.06, tracking -0.02em, `text-wrap: balance` |
| h1 | 2.25rem | 600 | line height 1.1 |
| h2 | 1.625rem | 600 | |
| h3 | 1.25rem | 600 | |
| body | 1rem | 400 | line height 1.6, max 68ch |
| lead | 1.125rem | 400 | muted |
| small | 0.875rem | 400 | |
| label | 0.75rem, Plex Mono | 500 | uppercase, tracking 0.06em |
| number | Plex Mono | 500 | `tabular-nums`, accent in stat tiles |

**Spacing and layout**: Tailwind's 4px scale. `Container` max width 72rem with a side gutter of 1rem (1.5rem from `md`). Sections pad 4rem vertically (6rem from `md`). Breakpoints are Tailwind defaults.

**Motion tokens**: `--duration-fast` 120ms (hover, press), `--duration-base` 200ms (toasts, menu, modal), `--duration-slow` 320ms (section entry, view transitions); `--ease-out` `cubic-bezier(0.2, 0.8, 0.2, 1)`. A global reduced motion rule sets animation and transition durations to near zero and disables `::view-transition-*` animation.

**Data model sketch**: no persisted data. Client state only:
- Theme preference: `localStorage.theme`, one of `system`, `light`, `dark`; absent means `system`.
- Toast queue: React context state, each toast `{ id: string, kind: "success" | "error" | "info", title: string, description?: string }`, capped at 3.

**State transitions**:
- Theme: `system` ⇄ `light` ⇄ `dark`, any to any by the switcher; while `system`, the resolved theme follows the OS live.
- Toast: shown → (5s timer, paused on hover or focus, for success and info) → leaving → removed; or shown → dismissed by the button → removed. Error toasts skip the timer.
- Modal: closed → open (`showModal`) → closed (Escape, close button, or backdrop if enabled), focus back to the opener.

**API surface** (component interfaces; there are no HTTP endpoints):

| Component | Key props | Behaviour | Errors and edge cases |
|---|---|---|---|
| `Button` | `variant`, `size`, `pending?`, `disabled?`, `href?`, `iconStart?` | `<a>` when `href`, else `<button type="button">` unless `type` given | pending ignores clicks and sets `aria-busy`; disabled link renders as text, not a dead link |
| `TextLink` | `href`, `external?` | external adds `rel="noopener"`, an icon, and "opens in a new tab" for screen readers | |
| `Section` | `variant: "plain" \| "grid"`, `labelledBy?` | grid band draws the pattern behind its own content only | |
| `StatTile` | `value: string`, `label: string`, `context?` | value in mono accent | long labels wrap, tiles keep equal height in a row |
| `SpecSheet` | `items: readonly { key: string; value: ReactNode }[]` | `<dl>` with dashed row rules | empty list renders nothing |
| `Tag` | `children`, `href?` | mono, hairline box; a link when `href` | |
| `TextField`, `TextArea` | `label`, `name`, `error?`, `hint?`, native input props | label always visible; error tied by `aria-describedby`, `aria-invalid` set | error text says what is wrong and how to fix it |
| `Modal` | `open`, `onClose`, `title`, `closeOnBackdrop?` | native `<dialog>`, labelled by title | focus returns to the opener on close |
| `useToast` | `toast({ kind, title, description? })`, `dismiss(id)` | needs `Toaster` mounted once in the root layout | calling without `Toaster` is a bug and throws in development |
| `ThemeSwitcher` | none | radio group of System, Light, Dark | storage failure keeps the choice for the visit |

**Value sourcing**:

| Action | Value produced / displayed | Source |
|---|---|---|
| Inline theme script | resolved theme | `localStorage.theme`, else `system` resolved by `matchMedia('(prefers-color-scheme: dark)')` |
| `ThemeSwitcher` | current choice | same as above, updated on change |
| `SiteHeader` | site name | `getProfile().name` from the read layer (spec 0002) |
| `SiteHeader` | nav items | a `navItems` constant in `components/site/nav.ts` |
| `SiteFooter` | links, year | profile `links` (spec 0002); year from the build date |
| `StatTile` | value, label, context | caller; on pages from `results[]` (spec 0002) |
| `/styleguide` swatches | contrast ratio | computed at build from the token values by the same pure function the test uses |
| Toast | kind, title, description | the caller of `toast()` |

**Key invariants**:
- Components use tokens only; no literal colours (enforced by test).
- Every token pair in the checked list meets AA in both themes (enforced by test).
- Content is visible with JavaScript off and before any animation runs.
- Focus is always visible on keyboard use.
- `alert`, `confirm`, and `prompt` never appear (enforced by lint).

**Security model**: no user data. The inline theme script reads one localStorage key and writes only a class and `color-scheme`. If a Content Security Policy is added at launch, this script needs a hash in it (see Follow-up).

**Configuration required**: none.

**Critical test scenarios**:
- Happy path: open the site with the OS in dark mode and no saved choice, the first paint is dark; pick Light, reload, it stays light; pick System, it follows the OS again, verifies **AC-4**
- Failure case: a component file gains a hex colour, or a token change drops a pair below AA, and `pnpm test` fails naming it, verifies **AC-2**, **AC-5**
- Accessibility: open the modal by keyboard, Tab cycles inside, Escape closes, focus lands on the opener; trigger an error toast, a screen reader announces it and it stays until dismissed, verifies **AC-9**, **AC-10**
- Reduced motion: with reduced motion on, sections appear without movement and route changes do not animate, verifies **AC-7**

## Build plan

1. Add tokens to `app/globals.css` (`@theme` colours, fonts, motion; light values on `:root`, dark values on `.dark`; `@custom-variant dark`; base body styles; focus ring; reduced motion rule; grid band utility), satisfies **AC-2**, **AC-6**, **AC-7**, **AC-14**
2. Load IBM Plex Sans and Mono with `next/font/google` in `app/layout.tsx`, mapped to `--font-sans` and `--font-mono`, satisfies **AC-3**
3. Add the inline theme script to `<head>` (with `suppressHydrationWarning` on `<html>`) and build `ThemeSwitcher`, satisfies **AC-4**
4. Write a pure contrast function and token parser in `features/design/`, with Vitest tests for the AA pairs and for no literal colours under `components/` and `app/`; turn on ESLint `no-alert`, satisfies **AC-2**, **AC-5**, **AC-9**
5. Build the primitives: `Button`, `TextLink`, `Container`, `Section`, `Card`, `Tag`, `StatTile`, `SpecSheet`, `Icon`, `Spinner`, `Skeleton`, `VisuallyHidden`, `TextField`, `TextArea` (add `lucide-react`), satisfies **AC-6**, **AC-8**, **AC-11**
6. Build `Modal` and `Toaster` with `useToast`, satisfies **AC-9**, **AC-10**
7. Build the shell: `SkipLink`, `SiteHeader` with the mobile menu, `SiteFooter`, `navItems`, `app/loading.tsx`, the `<ViewTransition>` route crossfade, and section entry animation, satisfies **AC-7**, **AC-11**, **AC-12**
8. Build `/styleguide` with every component, state, swatch, and the type scale, `noindex`, satisfies **AC-13**
9. Write `docs/design.md`, satisfies **AC-1**
10. Run lint, typecheck, test, and build, satisfies **AC-15**

## Consequences

**Positive**:
- Every later page is assembled from tested parts, which is what makes the fast track fast.
- Almost no client JavaScript: only the switcher, menu, modal, and toasts hydrate.
- AA contrast and the no literal colour rule are checked on every commit.

**Negative / tradeoffs**:
- You own the accessible behaviour of the toast, menu, and switcher, so `/check verify` must exercise them by keyboard.
- The blueprint look can feel technical to a non technical client; warm copy and real photos on the about page offset it.
- View transitions do not animate in older browsers (the site still works; it just cuts).

**Neutral**:
- `lucide-react` becomes the one new runtime dependency.
- `/styleguide` ships to production but is hidden from search and nav.

## Follow-up

- [ ] When a Content Security Policy is added at launch (#15), include a hash for the inline theme script.
- [ ] `/sync` should point root `AGENTS.md` at `docs/design.md` as the UI source of truth.
