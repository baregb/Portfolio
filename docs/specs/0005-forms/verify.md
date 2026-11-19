# Verify: contact and request details forms · spec 0005 · updated 2026-11-19
_Steps derived from spec 0005 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

Run against the real site plus Worker: `pnpm serve` (build, local D1 migrations, `wrangler dev` on http://localhost:8787), with `.env.local` and `.dev.vars` copied from their examples (Turnstile test keys). `pnpm dev` has no API. Simulated emails land in `.wrangler/tmp/email/`; read the local D1 with `npx wrangler d1 execute DB --local --command "select * from submission"`.

## UI / manual

### Contact form
- [ ] `/contact` shows "Send a message" with Name, Email, Topic ("Choose one" first, then A role, A freelance project, Something else), Message, and "Send message"; every label shows and required fields say "(required)" to screen readers → AC-1
- [ ] Press "Send message" empty → an error under each field, `aria-invalid` on each, focus on Name, and no request in the network panel → AC-3
- [ ] Fill a 9 character message, a name with a line break pasted in, or an email without a domain → the matching error, nothing sent → AC-3
- [ ] Fill it in and send → the button shows pending (`aria-busy`), then "Message sent" and "Thanks, <name>. I will reply to <email>." with focus on the heading → AC-4
- [ ] After that send, D1 has one `contact` row with `notify_attempts` 1 and `notified_at` set, and `.wrangler/tmp/email/` has an email with subject "Portfolio: <topic label> from <name>", Reply-To the visitor, and the submission time and id in the body → AC-6
- [ ] The line "I keep messages for 12 months, then delete them. Your details are used only to reply." sits under the button → AC-8

### Request form
- [ ] `/request/membership-charity-data-migration` shows "Request the details" with Name, Email, and "Why do you want the details?" with its hint, and "Request details" → AC-2
- [ ] Send it → "Request sent"; the email subject is "Portfolio: details request for Membership charity data migration from <name>" and the body has the case study address → AC-2, AC-6

### Failures (block or fake the request in dev tools)
- [ ] Network offline → "Could not send. Check your connection and try again." and every typed value stays → AC-10
- [ ] A 429 answer → "Too many tries. Wait a minute, then send it again." → AC-10
- [ ] A 403 `turnstile_failed` answer → "Could not confirm you are human. Try the check again." → AC-10
- [ ] A 503 or 422 answer → "Something went wrong on my side. Try again, or reach me on LinkedIn." with the profile's LinkedIn link → AC-10
- [ ] Retry after a failure → the request carries the same `id` and a new `turnstileToken` → AC-9, AC-4

### Quality bar
- [ ] At 390px in light and dark, no sideways scroll; the submit button is full width; Tab goes Name, Email, Topic, Message, Send message (the honeypot is skipped) with a visible focus ring → AC-13
- [ ] With JavaScript off, the form is hidden and "This form needs JavaScript. You can still reach me through the links above." shows → AC-11
- [ ] `/styleguide` shows the form with errors, failed, pending, and sent → AC-13

## Commands
- [ ] Send 6 posts to `/api/contact` within a minute from one IP (curl with `Origin: http://localhost:8787`) → the sixth answers 429 `{"error":"rate_limited"}` → AC-5
- [ ] `curl -X POST localhost:8787/api/contact -H 'Origin: https://evil.example' -H 'Content-Type: application/json' -d '{}'` → 403 `{"error":"bad_origin"}` → AC-5
- [ ] A post with `"website": "x"` → 201 `{"ok":true}` and no new row → AC-5
- [ ] `NEXT_PUBLIC_TURNSTILE_SITE_KEY= npx next build` → fails naming `NEXT_PUBLIC_TURNSTILE_SITE_KEY` → AC-12
- [ ] `NOTIFY_TO= node scripts/deploy-config.ts` → fails naming `NOTIFY_TO`; with an address it writes `wrangler.deploy.jsonc` (git ignored) → Configuration
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` → all pass; the Worker suites in `worker/forms/` run against a real local D1 → AC-13

## Value sourcing
- [ ] Request page → the form sends the page's slug; a request for a public slug answers 422 `unknown_project` → Value sourcing: project slug
- [ ] Change an on request project's title, run `pnpm content` → `.generated/request-projects.json` and the next request email show the new title → Value sourcing: request email
- [ ] `CONTENT_DRAFTS=true pnpm content` → the map also lists draft on request projects; without it, only published ones → Value sourcing: request check
- [ ] Each topic → its label in the subject → Value sourcing: topic label
- [ ] Two sends of one form fill (a failure, then a retry) → one row → Value sourcing: id
- [ ] Rows carry the Worker's ISO UTC time in `created_at` → Value sourcing: created_at
- [ ] Without `CF-Connecting-IP` the rate limit key is `unknown:<path>` (Worker test) → Value sourcing: rate limit key
- [ ] On preview, subjects start with `[preview] ` → Value sourcing: email

## Before launch (needs your accounts)
- [ ] With the domain, D1 ids, real Turnstile keys, `NOTIFY_TO`, `NOTIFY_FROM`, and `SENTRY_DSN` set, send one message on preview and confirm it reaches your inbox → AC-6
- [ ] Set a wrong `NOTIFY_FROM` on preview, send, and wait for three cron runs → a Sentry alert `notify_failed` with only the id → AC-7
- [ ] Replay rows that used all 8 tries: `npx wrangler d1 execute portfolio-prod --remote --command "UPDATE submission SET notify_attempts = 0 WHERE notified_at IS NULL"` → AC-7

## Acceptance-criteria coverage
- AC-1 contact form · AC-2 request form · AC-3 client validation · AC-4 success · AC-5 commands and Worker suite · AC-6 save then notify · AC-7 Worker suite and before launch · AC-8 privacy line and Worker suite · AC-9 retry · AC-10 failures · AC-11 no JavaScript · AC-12 build and Worker suite · AC-13 quality bar and commands
