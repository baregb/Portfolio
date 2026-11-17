# 0001. Stack and architecture: rationale

The decision record behind [index.md](index.md). `/develop` reads `index.md`; this file is for the human reasons.

## Context

> ⚠️ Premise note: the portfolio repo is public, and portfolio content lives as files in that repo. Anything marked "available on request" must therefore never be written into the repo in full, not even in a draft, a comment, or git history. Only the public summary goes in. If that rule slips once, the detail is public for good (git history and forks keep it). The right framing is: the repo holds only what you are happy for anyone to read; on request details stay in your private notes and are shared by you, by email, after a request.

You are building a personal portfolio to send with job applications and freelance pitches, targeting solutions architect, software developer, prompt engineering, and AI assisted (vibecoding) roles. The content is mostly fixed between edits: a home page, role lenses, 6 to 8 case studies, a project library, about, a CV. The only moving parts at launch are two forms (contact, request access). After launch come an AI chat grounded in the site content, articles, and a private content admin. You are the only developer and the only content editor. Traffic will be small (hundreds to low thousands of visits a month), so cost should sit at or near zero.

The site is itself evidence. Hiring managers will judge it on speed, accessibility, and polish, and some will read the code. It must meet your premium app standard (theme switcher, motion that respects reduced motion, loading states, themed toasts and modals, no native dialogs) and WCAG 2.2 AA. Most target jobs ask for React and Next.js, which is also your daily stack across about twenty existing projects.

Forces at play: a launch target of about a month (from 2026-11-16); a public repo, so secrets and private project detail must stay out of it; a wish to host on Cloudflare and stay free at this traffic; and later features (AI chat, admin) that must fit without a rebuild. Not deciding now blocks every other feature, since each one depends on the framework, the content source, and the host.

## Options considered

### Option 1: Next.js static export on Workers Static Assets, plus a Hono API Worker

Next.js 16 with `output: 'export'` produces plain HTML, CSS, and JavaScript files at build time from typed MDX in the repo. Cloudflare Workers Static Assets serves them directly. One small Hono Worker in the same project answers only `/api/*`: the forms now, the AI chat later, with D1 for submissions, Turnstile, rate limiting, and the email binding.

**Pros**:
- Pages are genuinely static: they keep loading if the Worker breaks, and static asset requests are free and do not count against Worker limits.
- No adapter between Next.js and Cloudflare, so nothing lags behind Next releases.
- The build refuses anything that needs a server, so a page cannot silently become dynamic.
- The Worker is tiny, so its size and CPU limits are easy to stay under.

**Cons**:
- No server actions, middleware, or on demand rendering; forms post to `/api` with `fetch`.
- Two codebases in one repo (the site and the Worker).
- A static content security policy has to allow inline scripts, because Next's export inlines page data.
- Less of a "Next.js server" showcase.

### Option 2: Next.js on Workers through OpenNext

Full Next.js deployed to Workers through the OpenNext adapter, with server actions for the forms. This was the first draft's choice.

**Pros**:
- Every Next.js feature is available, including server actions and server rendering.
- One codebase, one framework.

**Cons**:
- Every page request runs through the Worker, even for pages built ahead of time, so a bad deploy, the 3 MiB free size limit, or the free plan's CPU limit can take the whole site down.
- Pages need an explicit cache setup to avoid rendering again on each request.
- The MDX loader evaluates code in a way Workers blocks, so any page that turns dynamic (a cookie read for the theme, a server read of filters) works in development and at build, then fails in production.
- Cloudflare now steers new projects to a different adapter (vinext), so the recommended path is moving.

### Option 3: Next.js on Vercel Hobby

The same app deployed natively on Vercel's free plan, with outside providers for storage, email, and bot protection.

**Pros**:
- Native Next.js; every feature works as documented with no adapter or export limits.
- A workflow you already know.

**Cons**:
- Not on Cloudflare, which you want to use.
- Extra vendors for bot protection, storage, and email (more accounts and keys).
- Built in analytics custom events were not confirmed on the free plan.

### Option 4: Astro on Cloudflare

A content focused framework that ships almost no JavaScript, with Worker endpoints for the forms.

**Pros**:
- Top speed scores for a content site; content collections built in.

**Cons**:
- A new framework a month before launch.
- Less aligned with the React and Next.js roles you are applying for.

A fifth idea, content in a Supabase database (your capeflux and hazan-bj pattern), was set aside early: it adds a runtime dependency to the most important path (a recruiter reading a case study), loses git history for content, and free projects pause when idle.

## Rationale

The first draft chose OpenNext (Option 2), the option you picked during the stack walk. A cross check by a second model (Fable) showed that OpenNext routes every page through the Worker and that the MDX loader cannot run on Workers. That broke the draft's central promise: that the portfolio stays readable if any code fails. You then chose Option 1, which makes that promise true by construction. Pages are files, and the build fails if any page needs a server, so the risk that worried us (a page silently turning dynamic and failing only in production) cannot happen.

Everything else follows from the site's nature. Content changes when you edit it, not when visitors act, so it belongs in git and is built once into files. The only runtime work is what visitors create (enquiries, access requests, later chat messages), and that is small enough for a single Hono Worker with one D1 table. Hono over a hand written handler because it gives typed routing and middleware with almost no size cost. Losing server actions costs little: two forms posting JSON to an endpoint is a well worn pattern, and it keeps the form logic testable on its own.

You chose Cloudflare over my original Vercel recommendation, and with the static export that choice gets stronger: Static Assets serves the site for free with no adapter, and Turnstile, rate limiting, D1, and email are native bindings (direct handles a Worker gets to Cloudflare services) with no extra keys. Umami and Sentry are the only outside services: Cloudflare's own analytics has no custom events, and Workers logs give no alerts or error grouping. Sentry runs in the Worker only at launch, because the Worker is the only runtime code and a browser SDK would add weight to every page.

The cross check also closed the gaps the first draft left for the builder: a preview environment that cannot share production's database (Workers Builds branch previews share production bindings, so preview is a separate Worker), named Wrangler values, when migrations run, which values are build variables versus runtime variables versus secrets, a local development loop, the image and social card pipelines, security headers, one canonical address, and the content admin's publish model. Each is now written into `index.md`.

## References

**Project sources**:
- `docs/scope/scope.md` (feature 1 intent, the Journey build approach, the Alpha workflow, launch target)
- Your existing projects in `~/Downloads/Projects`, nearly all Next.js, TypeScript, and Tailwind
- Your premium app UI standard (theme switcher, motion, loading states, themed dialogs)
- Cross check of the first draft by Fable, 2026-11-16 (gaps and soundness findings, applied on your instruction)

**Practices & standards**:
- Monolith first, one deployable unit
- Static generation for content that changes on edit, not on request
- Boring technology for a solo maintainer
- Secrets in environment config, never in a public repo
- Separate data per environment
- WCAG 2.2 AA

**Links** (web verified during this design session):
- Next.js 16.2 release notes: https://nextjs.org/blog/next-16-2
- Cloudflare: Next.js on Workers with OpenNext: https://developers.cloudflare.com/workers/framework-guides/web-apps/opennext/
- Cloudflare Turnstile plans: https://developers.cloudflare.com/turnstile/plans/
- Cloudflare Email Service limits: https://developers.cloudflare.com/email-service/platform/limits/index.md
- Cloudflare Email Service send bindings: https://developers.cloudflare.com/email-service/configuration/send-bindings/index.md
- Cloudflare Email Service pricing: https://developers.cloudflare.com/email-service/platform/pricing/index.md
- Umami pricing: https://umami.is/pricing
- Sentry pricing: https://sentry.io/pricing/
- Vercel Hobby plan: https://vercel.com/docs/plans/hobby

**Installed agent skills consulted**: `nextjs-on-cloudflare` and `cloudflare-email-service` (`cloudflare/skills`).
