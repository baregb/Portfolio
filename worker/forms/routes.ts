import { drizzle } from "drizzle-orm/d1";
import { Hono, type Context } from "hono";
import { bodyLimit } from "hono/body-limit";
import { createMiddleware } from "hono/factory";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { RequestProjectMap } from "../../features/forms/request-projects";
import {
  contactPayload,
  isHoneypotFilled,
  MAX_BODY_BYTES,
  requestPayload,
} from "../../features/forms/schema";
import { submission, type Submission } from "../db/schema";
import { readEmailConfig, readIntakeConfig, type IntakeConfig } from "./config";
import { logEvent } from "./log";
import { attemptNotify } from "./notify";
import { verifyTurnstile } from "./turnstile";

// Spec 0005: `POST /api/contact` and `POST /api/request`. Every check runs, in
// the order AC-5 sets, before anything is written or sent.

export type FormsDeps = {
  readonly projects: RequestProjectMap;
  /** Raises the Sentry alert for a row that keeps failing (AC-7). */
  readonly alert: (submissionId: string) => void;
  readonly now: () => Date;
  /** Siteverify's fetch; tests pass a stub. */
  readonly fetcher?: typeof fetch;
};

type FormsEnv = {
  Bindings: Env;
  Variables: { intake: IntakeConfig; body: unknown; origin: string };
};
type FormsContext = Context<FormsEnv>;

const where = (c: FormsContext) => ({ path: new URL(c.req.url).pathname, method: c.req.method });

/** A JSON error with one structured log line; never echoes input (AGENTS.md). */
const fail = (
  c: FormsContext,
  status: ContentfulStatusCode,
  code: string,
  extra: Readonly<Record<string, string | readonly string[]>> = {},
) => {
  logEvent(status >= 500 ? "error" : "warn", code, { ...where(c), status, ...extra });
  return c.json({ error: code }, status);
};

const normaliseOrigin = (origin: string) => origin.trim().replace(/\/+$/, "");

// 1. The bindings saving needs (AC-12).
const requireIntake = createMiddleware<FormsEnv>(async (c, next) => {
  const config = readIntakeConfig(c.env);
  if (!config.ok) return fail(c, 503, "unavailable", { missing: config.missing });
  c.set("intake", config.value);
  await next();
});

// 2. Same site only.
const requireOrigin = createMiddleware<FormsEnv>(async (c, next) => {
  const origin = c.req.header("Origin");
  if (!origin || !c.var.intake.allowedOrigins.includes(normaliseOrigin(origin))) {
    return fail(c, 403, "bad_origin");
  }
  c.set("origin", normaliseOrigin(origin));
  await next();
});

// 3. 5 per 60 seconds per visitor and route (spec 0001).
const rateLimit = createMiddleware<FormsEnv>(async (c, next) => {
  const ip = c.req.header("CF-Connecting-IP");
  const { success } = await c.var.intake.rateLimiter.limit({
    key: `${ip ?? "unknown"}:${where(c).path}`,
  });
  if (!success) return fail(c, 429, "rate_limited");
  await next();
});

// 4. JSON only, at most 16 KB counted as it streams.
const requireJson = createMiddleware<FormsEnv>(async (c, next) => {
  const type = c.req.header("Content-Type") ?? "";
  if (!type.toLowerCase().startsWith("application/json")) {
    return fail(c, 415, "unsupported_media_type");
  }
  await next();
});
const limitBody = bodyLimit({
  maxSize: MAX_BODY_BYTES,
  onError: (c) => {
    logEvent("warn", "payload_too_large", {
      path: new URL(c.req.url).pathname,
      method: c.req.method,
      status: 413,
    });
    return c.json({ error: "payload_too_large" }, 413);
  },
});

// 5. Parse, then 6. the honeypot on the raw object: a bot gets the same 201.
const parseBody = createMiddleware<FormsEnv>(async (c, next) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return fail(c, 422, "invalid_input");
  }
  if (isHoneypotFilled(body)) {
    logEvent("info", "honeypot", { ...where(c), status: 201 });
    return c.json({ ok: true }, 201);
  }
  c.set("body", body);
  await next();
});

const checks = [
  requireIntake,
  requireOrigin,
  rateLimit,
  requireJson,
  limitBody,
  parseBody,
] as const;

/** 9. Turnstile, then save, answer 201, and notify after responding. */
const verifyAndSave = async (
  c: FormsContext,
  deps: FormsDeps,
  token: string,
  values: Omit<Submission, "createdAt" | "notifiedAt" | "notifyAttempts">,
) => {
  const { intake, origin } = c.var;
  const turnstile = await verifyTurnstile({
    secret: intake.turnstileSecret,
    token,
    ip: c.req.header("CF-Connecting-IP"),
    expectedHostname: new URL(origin).hostname,
    fetcher: deps.fetcher,
  });
  if (!turnstile.ok) {
    return turnstile.reason === "failed"
      ? fail(c, 403, "turnstile_failed")
      : fail(c, 503, "unavailable", { cause: "turnstile_unreachable" });
  }

  const row: Submission = {
    ...values,
    createdAt: deps.now().toISOString(),
    notifiedAt: null,
    notifyAttempts: 0,
  };
  const inserted = await drizzle(intake.db)
    .insert(submission)
    .values(row)
    .onConflictDoNothing()
    .returning({ id: submission.id });
  const isNew = inserted.length > 0;
  logEvent("info", isNew ? "submission_saved" : "submission_repeat", {
    ...where(c),
    status: 201,
    id: row.id,
    kind: row.kind,
  });

  if (isNew) {
    const email = readEmailConfig(c.env);
    if (!email.ok) {
      logEvent("error", "notify_unconfigured", { ...where(c), id: row.id, missing: email.missing });
    } else {
      c.executionCtx.waitUntil(
        attemptNotify({
          db: intake.db,
          config: email.value,
          row,
          projects: deps.projects,
          now: deps.now(),
          alert: deps.alert,
        }).then((outcome) => {
          if (outcome === "failed") logEvent("error", "notify_failed", { ...where(c), id: row.id });
        }),
      );
    }
  }
  return c.json({ ok: true }, 201);
};

export const createFormsRoutes = (deps: FormsDeps) => {
  const routes = new Hono<FormsEnv>();

  routes.post("/api/contact", ...checks, async (c) => {
    const parsed = contactPayload.safeParse(c.var.body);
    if (!parsed.success) return fail(c, 422, "invalid_input");
    const { id, name, email, topic, message, turnstileToken } = parsed.data;
    return verifyAndSave(c, deps, turnstileToken, {
      id,
      kind: "contact",
      name,
      email,
      topic,
      message,
      projectSlug: null,
    });
  });

  routes.post("/api/request", ...checks, async (c) => {
    const parsed = requestPayload.safeParse(c.var.body);
    if (!parsed.success) return fail(c, 422, "invalid_input");
    const { id, name, email, reason, projectSlug, turnstileToken } = parsed.data;
    if (!Object.hasOwn(deps.projects, projectSlug)) return fail(c, 422, "unknown_project");
    return verifyAndSave(c, deps, turnstileToken, {
      id,
      kind: "request",
      name,
      email,
      topic: null,
      message: reason,
      projectSlug,
    });
  });

  return routes;
};
