import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Miniflare } from "miniflare";
import type { RequestProjectMap } from "../../features/forms/request-projects";

// Spec 0005, AC-13: a real local D1 (Miniflare's SQLite) with the Drizzle
// migrations applied, plus fakes for the bindings and Siteverify. Test only.

const MIGRATIONS = join(import.meta.dirname, "../../drizzle/migrations");

export const TEST_SECRET = "1x0000000000000000000000000000000AA";
export const ORIGIN = "https://example.test";
export const NOW = new Date("2026-11-19T12:00:00.000Z");
export const PROJECTS: RequestProjectMap = {
  "membership-charity": {
    title: "Membership charity data migration",
    path: "/work/membership-charity",
  },
  "private-card": { title: "Private card", path: "/work#project-private-card" },
};

export const createTestDb = async () => {
  const mf = new Miniflare({
    modules: true,
    script: "export default { fetch() { return new Response('') } }",
    d1Databases: { DB: "forms-test" },
  });
  const db = (await mf.getD1Database("DB")) as unknown as D1Database;
  const files = readdirSync(MIGRATIONS)
    .filter((file) => file.endsWith(".sql"))
    .sort();
  for (const file of files) {
    const statements = readFileSync(join(MIGRATIONS, file), "utf8")
      .split("--> statement-breakpoint")
      .map((statement) => statement.trim())
      .filter((statement) => statement !== "");
    for (const statement of statements) await db.prepare(statement).run();
  }
  return {
    db,
    reset: () => db.prepare("DELETE FROM submission").run(),
    dispose: () => mf.dispose(),
  };
};

export type SentEmail = {
  readonly from: string;
  readonly to: string;
  readonly replyTo?: string;
  readonly subject: string;
  readonly text?: string;
};

export const createFakeEmail = () => {
  const sent: SentEmail[] = [];
  const state = { fail: false };
  const binding = {
    send: async (message: SentEmail) => {
      if (state.fail) throw new Error("email service down");
      sent.push(message);
      return { messageId: `m-${sent.length}` };
    },
  } as unknown as SendEmail;
  return { binding, sent, state };
};

export const createFakeRateLimiter = () => {
  const keys: string[] = [];
  const state = { allow: true };
  const binding = {
    limit: async ({ key }: { key: string }) => {
      keys.push(key);
      return { success: state.allow };
    },
  } as unknown as RateLimit;
  return { binding, keys, state };
};

/** Siteverify stub: `success` and `hostname` to answer with, or a thrown error. */
export const createSiteverify = () => {
  const calls: FormData[] = [];
  const state: { success: boolean; hostname: string; error: boolean; status: number } = {
    success: true,
    hostname: "example.com",
    error: false,
    status: 200,
  };
  const fetcher = (async (_url: string | URL | Request, init?: RequestInit) => {
    calls.push(init?.body as FormData);
    if (state.error) throw new Error("network down");
    return new Response(JSON.stringify({ success: state.success, hostname: state.hostname }), {
      status: state.status,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;
  return { fetcher, calls, state };
};

/** Collects `waitUntil` promises so a test can await the work after the response. */
export const createExecutionContext = () => {
  const pending: Promise<unknown>[] = [];
  const ctx = {
    waitUntil: (promise: Promise<unknown>) => {
      pending.push(promise);
    },
    passThroughOnException: () => {},
    props: {},
  } as unknown as ExecutionContext;
  return { ctx, settle: () => Promise.all(pending) };
};
