# 0005. Contact and request details forms: rationale

## Context

Two scope features need a way for visitors to reach you from the site: the contact form (#12) on `/contact`, and the request details form (#14) on every on request project's `/request/<slug>` page. Spec 0004 already left a marked spot on both pages (`data-form-slot`). The site is a static export, so nothing on the page can run server code. Only the one Hono Worker under `/api/*` can receive a submission (spec 0001).

These are the only places a stranger can write to the system, so they attract bots. A portfolio gets little real traffic, and one missed recruiter message costs more than any amount of spam annoyance. So what matters most is that a genuine message always reaches you, and that bots never get a free path to your inbox or the database.

The email side has a real constraint. Cloudflare's email binding can only send to an address you have verified, from a domain you have onboarded for Email Sending, and the domain is not bought yet. Visitors cannot get an email copy on the free plan (spec 0001). The forms also collect personal data (names, emails, free text), so how long it is kept is a choice that should be made deliberately.

Decided with you on 2026-11-19: the contact form asks for name, email, a topic (a role, a freelance project, something else), and a message; the request form asks for name, email, and a required reason; when the email to you fails, the visitor still sees success and a job retries every 15 minutes; submissions are deleted after 12 months.

## Options considered

### Option 1: Worker, D1, email binding, and a scheduled job (chosen)

Both forms post JSON to the Hono Worker. It runs the layered checks, saves the submission in D1, answers the visitor, sends the email after responding, and a cron run every 15 minutes retries unsent emails and deletes old rows.

**Pros**:
- Matches spec 0001 exactly; every binding is already planned and free.
- Nothing is lost when email fails, because the database is the buffer and the job is the safety net.
- One pipeline that the AI chat can reuse later.

**Cons**:
- The most code of the options: a schema, a migration, middleware, a scheduled handler, and their tests.
- Email waits on the domain setup.

### Option 2: Worker, email only, no database

The Worker checks the submission and sends the email inline, storing nothing.

**Pros**:
- The least code and no stored personal data at all.

**Cons**:
- A failed email loses the message for good, and you choose between telling the visitor "failed" (they may never retry) or "sent" (a lie).
- Until the domain exists, every message is lost.

### Option 3: A hosted form service

The forms post to a third party form backend that stores messages and emails you.

**Pros**:
- No Worker code; spam filtering and the dashboard come with it.

**Cons**:
- Visitor data lives with another company, outside the stack spec 0001 picked.
- The free tiers cap submissions and brand the emails; the content security policy has to allow another origin.
- No shared pipeline for the AI chat later.

## Rationale

Option 1 wins on the force that matters most: a genuine message must never quietly disappear. Saving first and notifying second, with a retry job, means an email outage (or the domain not being ready yet) delays your notification but loses nothing. It also lets the visitor see an honest "sent". Option 2 cannot offer that, and Option 3 moves personal data and spam policy outside the stack for little gain, since every Cloudflare piece is already chosen and free.

The order of the checks follows cost: the cheap local checks (Origin, size, rate limit, schema, honeypot) run before the one network call (Turnstile Siteverify), so bots are stopped without spending a call. A filled honeypot gets the same 201 as a real success, so a bot learns nothing. A browser made UUID as the primary key makes every retry safe (idempotency), which a double click or a flaky connection would otherwise turn into duplicate emails.

The request email has to name the project, but the Worker cannot read the content files. Rather than trust a title sent by the browser, `pnpm content` writes a small slug to title map that the Worker imports at build. That also lets the Worker reject made up or public slugs. The 12 month retention with a line on the form keeps personal data from piling up and tells visitors plainly what happens to it. Your inbox stays the long term record.
