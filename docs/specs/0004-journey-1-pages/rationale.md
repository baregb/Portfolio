# 0004. Rationale: Journey 1 pages

## Context

Journey 1 is the recruiter path: a hiring manager opens the link sent with an application, needs to see within one screen what you do, then reads proof and either downloads your CV or gets in touch. Six scope features make up that path (#5 home, #6 role lenses, #7 case study page, #9 project library, #10 about and skills, #11 CV download). The fast track (2026-11-17) puts them in one spec and one build, because they read the same content and share the same design system. The launch target is about a month from 2026-11-16.

The foundations are in place. Content lives in checked MDX and YAML files behind a typed read layer that already orders, filters, and resolves everything (spec 0002). The look lives in tokens and components that are documented as the current direction, open to change (spec 0003), so pages must hold no look decisions of their own. The stack is a static export: every page is a file made at build time, nothing renders on request, and only `/api/*` runs code (spec 0001). Images are sized at build by a sharp script that spec 0001 named but nobody has built yet.

Several things the pages need are not in the content model: which phrase of the headline the hero highlights, where to crop a tall photo into a square, and where the CV comes from. The contact and request forms belong to a later group (D), yet home must reach contact in one click and on request projects must offer a way to ask, so the path needs a destination before the forms exist. A lens must be a link you can send with an application, which matters for how it is addressed and titled.

## Options considered

### Option 1: one static route per page, lenses as tailored home pages (chosen)

Each page is its own static route built from the read layer. A lens is the home composition with the lens's headline, intro, projects, and skills, at `/for/<lens>`. Filters run in the browser and write to the address. A build step makes image variants and copies the CV.

**Pros**:
- Each lens has its own address, title, and (later) social card, which is what an application link needs.
- One composition serves home and every lens, so there is one design to get right.
- Everything stays static, which the stack demands.

**Cons**:
- Filters need JavaScript; without it the full list shows.
- More routes to verify than a single page design.

### Option 2: lenses as a filter on home (`/?lens=`)

One home page that swaps its headline and project order in the browser from a query value.

**Pros**:
- The least code: no lens routes, no second set of metadata.

**Cons**:
- Every lens shares one title and one social card, so a link pasted into LinkedIn or an email always previews as the generic home page.
- The tailored text appears only after JavaScript runs; crawlers and JavaScript off visitors see the generic page.

### Option 3: plain lens pages without the hero

Lens pages at their own address, but a simple list page (headline, intro, projects, skills) with no hero or photo.

**Pros**:
- Less layout work than a tailored home.

**Cons**:
- The page you send with an application feels less personal than home, which is the opposite of what a lens is for.
- A second page design to keep consistent with home.

### CV options weighed

One PDF you supply (chosen), one CV built from site content plus a new experience and education file, or one PDF per lens. Building the CV from content would keep it in sync, but needs a print page and a headless browser PDF step in the build, plus a new content collection for work history the site does not otherwise show. Per lens PDFs are the most tailored, but triple the upkeep. One supplied PDF is the fastest path to launch, and the build check makes a missing file loud.

## Rationale

You chose proof first for home, a tailored home for each lens, one supplied CV, a square photo, and a contact page with your links now. These fit the forces above. A recruiter decides in seconds, so the first scroll must carry a real result (the green block with the numbers from your repos). A lens exists to be sent with an application, so it needs its own address and title, which only Option 1 gives without a server. Reusing the home composition for lenses means four pages from one design, which matters with a month to launch.

The small calls were settled with the same goals: keep the path unbroken before group D (contact and request pages ship now and gain forms later), keep pages free of look decisions (every piece is tokens plus existing components, and the literal colour scan now covers `features/`), and keep values traceable (the two new content fields exist only because the hero and photo needed a named source). The library lists flagships and cards together so the filters cover everything; cards keep no route of their own, as spec 0002 requires, and get an anchor on `/work` instead. Native selects were chosen for the filters over tag buttons because they stay compact on a phone and need no custom keyboard handling. The CV label shows the file type and size so visitors know a download starts.

The runner ups for the settled calls: a `<details>` based filter panel (more custom work, no gain at this size); a separate `/work/<slug>/request` route (cards have no `/work/<slug>`, so a flat `/request/<slug>` covers both); showing a public email on contact (you chose links only, which avoids spam); a round photo (spec 0003's default, replaced by your choice of square).
