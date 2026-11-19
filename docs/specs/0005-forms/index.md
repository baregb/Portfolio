# 0005. Contact and request details forms

**Date**: 2026-11-19
**Status**: In Progress

## Summary

Visitors can send you a message from `/contact`, or ask for the private details of an on request project from `/request/<project>`. Both forms post to the one API Worker, which checks the request is genuine (same site, a passed Turnstile check, an empty trap field, under the rate limit), saves it to the D1 database, and emails you. The visitor sees a confirmation on screen as soon as the message is saved. If the email to you fails, a scheduled job retries it every 15 minutes, and the same job deletes messages older than 12 months.

## Requirements

**User stories**:
- As a recruiter or hiring manager, I want to send you a message about a role without leaving the site, so I can reach you in one step.
- As a possible client, I want to tell you about a project and know it arrived, so I don't wonder whether to send it again.
- As a reviewer reading an on request case study, I want to ask for the private details and say why, so you can decide what to share.
- As the site owner, I want every genuine message in my inbox, nothing lost when email has a bad moment, and no pile of old personal data.

**Acceptance criteria**:
- **AC-1 (contact form)**: `/contact` shows a form in its `data-form-slot="contact"` spot with, in order: Name (required), Email (required), Topic (a required native select: "A role", "A freelance project", "Something else", with no option chosen at first), Message (required), the Turnstile check, and a "Send message" primary button. Every field has a visible label; required fields say so to screen readers.
- **AC-2 (request form)**: `/request/<slug>` shows a form in its `data-form-slot="request"` spot with Name (required), Email (required), Reason (required, labelled "Why do you want the details?" with the hint "For example the role you are hiring for, or what you want to check."), the Turnstile check, and a "Request details" primary button. The project comes from the page; the visitor never picks it.
- **AC-3 (client validation)**: Submitting with a field empty or out of bounds stops before any network request and shows the error under that field (`aria-invalid`, `aria-describedby`), then moves focus to the first invalid field. Bounds: name 1 to 100 characters; email a valid address up to 254 characters; neither may contain control characters (including line breaks), which also keeps them safe in email headers; message 10 to 4000 characters; reason 10 to 1000 characters; topic one of the three values. Values are trimmed first.
- **AC-4 (success)**: A valid submission runs the Turnstile check at that moment (so the token is always fresh, never expired by a long message), then shows the button pending (spinner, `aria-busy`, further clicks ignored), and on success the form is replaced by a confirmation panel: an icon, the heading "Message sent" (contact) or "Request sent" (request), and the line "Thanks, <name>. I will reply to <email>." Focus moves to the heading, and a polite live region announces it.
- **AC-5 (server checks, in order)**: `POST /api/contact` and `POST /api/request` each check, in this order, before writing anything or sending email: the required bindings are present (AC-12); the `Origin` header is one of `ALLOWED_ORIGINS` (else 403 `bad_origin`); the rate limit of 5 requests per 60 seconds per visitor IP and route (else 429 `rate_limited`); the content type starts with `application/json` (else 415 `unsupported_media_type`) and the body is at most 16 KB, counted as it streams (else 413 `payload_too_large`); the body parses as JSON (else 422 `invalid_input`); the honeypot field `website` on the raw parsed object is empty (if filled, answer 201 `{ ok: true }` exactly like a real success, store nothing, send nothing, log `honeypot`); the input matches the shared schema (else 422 `invalid_input`); a request names a real on request project (else 422 `unknown_project`); Turnstile Siteverify passes, with a 5 second timeout, and its hostname matches the `Origin` hostname except when the secret is a Turnstile test secret (else 403 `turnstile_failed`; a timeout, network error, or non 200 answer gives 503 `unavailable` and logs `turnstile_unreachable`). Every error is JSON `{ error: "<code>" }` with that status and one structured log line (level, message, path, method), never echoing input, secrets, or internals.
- **AC-6 (save, then notify)**: A submission that passes every check is inserted into `submission` and answered 201 `{ ok: true }`. The notification email is then sent after the response (`waitUntil`) to `NOTIFY_TO` from `NOTIFY_FROM`, with Reply-To set to the visitor's email, and that send is attempt 1: every try (this one and each retry) runs one UPDATE that adds 1 to `notify_attempts` and, on success, sets `notified_at`. If `EMAIL`, `NOTIFY_TO`, `NOTIFY_FROM`, or `SITE_URL` is missing, the send step logs an error and leaves the row for the retry job; the visitor still gets 201. On the preview environment every subject starts with `[preview] `. Contact subject: "Portfolio: <topic label> from <name>". Request subject: "Portfolio: details request for <project title> from <name>". The plain text body lists every field, the project title and its case study address for a request, the submission time in UTC, and the submission id.
- **AC-7 (retry)**: Every 15 minutes a scheduled run resends notifications for rows where `notified_at` is null, `notify_attempts` is under 8, and the row is at least 2 minutes old, oldest first and at most 20 rows per run, adding 1 to `notify_attempts` on each try. When a row reaches 3 attempts with `notified_at` still null, the Worker calls `Sentry.captureMessage("notify_failed", "error")` with only the submission id, which alerts you. Rows that used all 8 tries can be replayed with `wrangler d1 execute portfolio-prod --remote --command "UPDATE submission SET notify_attempts = 0 WHERE notified_at IS NULL"` (written into `verify.md`). A failed email never changes what the visitor saw.
- **AC-8 (retention)**: The same scheduled run deletes every row whose `created_at` is more than 365 days ago. Both cutoffs (365 days ago, 2 minutes ago) are computed in the Worker as ISO strings and bound as query parameters, never with SQLite's `datetime('now')`, whose format does not sort against ISO text. Both forms show the line "I keep messages for 12 months, then delete them. Your details are used only to reply." under the button.
- **AC-9 (idempotent)**: The browser sends a fresh `id` (a UUID) with each submission. Sending the same `id` again does not create a second row or a second email and still answers 201 `{ ok: true }`. A double click cannot send twice (pending state), and a Turnstile token works only once, so every retry carries a fresh token (tests of the same `id` twice use two tokens, which the always pass test secret allows).
- **AC-10 (failure states)**: Each failure keeps every typed value and shows an error inside the form, read out by an assertive live region, with the Turnstile check reset: 429 "Too many tries. Wait a minute, then send it again."; 403 `turnstile_failed` "Could not confirm you are human. Try the check again."; a network failure or timeout (15 seconds) "Could not send. Check your connection and try again."; any other status (422, 403 `bad_origin`, 413, 415, 503, any 5xx) "Something went wrong on my side. Try again, or reach me on LinkedIn." with the LinkedIn link from the profile. Forms always post to the relative path `/api/...`.
- **AC-11 (no JavaScript)**: With JavaScript off, the form is hidden (`noscript:hidden`) and a line in its place says "This form needs JavaScript. You can still reach me through the links above." Every other part of the page shows.
- **AC-12 (configuration)**: The production build fails, naming the variable, when `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is missing. Before accepting a submission the Worker checks `DB`, `RATE_LIMITER`, `TURNSTILE_SECRET_KEY`, and `ALLOWED_ORIGINS`; when one is missing it answers 503 `unavailable` and logs which one is missing (the response never says). The email settings (`EMAIL`, `NOTIFY_TO`, `NOTIFY_FROM`, `SITE_URL`) never block saving; they are checked in the send step (AC-6). Sentry is off when `SENTRY_DSN` is missing (local and CI).
- **AC-13 (quality bar)**: Both forms meet WCAG 2.2 AA (labels, visible focus, keyboard only use, errors tied to fields, 44px targets), have no sideways scroll at 390px in either theme, use only design system components and tokens, and keep spec 0004's rules (one `h1`, no green block on contact or request pages). `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` pass, and the Worker has a Vitest suite for every AC above that calls the Hono app and the `scheduled` handler directly on Vitest 5 (like the existing Worker tests), with a real local D1 from the `miniflare` package that has the Drizzle migrations applied, fakes for `env.EMAIL` and `env.RATE_LIMITER`, a stubbed `fetch` for Siteverify, and a fixed clock. (Changed 2026-11-19 at your call: `@cloudflare/vitest-pool-workers` 0.23 supports only Vitest 4.) Form checks against the real Worker run under `pnpm serve` (port 8787); `pnpm dev` has no API.

## Decision

**Chosen option**: Option 1: both forms post to the existing Hono Worker, which stores each submission in D1 through Drizzle, notifies you through the Cloudflare email binding after responding, and runs one scheduled job for retries and retention.

This is the pipeline spec 0001 chose. This spec adds the fields, the checks and their order, the failure handling, and the retry and retention job.

**Implementation skills**: `hono` (`honojs/skills`, `.agents/skills/hono/`) · `turnstile-spin` (`cloudflare/skills`, `.agents/skills/turnstile-spin/`) · `cloudflare-email-service` (`cloudflare/skills`, `.agents/skills/cloudflare-email-service/`) · `wrangler` (`cloudflare/skills`, `.agents/skills/wrangler/`) · `workers-best-practices` (`cloudflare/skills`, `.agents/skills/workers-best-practices/`) · `workers-development` (`cloudflare/skills`, `.agents/skills/workers-development/`) · `sentry-instrument` (`getsentry/sentry-for-ai`, `.agents/skills/sentry-instrument/`) · `vitest` (`antfu/skills`, `.agents/skills/vitest/`) · `zod` (`.claude/skills/zod/`)

## Rationale

The full reasoning, with the options weighed, is in [rationale.md](rationale.md).

## Feature design

**Data model sketch** (one table, the one spec 0001 planned, plus `topic` and `notify_attempts`):

| Column | Type | Rules |
|---|---|---|
| `id` | text, primary key | a UUID made in the browser; the idempotency key (AC-9) |
| `kind` | text, required | `contact` or `request` |
| `name` | text, required | 1 to 100 characters, trimmed |
| `email` | text, required | valid, up to 254 characters, trimmed, stored as typed |
| `topic` | text, nullable | `role`, `project`, or `other`; required when `kind` is `contact`, null otherwise |
| `message` | text, required | the contact message (10 to 4000) or the request reason (10 to 1000) |
| `project_slug` | text, nullable | required when `kind` is `request`, null otherwise |
| `created_at` | text, required | ISO 8601 UTC, set by the Worker |
| `notified_at` | text, nullable | ISO 8601 UTC, set when the email succeeds |
| `notify_attempts` | integer, required | default 0; counts failed and successful tries |

Indexes: `created_at` (retention), and `notified_at` with `created_at` (the retry query). No IP addresses or user agents are stored. No relations: a request stores the slug, and the title is looked up when the email is built.

**State transitions**: a submission is `saved` (`notified_at` null) → `notified` (`notified_at` set), or stays `saved` after 8 attempts (given up, already alerted at attempt 3) → deleted after 365 days whatever its state.

**API surface**:

| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/api/contact` | POST | `id`: uuid (req), `name`, `email`, `topic`: `role` \| `project` \| `other`, `message` (req), `website`: string (honeypot, must be empty), `turnstileToken` (req) | 201 `{ ok: true }` | public, checked per AC-5 | 403 `bad_origin`, 413, 415, 422 `invalid_input`, 429 `rate_limited`, 403 `turnstile_failed`, 503 `unavailable` |
| `/api/request` | POST | `id`, `projectSlug` (req), `name`, `email`, `reason` (req), `website`, `turnstileToken` | 201 `{ ok: true }` | public, checked per AC-5 | as above, plus 422 `unknown_project` |
| scheduled (cron `*/15 * * * *`) | n/a | none | resends and deletes rows | Cloudflare only | logs only |

**Value sourcing**:

| Action | Value produced or displayed | Source |
|---|---|---|
| Request form | the project slug sent | the page's route param (`/request/<slug>`), passed into the form as a prop |
| Request email | project title and case study address | `.generated/request-projects.json` (slug → title and path), written by `pnpm content` from the read layer's on request projects and imported by the Worker; the address is `SITE_URL` + path |
| Request check | whether the slug is real | the same generated file (AC-5 `unknown_project`) |
| Contact email subject | topic label | a fixed map in the shared form module: `role` "A role", `project` "A freelance project", `other` "Something else" |
| Both | `id` | `crypto.randomUUID()` in the browser, made once per form fill and kept across retries of the same fill |
| Both | `created_at`, `notified_at` | the Worker's clock, `new Date().toISOString()` |
| Rate limit | visitor key | `CF-Connecting-IP` header plus the route path |
| Turnstile check | secret, visitor IP, expected hostname | `TURNSTILE_SECRET_KEY`; `CF-Connecting-IP`; the hostname of the request's `Origin` |
| Email | to, from | `NOTIFY_TO` (the address the binding is locked to, spec 0001); `NOTIFY_FROM` (an address on your domain) |
| Confirmation panel | name and email | the values the visitor submitted, held in the form's state |
| Failure line | LinkedIn address | `profile.links` (kind `linkedin`), passed into the form as a prop; left out of the line when there is none |
| Privacy line | "12 months" | fixed copy that matches the 365 day retention constant (one shared constant feeds both) |
| Turnstile widget | site key | `NEXT_PUBLIC_TURNSTILE_SITE_KEY` at build |

**Key invariants**:
- Nothing is written to D1 and no email is sent until every AC-5 check passes.
- `topic` is set exactly when `kind` is `contact`; `project_slug` is set exactly when `kind` is `request` (checked by the schema and by a D1 `CHECK` constraint).
- One `id`, at most one row and at most one email (`INSERT ... ON CONFLICT DO NOTHING`; the email step only runs when the insert added the row).
- The browser and the Worker use the same schema (`features/forms/schema.ts`, pure zod, no browser or Worker imports), so the bounds never drift.
- No row lives past 365 days plus one cron interval.

**Security model**:
- Both endpoints are public and anonymous; there is no read endpoint. Only you see submissions, through your inbox, or through D1 in the Cloudflare dashboard or Wrangler.
- Layered defence (spec 0001): Origin allow list, rate limit, honeypot, Turnstile, body size cap. Turnstile runs in managed mode with `appearance: "interaction-only"`, so most visitors never see a challenge.
- Personal data (name, email, message) is stored in D1 for 12 months at most, never logged, never sent anywhere but your inbox. Logs carry only the path, method, error code, and submission id.
- Email can only reach `NOTIFY_TO` (the binding is locked to it), so the Worker cannot be used to email anyone else.

**Configuration required**:
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`: build variable for the widget. Use Turnstile's always pass test key (`1x00000000000000000000AA`) in `.env.local` and CI.
- `TURNSTILE_SECRET_KEY`: Worker secret per environment. Use the test secret (`1x0000000000000000000000000000000AA`) in `.dev.vars`.
- `ALLOWED_ORIGINS`: Worker variable, a comma list. Production: your apex domain. Preview: the exact `https://portfolio-preview.<subdomain>.workers.dev` origin, with `preview_urls: false` so version links (which have another origin) are not used. Local: `http://localhost:8787`.
- `SITE_URL`: Worker variable for the case study address in request emails.
- `NOTIFY_TO`: from spec 0001; it fills the binding's `destination_address` at build, and is also a Worker secret per environment (and in `.dev.vars`) so the send step can read it as the `to` address. The two must match.
- `NOTIFY_FROM`: Worker variable, a sender on your domain, for example `Portfolio <notify@yourdomain>`.
- `SENTRY_DSN`: Worker secret from spec 0001; this feature is the first to wire Sentry in.
- Bindings in `wrangler.jsonc` (both environments): `DB` (D1, `migrations_dir: "drizzle/migrations"`), `EMAIL` (send email, locked to `NOTIFY_TO`), `RATE_LIMITER` (a `ratelimits` entry with `namespace_id` "1001" in production and "1002" in preview, `simple: { limit: 5, period: 60 }`), and `triggers.crons: ["*/15 * * * *"]` declared in both. Bindings and `vars` do not inherit into `env.preview`, so each is repeated there.

**Critical test scenarios**:
- Happy path: a valid contact post saves one row, answers 201, sends one email with the right subject and Reply-To, and sets `notified_at`; verifies **AC-5**, **AC-6**.
- Order of checks: a bad Origin with a bad token never reaches Turnstile or D1; a filled honeypot answers 201 and writes nothing; verifies **AC-5**.
- Unknown project: a request for a public or made up slug answers 422 `unknown_project`; verifies **AC-5**.
- Same id twice: one row, one email, two 201s; verifies **AC-9**.
- Email down: the post still answers 201; the scheduled run retries, logs an error on the third failure, and stops after 8; verifies **AC-6**, **AC-7**.
- Retention: a row 366 days old is deleted, one 364 days old stays; verifies **AC-8**.
- Missing binding: answers 503 `unavailable`, and the log names the binding; verifies **AC-12**.
- Browser: empty submit shows field errors and sends nothing; a 429 keeps the typed text and shows the wait message; verifies **AC-3**, **AC-10**.

## Build details (settled by the cross check)

- **Worker export**: `export default Sentry.withSentry((env) => ({ dsn: env.SENTRY_DSN, sendDefaultPii: false }), { fetch: app.fetch, scheduled })`, so one default export carries both handlers.
- **Rate limit key**: `${ip ?? "unknown"}:${path}`, where `ip` is `CF-Connecting-IP` (missing in tests and some local runs). Leave `remoteip` out of Siteverify when there is no IP. The binding is approximate and counted per Cloudflare location, so tests assert it only under Miniflare.
- **Insert**: Drizzle `onConflictDoNothing().returning()`; an empty result means "already saved", so the send step is skipped. Accepted gap: a send that succeeds followed by a failed UPDATE sends one duplicate email on the next cron run.
- **Email API**: use the Email Service `env.EMAIL.send({ to, from, replyTo, subject, text })` if the binding offers it on your account (check with the `cloudflare-email-service` skill at build time), otherwise `EmailMessage` from `cloudflare:email` with hand built MIME (Message-ID, Date, Reply-To), where `to` must equal `destination_address`.
- **Turnstile widget**: explicit render with `execution: "execute"` and `appearance: "interaction-only"`; call `turnstile.execute()` after client validation passes; reset after every failure. Its `theme` is `light` or `dark` read from the `<html>` class, re-rendered when the site theme changes (not `auto`, which follows the OS, not the site toggle).
- **Deploys and local**: run `wrangler d1 migrations apply DB --remote` (with `--env preview` for preview) before each `wrangler deploy` in the deploy scripts, and `--local` before `pnpm serve`. The build step that fills `destination_address` from `NOTIFY_TO` (spec 0001) joins the build plan.
- **Privacy check**: with Workers observability on at full sampling, confirm in the dashboard which request fields Workers Logs and traces keep (the client IP may appear there); Sentry runs with `sendDefaultPii: false`. Adjust the privacy line if anything else is kept.

## Build plan

Ordered by the Journey approach: finish the contact path end to end first, then the request path on the same pipeline, then the background job.

1. Shared form module `features/forms/`: the zod schemas for both forms, the topic labels, the retention constant, and pure helpers; Vitest for every bound. Satisfies **AC-3**, **AC-8**.
2. Data layer: add `drizzle-orm` and `drizzle-kit`, the `submission` schema with its checks and indexes, the first migration in `drizzle/migrations/`, the `DB` binding for both environments (with a local D1 for `wrangler dev`), migrations before every deploy and `pnpm serve`, and a Miniflare D1 test helper that applies the migrations. Satisfies **AC-6**, **AC-9**, **AC-13**.
3. Worker pipeline as composable middleware in `worker/`: binding and secret checks, Origin, body size and JSON, rate limit, schema, honeypot, Turnstile Siteverify; one JSON error helper and one structured logger. Wire `withSentry` with the export shape above, the rate limiter config, and the `destination_address` build step. Satisfies **AC-5**, **AC-12**.
4. `POST /api/contact`: insert with `ON CONFLICT DO NOTHING`, respond 201, then send the email through `EMAIL` in `waitUntil` and set `notified_at`. Satisfies **AC-6**, **AC-9**.
5. `ContactForm` client component in the contact page's slot: fields, Turnstile widget (explicit render, reset on failure), validation, pending, confirmation panel, failure messages, privacy line, no JavaScript line. Build fails without the site key. Satisfies **AC-1**, **AC-3**, **AC-4**, **AC-10**, **AC-11**, **AC-12**, **AC-13**.
6. Vitest suite for the contact path in the Worker runtime (Origin, rate limit, honeypot, Turnstile mocked, idempotency, email failure). Satisfies **AC-5**, **AC-6**, **AC-9**, **AC-13**.
7. Request path: `pnpm content` writes `.generated/request-projects.json`; `POST /api/request` reuses the pipeline and adds the project check and request email; `RequestForm` in the request page's slot; tests. Satisfies **AC-2**, **AC-5**, **AC-6**.
8. Scheduled handler: the retry pass and the retention pass, the cron trigger in both environments, and tests with a fixed clock. Satisfies **AC-7**, **AC-8**.
9. Close out: `/styleguide` gains the form states (idle, errors, pending, success, failure); `docs/design.md` notes the form pattern; a `verify.md` for this spec; a full lint, typecheck, test, and build run. Satisfies **AC-13**.

## Consequences

**Positive**:
- No message is lost to a bad email moment: D1 is the buffer and the cron job is the safety net.
- One pipeline serves both forms, and the AI chat later reuses the same checks.
- Bots meet four separate checks before anything is stored.

**Negative / tradeoffs**:
- Email cannot send until your domain is bought and onboarded for Email Sending. Until then messages save and wait in D1, and the retry job gives up after 8 tries (about 2 hours), so check D1 or push the domain setup before launch.
- A visitor gets no email copy of what they sent (the free plan only emails verified addresses, spec 0001).
- The forms need JavaScript (Turnstile does too). Without it, visitors use the profile links instead.
- The required reason on request pages adds a little friction for the recruiters you want, by your choice.

**Neutral**:
- The first Drizzle migration and the first D1 and email bindings land here, so `wrangler.jsonc` and the deploy commands grow (spec 0001 already lists them).
- The Worker now imports one generated file, so `pnpm content` must run before Worker typecheck and deploy (it already runs first in every script).

## Follow-up

- [ ] Before the build can send real email: buy the domain, onboard it for Email Sending, verify your inbox, and set `NOTIFY_TO` and `NOTIFY_FROM` (spec 0001 follow ups).
- [ ] Create the `portfolio-prod` and `portfolio-preview` D1 databases and put their ids in `wrangler.jsonc`.
- [ ] Create the Turnstile widget (hostnames: apex and the preview `workers.dev` address) and set its keys.
- [ ] Create the Sentry project and set `SENTRY_DSN` for both environments.
- [ ] After launch, look at the Sentry alert from the third failed attempt once on purpose (send with a wrong `NOTIFY_FROM` on preview) so you know what it looks like.
