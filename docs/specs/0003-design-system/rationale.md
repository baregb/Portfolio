# 0003. Design system and UI foundation (decision record)

_Why spec 0003 chose what it did. The build spec is [index.md](index.md); `/develop` skips this file._

## Context

Every page in Journeys 1 and 2 needs the same type, colour, spacing, motion, and components. Without a shared system each page would invent its own look, and the premium app standard (both themes, purposeful motion, loading states, themed toasts and modals, WCAG 2.2 AA) would be met unevenly or not at all.

The site is a static export (spec 0001): no server, theme set by a class on `<html>` from a small inline script, no cookies. Most pages are read only, so client JavaScript should stay small. Tailwind v4 is installed and reads its theme from CSS. Content comes from the typed read layer (spec 0002), which already supplies stat tile values (`results[]`), stack tags, and the profile.

You compared four directions on a samples page with real content (A editorial technical, B engineering blueprint, C bold expressive, D minimal soft), first picked B, then asked for a mix of all four. On a mixed sample you chose: B's palette and structure as the base, C's scale and colour block with Bricolage Grotesque headlines, A's calm reading text, and D's soft floating chrome. You also chose a deep green accent, a three way theme switch that follows the system, subtle motion, and components built on native HTML.

## Options considered

### Option 1: Tokens in Tailwind v4 plus your own components on native HTML

Tokens in CSS through `@theme`; components written by hand on `<dialog>`, `<button>`, and a small toast region.

**Pros**:
- The least client JavaScript of any option, which suits a mostly static site.
- Native `<dialog>` gives a focus trap, Escape, and a top layer for free.
- Full control of the mixed look with nothing to restyle or fight.

**Cons**:
- You own the accessibility details of the toast, the menu, and the switcher, so they need tests.

### Option 2: shadcn/ui (Radix plus Tailwind), restyled

Copy in shadcn components and restyle them to the mixed look.

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

## Rationale

The site is read far more than it is used, so every kilobyte of client code is a cost a recruiter on a phone pays for no benefit. The platform now covers the hard parts: `<dialog>` handles focus and Escape, CSS handles scroll animation and theming, and React 19.3 ships `<ViewTransition>` with no setup in Next 16. That leaves only a toast region, a menu, and a radio group to build by hand, all small and testable.

The mixed look is distinctive, so a component kit's default style would have to be stripped out anyway. Square hairline boxes, mono labels, and a frosted pill nav are cheaper to build directly than to restyle. Tokens in CSS keep Tailwind v4 as the single source, and a contrast test on those tokens turns WCAG AA from a promise into a check that runs on every commit.

Settled calls, each with the runner up:
- **Where `design.md` lives**: `docs/design.md`, next to the specs and scope (runner up: the repo root, which clutters it).
- **Theme mechanism**: a `dark` class on `<html>` plus a Tailwind `@custom-variant dark`, as spec 0001 set (runner up: a `data-theme` attribute, equivalent but would diverge from spec 0001).
- **Theme switcher shape**: a three choice segmented radio group with icons and text labels (runner up: a dropdown menu, one more click).
- **Section entry animation**: CSS `animation-timeline: view()` inside `@supports` (runner up: an IntersectionObserver script, which needs JavaScript and risks hidden content).
- **Corners**: square for content (cards, spec sheets, tags, badges), 2px for inputs, fully round for controls (buttons, nav, switcher) and 14px for toasts and the modal, so what you read looks drawn and what you touch looks touchable (runner up: one radius everywhere, simpler but loses the split).
- **Shadows**: only on floating pieces (nav, toasts, modal, secondary button); hairline borders separate everything else (runner up: no shadows at all, which flattens the floating nav).
- **Numbers**: Bricolage Grotesque inside the green block, Geist Mono everywhere else (runner up: mono everywhere, which loses C's punch).
- **Form fields now**: `TextField` and `TextArea` are built here so the forms feature only wires behaviour (runner up: leave them to the forms spec, which would split the visual system).
- **Agent skill search for Lucide**: skipped; it is an icon set with no setup worth a skill.
