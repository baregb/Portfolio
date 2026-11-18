---
name: blueprint-mix-design-system
source: derived (spec 0003, from the mixed sample of four directions)
status: current direction, open to change (see "Changing the direction")
character: "An architect's drawing with a confident voice. A calm blueprint base of hairlines, mono labels, and square boxes carries big, heavy Bricolage Grotesque headlines and one deep green block, while everything you touch floats soft and round."
tokens: "Real values live in app/globals.css (@theme static for light, html.dark for dark). The colour table below mirrors it, and features/design/tokens.test.ts fails if the two disagree."
contrast: "Body text 16.51:1 light, 15.29:1 dark. Muted 6.26:1 / 6.97:1. Accent on bg 5.99:1 / 9.12:1. Label on primary button 6.46:1 / 9.12:1. Tightest pair: block muted on block, 4.69:1 light. Every pair in CONTRAST_PAIRS is checked on each test run."
---

# Design system

This file is the art direction and the rules. `/styleguide` shows every piece live in both themes, `app/globals.css` holds the values, and [spec 0003](specs/0003-design-system.md) is the decision record.

**This is the current direction, not a final one.** The art direction may change as the site takes shape. The system is built so a change lands in a few places (below) rather than across every page.

## Changing the direction

The look lives in three layers, so a new direction is a contained change:

1. **Tokens** (`app/globals.css`): colours, fonts, type sizes, radius, shadows, and motion. A new palette or type scale is an edit here, and every page follows. `pnpm test` then checks every colour pair against WCAG AA, and fails until the table in this file matches.
2. **Components** (`components/ui/`, `components/site/`): shapes and patterns, such as round controls, square boxes, the frosted nav, the green block. A new treatment is an edit to the component, not to the pages that use it.
3. **This file**: the character, the rules, and the do's and don'ts. Update it in the same change so later pages follow the new direction.

To keep a change cheap, pages stay free of look decisions: they compose components and use token utilities, never literal colours or one off styles. Fonts are set in `app/layout.tsx`. A big change (new direction, not a tweak) should go through `/architect` so spec 0003 is superseded rather than silently drifting, and `/styleguide` is the place to review it in both themes before any page changes.

## Build mandate

You are a senior product designer. Every page ships as a complete, professional product surface: brand, real copy written for that page, a considered layout with hierarchy, every state (empty, loading, error), supporting content, and the footer. Never a lone form on an empty page, never a bare widget where a product would ship a full surface. Assemble pages from the components below; if a page needs something new, add it to `components/ui/` and to `/styleguide`, not inline in the page.

## Character and direction

The mix takes the best of four directions:

- **Blueprint base (B).** Hairline 1px rules, square content boxes, mono labels, spec sheets of keys and values, and a faint 24px grid in the hero band. It reads as an architect's site before anyone reads a word.
- **Bold voice (C).** Bricolage Grotesque headlines at large scale and heavy weight, one highlighted phrase in the hero, and one full width deep green block for the featured case study with big numbers.
- **Calm reading (A).** Generous whitespace, short text columns, a quiet body face. Long case studies stay easy to read.
- **Soft chrome (D).** Anything you touch floats: a frosted pill nav, pill buttons, the round profile photo, rounded toasts with a soft shadow.

The one rule that holds it together: **content is square, controls are round.**

## Colour

One accent (deep green), a neutral ladder tinted toward it, and one danger red. Semantic use only: green marks links, primary actions, focus, key numbers, and success; red marks errors only.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--color-bg` | `#f4f7f5` | `#0a1310` | page background |
| `--color-surface` | `#fbfcfb` | `#0f1a16` | boxes, cards, inputs, image placeholders |
| `--color-fg` | `#0f1a15` | `#dcebe3` | body text, headlines |
| `--color-muted` | `#4f5f57` | `#8aa397` | secondary text, labels |
| `--color-line` | `#c9d6cf` | `#22382d` | decorative hairlines only |
| `--color-line-strong` | `#6f8379` | `#557566` | input borders and other meaningful boundaries (3:1) |
| `--color-grid` | `rgb(29 107 72 / 0.09)` | `rgb(92 200 150 / 0.08)` | the grid band pattern |
| `--color-accent` | `#1d6b48` | `#5cc896` | links, primary button, focus ring, key numbers |
| `--color-accent-ink` | `#ffffff` | `#06140d` | text on accent |
| `--color-accent-soft` | `#e3efe8` | `#13261c` | selected states, the highlighted hero phrase |
| `--color-danger` | `#b42318` | `#f97066` | error text and borders |
| `--color-danger-soft` | `#fdecea` | `#2a1311` | error toast background |
| `--color-block` | `#1d6b48` | `#123d2a` | the green block background |
| `--color-block-ink` | `#f1faf5` | `#e6f7ee` | text and big numbers on the block |
| `--color-block-muted` | `#c4e3d2` | `#9fd3b8` | secondary text on the block |
| `--color-block-line` | `rgb(241 250 245 / 0.22)` | `rgb(230 247 238 / 0.16)` | rules and tag borders on the block |
| `--color-nav` | `rgb(251 252 251 / 0.74)` | `rgb(15 26 22 / 0.72)` | the frosted nav, with backdrop blur |

Tailwind utilities map one to one: `bg-bg`, `bg-surface`, `text-fg`, `text-muted`, `border-line`, `border-line-strong`, `text-accent`, `bg-accent`, `text-accent-ink`, `bg-accent-soft`, `text-danger`, `bg-danger-soft`, `bg-block`, `text-block-ink`, `text-block-muted`, `border-block-line`. Tailwind's default palette is switched off, so `bg-white` and friends do not exist.

## Type

Three faces, each with one job, all self hosted through `next/font`:

- **Bricolage Grotesque** (`font-display`): headlines and the big numbers on the green block. Weight 700 to 800, tight negative tracking.
- **Geist** (`font-sans`): everything you read. 400 for body, 500 for controls, 600 for emphasis.
- **Geist Mono** (`font-mono`): labels, tags, spec sheets, and numbers outside the green block.

| Role | Utility | Face | Size | Notes |
|---|---|---|---|---|
| display | `text-display font-extrabold` | Bricolage | `clamp(2.75rem, 8vw, 6rem)` | one per page, in the hero; line height 0.92 |
| title (h1) | `text-title font-extrabold` | Bricolage | `clamp(2.25rem, 5vw, 3.5rem)` | page titles |
| heading (h2) | `text-heading font-bold` | Bricolage | 1.75rem | section headings |
| subheading (h3) | `text-subheading font-bold` | Bricolage | 1.25rem | card and block titles |
| lead | `text-lead text-muted` | Geist | 1.125rem | the line under a title |
| body | `text-base` | Geist | 1rem, line height 1.6 | at most `max-w-prose` (68ch) wide |
| small | `text-sm` | Geist | 0.875rem | meta, hints |
| label | `label` | Geist Mono | 0.75rem, uppercase, 0.08em tracking | eyebrows, keys, section labels |
| number | `font-mono text-2xl text-accent tabular-nums` | Geist Mono | 1.5rem | stat tiles on the page |
| number (block) | `font-display text-stat font-extrabold` | Bricolage | `clamp(2.25rem, 4.6vw, 3.5rem)` | stat tiles on the green block |

Headings use `text-wrap: balance` automatically. Heading levels follow the page outline, never the size you want: pick the level, then the utility.

## Space, layout, and responsive behaviour

- Tailwind's 4px scale. Gaps and padding are multiples of it; use `gap` on flex and grid, not margins between siblings.
- Pages: `Container` (max 72rem, 1rem side gutter, 1.5rem from `md`). Sections: `Section` (4rem vertical, 6rem from `md`).
- Build phone first at 390px and layer up. Tailwind's default breakpoints; the nav folds into the menu below `md`.
- Every grid or flex child that holds text gets `min-w-0`, and long values wrap, so nothing pushes the page wider than the screen.
- Touch targets are at least 44px (buttons `md` are `min-h-11`, icon buttons `size-11` or `size-10` plus padding).

## Rules, radius, and depth

- **Square** (no radius): cards, spec sheets, tags, badges, the green block, image frames for content.
- **2px** (`rounded-input`): text inputs and the square `line` button.
- **Round** (`rounded-full`): buttons, the nav bar, nav links, the theme switcher, icon buttons, the profile photo.
- **14px** (`rounded-panel`): toasts, the modal, the mobile menu panel.
- **Shadow** (`shadow-soft`) only on floating pieces: the nav, toasts, the modal, the mobile menu, secondary buttons. Everything else separates with a hairline.

## Grid and the green block

- The grid pattern (`Section variant="grid"`, or the `grid-band` utility) appears only in hero and page header bands, never behind running text.
- The green block (`Section variant="accent"`) is for the one featured item on a page, at most once per page. Inside it use `StatTile size="large"`, `Tag tone="onAccent"`, and `Button variant="onAccent"`.

## Motion

| Token | Value | Use |
|---|---|---|
| `--duration-fast` | 120ms | hover, press, colour changes |
| `--duration-base` | 200ms | toasts, modal, menu |
| `--duration-slow` | 320ms | section entry, route crossfade |
| `--ease-out` | `cubic-bezier(0.2, 0.8, 0.2, 1)` | everything (Tailwind's `ease-out`) |

- Route changes crossfade through React `<ViewTransition>` in the root layout.
- Add `reveal` to a `Section` to let it rise 8px as it enters, using CSS scroll driven animation. Content is never hidden at rest, and browsers without support simply show it.
- Buttons press down 1px. No bouncing, no parallax, no animated numbers.
- Under `prefers-reduced-motion: reduce` every animation, transition, and view transition is off. Never add motion that bypasses the global rule.

## Components

All in `components/ui/` (primitives) and `components/site/` (shell). Named exports, typed props, tokens only.

| Component | Variants and states | Use it for |
|---|---|---|
| `Button` | `primary`, `secondary`, `ghost`, `line`, `onAccent`; sizes `sm`, `md`; `pending` (spinner, `aria-busy`, ignores clicks, keeps focus), `disabled`; a link when given `href` (`external` opens a new tab; a disabled link renders as text) | every action. One `primary` per view. `line` for quiet actions inside content boxes ("Request details") |
| `TextLink` | internal, `external` (icon and a screen reader note) | links inside running text |
| `Container` | none | the page width and gutter |
| `Section` | `plain`, `grid`, `accent`; `reveal` | full width bands |
| `Card` | `as` div, article, aside, li | square hairline content boxes |
| `Tag` | `default`, `onAccent`; a link when given `href` | stack entries and other short mono labels |
| `Badge` | none | a status such as "Available on request" |
| `StatTile` | `standard`, `large` | one sourced number with its label; place tiles inside a `<dl>` |
| `SpecSheet` | none (renders nothing when empty) | key and value facts, the blueprint signature |
| `Icon` | decorative (default) or with `label` | every Lucide icon |
| `Spinner` | none | inside a busy control |
| `Skeleton` | sized by class | holding layout for parts that load in the browser |
| `VisuallyHidden` | none | text for screen readers only |
| `TextField`, `TextArea` | `hint`, `error` (sets `aria-invalid`, read with the field), `required`, `disabled` | every form input; the label always shows |
| `Modal` | `closeOnBackdrop`, `description` | focused tasks that need the page to wait; native `<dialog>` |
| `Toaster` and `useToast` | `success`, `info` (polite, close after 5s, pause on hover or focus), `error` (assertive, stays until dismissed); at most 3 | short confirmations and failures after an action |
| `ThemeSwitcher` | none | System, Light, Dark; already in the header |
| `SkipLink`, `SiteHeader`, `SiteFooter` | header `items`, `position` | the shell; already in `app/layout.tsx` |

Add a nav entry by appending to `navItems` in `components/site/nav.ts` when its route ships.

## Loading, empty, and error states

- Pages are prerendered and links prefetch, so there is no route level loading skeleton (Next does not support `loading.js` with static export).
- Anything that loads in the browser (form submits, the AI chat later) shows `Skeleton` blocks or a `pending` button, inside a `role="status"` region.
- Empty states are a `Card` with an icon, a heading that says what is empty, a line on what to do, and one action. See `/styleguide` (feedback section).
- Errors say what went wrong and how to fix it, in plain words, with no apology and no codes. Field errors sit under the field; failures after an action use an error toast.

## Images

- Image frames are fixed aspect ratio boxes on `bg-surface`, so nothing shifts while they load. Real images come from `content/images/` through the spec 0001 image script (AVIF and WebP at 640, 960, 1280, 1920).
- The profile photo goes in at a size where the face reads: a head and shoulders crop about 160 to 200px wide in the home hero, and the full portrait large on the about page (spec 0003 follow-up).

## Do's and don'ts

- Do use tokens for every colour, font, radius, shadow, duration, and easing. A literal colour anywhere in `components/` or `app/` fails `pnpm test`.
- Do keep content square and controls round.
- Do use Bricolage only for headlines and block numbers; never for body text or buttons.
- Do give every interactive element the global focus ring; never remove an outline without replacing it.
- Don't use `alert`, `confirm`, or `prompt` (lint fails); use `Modal` or a toast.
- Don't put the grid behind running text, or the green block on a page twice.
- Don't add shadows to content boxes, or a second accent colour.
- Don't hardcode left and right where logical properties work (`ps-*`, `pe-*`, `ms-*`, `me-*`).
