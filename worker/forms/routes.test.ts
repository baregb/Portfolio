import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../index";
import {
  createExecutionContext,
  createFakeEmail,
  createFakeRateLimiter,
  createSiteverify,
  createTestDb,
  NOW,
  ORIGIN,
  PROJECTS,
  TEST_SECRET,
} from "./test-harness";

// Spec 0005: the form endpoints end to end against a real local D1.

let testDb: Awaited<ReturnType<typeof createTestDb>>;
beforeAll(async () => {
  testDb = await createTestDb();
});
afterAll(() => testDb.dispose());

const ID_A = "6f1c7d1e-2c1a-4b5e-9f3a-1d2c3b4a5e6f";
const ID_B = "7a2d8e2f-3d2b-4c6f-8a4b-2e3d4c5b6f70";

const contactBody = (overrides: Record<string, unknown> = {}) => ({
  id: ID_A,
  name: "Ada Lovelace",
  email: "ada@example.com",
  topic: "role",
  message: "Hello, I am hiring for a senior role.",
  website: "",
  turnstileToken: "token-1",
  ...overrides,
});
const requestBody = (overrides: Record<string, unknown> = {}) => ({
  id: ID_B,
  projectSlug: "membership-charity",
  name: "Grace Hopper",
  email: "grace@example.com",
  reason: "Hiring for a data migration role.",
  website: "",
  turnstileToken: "token-2",
  ...overrides,
});

const setup = (envOverrides: Partial<Record<keyof Env, unknown>> = {}) => {
  const email = createFakeEmail();
  const limiter = createFakeRateLimiter();
  const siteverify = createSiteverify();
  const alert = vi.fn();
  const app = createApp({ projects: PROJECTS, alert, now: () => NOW, fetcher: siteverify.fetcher });
  const env = {
    ENVIRONMENT: "production",
    DB: testDb.db,
    EMAIL: email.binding,
    RATE_LIMITER: limiter.binding,
    TURNSTILE_SECRET_KEY: TEST_SECRET,
    ALLOWED_ORIGINS: `${ORIGIN}, http://localhost:8787`,
    NOTIFY_TO: "me@example.test",
    NOTIFY_FROM: "Portfolio <notify@example.test>",
    SITE_URL: "https://example.test/",
    ...envOverrides,
  } as unknown as Env;

  const post = async (
    path: string,
    body: unknown,
    init: { origin?: string | null; type?: string; raw?: string; ip?: string | null } = {},
  ) => {
    const { ctx, settle } = createExecutionContext();
    const headers = new Headers({ "Content-Type": init.type ?? "application/json" });
    if (init.origin !== null) headers.set("Origin", init.origin ?? ORIGIN);
    if (init.ip !== null) headers.set("CF-Connecting-IP", init.ip ?? "203.0.113.7");
    const res = await app.request(
      path,
      { method: "POST", headers, body: init.raw ?? JSON.stringify(body) },
      env,
      ctx,
    );
    await settle();
    return res;
  };
  return { post, email, limiter, siteverify, alert, env };
};

const rows = async () =>
  (await testDb.db.prepare("SELECT * FROM submission ORDER BY created_at").all()).results as Record<
    string,
    unknown
  >[];

let logs: string[];
beforeEach(async () => {
  await testDb.reset();
  logs = [];
  for (const level of ["log", "warn", "error"] as const) {
    vi.spyOn(console, level).mockImplementation((line: unknown) => {
      logs.push(String(line));
    });
  }
});

describe("POST /api/contact, happy path (AC-5, AC-6)", () => {
  it("saves one row, answers 201, and emails once with the right subject and Reply-To", async () => {
    const { post, email } = setup();
    const res = await post("/api/contact", contactBody());

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ ok: true });
    const [row] = await rows();
    expect(row).toMatchObject({
      id: ID_A,
      kind: "contact",
      name: "Ada Lovelace",
      email: "ada@example.com",
      topic: "role",
      project_slug: null,
      created_at: NOW.toISOString(),
      notified_at: NOW.toISOString(),
      notify_attempts: 1,
    });
    expect(email.sent).toHaveLength(1);
    expect(email.sent[0]).toMatchObject({
      to: "me@example.test",
      from: "Portfolio <notify@example.test>",
      replyTo: "ada@example.com",
      subject: "Portfolio: A role from Ada Lovelace",
    });
    expect(email.sent[0]?.text).toContain(`Submission id: ${ID_A}`);
    expect(email.sent[0]?.text).toContain("Submitted: 2026-11-19T12:00:00.000Z (UTC)");
  });

  it("trims values before saving", async () => {
    const { post } = setup();
    await post("/api/contact", contactBody({ name: "  Ada  ", email: " ada@example.com " }));
    expect((await rows())[0]).toMatchObject({ name: "Ada", email: "ada@example.com" });
  });

  it("accepts a charset on the content type", async () => {
    const { post } = setup();
    const res = await post("/api/contact", contactBody(), {
      type: "application/json; charset=utf-8",
    });
    expect(res.status).toBe(201);
  });

  it("never logs personal data", async () => {
    const { post } = setup();
    await post("/api/contact", contactBody());
    const all = logs.join("\n");
    expect(all).not.toContain("ada@example.com");
    expect(all).not.toContain("Ada Lovelace");
    expect(all).toContain('"message":"submission_saved"');
  });
});

describe("check order (AC-5)", () => {
  it("rejects a foreign Origin before Turnstile or D1", async () => {
    const { post, siteverify, limiter } = setup();
    const res = await post("/api/contact", contactBody({ turnstileToken: "bad" }), {
      origin: "https://evil.example",
    });
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "bad_origin" });
    expect(siteverify.calls).toHaveLength(0);
    expect(limiter.keys).toHaveLength(0);
    expect(await rows()).toHaveLength(0);
  });

  it("rejects a missing Origin", async () => {
    const { post } = setup();
    expect((await post("/api/contact", contactBody(), { origin: null })).status).toBe(403);
  });

  it("rate limits per visitor and route, before reading the body", async () => {
    const { post, limiter } = setup();
    limiter.state.allow = false;
    const res = await post("/api/contact", null, { raw: "not json" });
    expect(res.status).toBe(429);
    expect(await res.json()).toEqual({ error: "rate_limited" });
    expect(limiter.keys).toEqual(["203.0.113.7:/api/contact"]);
  });

  it("keys the rate limit on unknown when there is no visitor IP", async () => {
    const { post, limiter, siteverify } = setup();
    await post("/api/contact", contactBody(), { ip: null });
    expect(limiter.keys).toEqual(["unknown:/api/contact"]);
    expect(siteverify.calls[0]?.has("remoteip")).toBe(false);
  });

  it("refuses a body that is not JSON by type (415) or by content (422)", async () => {
    const { post } = setup();
    expect((await post("/api/contact", contactBody(), { type: "text/plain" })).status).toBe(415);
    const bad = await post("/api/contact", null, { raw: "{not json" });
    expect(bad.status).toBe(422);
    expect(await bad.json()).toEqual({ error: "invalid_input" });
  });

  it("refuses a body over 16 KB", async () => {
    const { post } = setup();
    const res = await post("/api/contact", contactBody({ message: "x".repeat(17 * 1024) }));
    expect(res.status).toBe(413);
    expect(await res.json()).toEqual({ error: "payload_too_large" });
  });

  it("answers a filled honeypot exactly like a success, and stores and sends nothing", async () => {
    const { post, email, siteverify } = setup();
    const res = await post("/api/contact", { website: "https://spam.example", name: "" });
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ ok: true });
    expect(await rows()).toHaveLength(0);
    expect(email.sent).toHaveLength(0);
    expect(siteverify.calls).toHaveLength(0);
    expect(logs.join("\n")).toContain('"message":"honeypot"');
  });

  it("rejects invalid input before Turnstile", async () => {
    const { post, siteverify } = setup();
    const res = await post("/api/contact", contactBody({ email: "nope" }));
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ error: "invalid_input" });
    expect(siteverify.calls).toHaveLength(0);
  });

  it("refuses a failed Turnstile check", async () => {
    const { post, siteverify } = setup();
    siteverify.state.success = false;
    const res = await post("/api/contact", contactBody());
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "turnstile_failed" });
    expect(await rows()).toHaveLength(0);
  });

  it("answers 503 when Siteverify is unreachable or errors", async () => {
    const { post, siteverify } = setup();
    siteverify.state.error = true;
    const down = await post("/api/contact", contactBody());
    expect(down.status).toBe(503);
    expect(await down.json()).toEqual({ error: "unavailable" });
    siteverify.state.error = false;
    siteverify.state.status = 500;
    expect((await post("/api/contact", contactBody())).status).toBe(503);
    expect(logs.join("\n")).toContain("turnstile_unreachable");
  });

  it("checks the Turnstile hostname against the Origin with a real secret", async () => {
    const { post, siteverify } = setup({ TURNSTILE_SECRET_KEY: "0x4AAAAAAAreal" });
    siteverify.state.hostname = "other.example";
    expect((await post("/api/contact", contactBody())).status).toBe(403);
    siteverify.state.hostname = "example.test";
    expect((await post("/api/contact", contactBody())).status).toBe(201);
  });
});

describe("POST /api/request (AC-2, AC-5, AC-6)", () => {
  it("saves the request and names the project and its case study in the email", async () => {
    const { post, email } = setup();
    const res = await post("/api/request", requestBody());
    expect(res.status).toBe(201);
    expect((await rows())[0]).toMatchObject({
      kind: "request",
      topic: null,
      project_slug: "membership-charity",
      message: "Hiring for a data migration role.",
    });
    expect(email.sent[0]?.subject).toBe(
      "Portfolio: details request for Membership charity data migration from Grace Hopper",
    );
    expect(email.sent[0]?.text).toContain(
      "Case study: https://example.test/work/membership-charity",
    );
  });

  it("rejects a project that is not on request", async () => {
    const { post, siteverify } = setup();
    const res = await post("/api/request", requestBody({ projectSlug: "beccahs-kitchen" }));
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ error: "unknown_project" });
    expect(siteverify.calls).toHaveLength(0);
  });

  it("rejects a short reason", async () => {
    const { post } = setup();
    expect((await post("/api/request", requestBody({ reason: "because" }))).status).toBe(422);
  });
});

describe("idempotency (AC-9)", () => {
  it("one id gives one row and one email, and both posts answer 201", async () => {
    const { post, email } = setup();
    const first = await post("/api/contact", contactBody({ turnstileToken: "token-a" }));
    const second = await post("/api/contact", contactBody({ turnstileToken: "token-b" }));
    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(await rows()).toHaveLength(1);
    expect(email.sent).toHaveLength(1);
    expect(logs.join("\n")).toContain("submission_repeat");
  });
});

describe("email failures never change the visitor's answer (AC-6)", () => {
  it("still answers 201 and leaves the row for the retry job", async () => {
    const { post, email } = setup();
    email.state.fail = true;
    const res = await post("/api/contact", contactBody());
    expect(res.status).toBe(201);
    expect((await rows())[0]).toMatchObject({ notified_at: null, notify_attempts: 1 });
    expect(logs.join("\n")).toContain("notify_failed");
  });

  it("saves without email settings and logs which are missing", async () => {
    const { post } = setup({ EMAIL: undefined, NOTIFY_FROM: undefined });
    const res = await post("/api/contact", contactBody());
    expect(res.status).toBe(201);
    expect((await rows())[0]).toMatchObject({ notified_at: null, notify_attempts: 0 });
    const line = logs.find((entry) => entry.includes("notify_unconfigured")) ?? "";
    expect(line).toContain("EMAIL");
    expect(line).toContain("NOTIFY_FROM");
  });

  it("prefixes the subject on preview", async () => {
    const { post, email } = setup({ ENVIRONMENT: "preview" });
    await post("/api/contact", contactBody());
    expect(email.sent[0]?.subject).toBe("[preview] Portfolio: A role from Ada Lovelace");
  });
});

describe("missing bindings (AC-12)", () => {
  it.each(["DB", "RATE_LIMITER", "TURNSTILE_SECRET_KEY", "ALLOWED_ORIGINS"] as const)(
    "answers 503 without %s and names it only in the log",
    async (name) => {
      const { post } = setup({ [name]: undefined });
      const res = await post("/api/contact", contactBody());
      expect(res.status).toBe(503);
      const body = await res.json();
      expect(body).toEqual({ error: "unavailable" });
      expect(JSON.stringify(body)).not.toContain(name);
      expect(logs.find((line) => line.includes('"unavailable"'))).toContain(name);
    },
  );
});
