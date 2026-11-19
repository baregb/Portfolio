import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { runScheduled } from "./scheduled";
import { createFakeEmail, createTestDb, NOW, PROJECTS } from "./test-harness";

// Spec 0005, AC-7 and AC-8: the retry and retention passes with a fixed clock.

let testDb: Awaited<ReturnType<typeof createTestDb>>;
beforeAll(async () => {
  testDb = await createTestDb();
});
afterAll(() => testDb.dispose());

const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;
const ago = (ms: number) => new Date(NOW.getTime() - ms).toISOString();

let counter = 0;
const insert = async ({
  createdAt,
  notifiedAt = null,
  attempts = 0,
}: {
  createdAt: string;
  notifiedAt?: string | null;
  attempts?: number;
}) => {
  counter += 1;
  const id = `00000000-0000-4000-8000-${String(counter).padStart(12, "0")}`;
  await testDb.db
    .prepare(
      `INSERT INTO submission (id, kind, name, email, topic, message, project_slug, created_at, notified_at, notify_attempts)
       VALUES (?, 'contact', 'Ada', 'ada@example.com', 'role', 'A message long enough.', NULL, ?, ?, ?)`,
    )
    .bind(id, createdAt, notifiedAt, attempts)
    .run();
  return id;
};
const row = async (id: string) =>
  (await testDb.db.prepare("SELECT * FROM submission WHERE id = ?").bind(id).first()) as Record<
    string,
    unknown
  > | null;

const setup = (envOverrides: Partial<Record<keyof Env, unknown>> = {}) => {
  const email = createFakeEmail();
  const alert = vi.fn();
  const env = {
    ENVIRONMENT: "production",
    DB: testDb.db,
    EMAIL: email.binding,
    NOTIFY_TO: "me@example.test",
    NOTIFY_FROM: "Portfolio <notify@example.test>",
    SITE_URL: "https://example.test",
    ...envOverrides,
  } as unknown as Env;
  const run = () => runScheduled({ env, now: NOW, projects: PROJECTS, alert });
  return { run, email, alert };
};

beforeEach(async () => {
  await testDb.reset();
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("retry pass (AC-7)", () => {
  it("resends unsent rows at least 2 minutes old and marks them notified", async () => {
    const { run, email } = setup();
    const old = await insert({ createdAt: ago(5 * MINUTE), attempts: 1 });
    const fresh = await insert({ createdAt: ago(30 * 1000) });
    const done = await insert({
      createdAt: ago(10 * MINUTE),
      notifiedAt: ago(9 * MINUTE),
      attempts: 1,
    });

    const result = await run();

    expect(result).toMatchObject({ retried: 1, sent: 1 });
    expect(email.sent).toHaveLength(1);
    expect(await row(old)).toMatchObject({ notified_at: NOW.toISOString(), notify_attempts: 2 });
    expect(await row(fresh)).toMatchObject({ notified_at: null, notify_attempts: 0 });
    expect(await row(done)).toMatchObject({ notify_attempts: 1 });
  });

  it("alerts once, when a row reaches its third failed attempt", async () => {
    const { run, email, alert } = setup();
    email.state.fail = true;
    const id = await insert({ createdAt: ago(10 * MINUTE), attempts: 1 });

    await run();
    expect(await row(id)).toMatchObject({ notify_attempts: 2 });
    expect(alert).not.toHaveBeenCalled();

    await run();
    expect(await row(id)).toMatchObject({ notify_attempts: 3, notified_at: null });
    expect(alert).toHaveBeenCalledExactlyOnceWith(id);

    await run();
    expect(alert).toHaveBeenCalledTimes(1);
  });

  it("retries a row that is exactly 2 minutes old", async () => {
    const { run, email } = setup();
    const id = await insert({ createdAt: ago(2 * MINUTE), attempts: 1 });

    const result = await run();

    expect(result).toMatchObject({ retried: 1, sent: 1 });
    expect(email.sent).toHaveLength(1);
    expect(await row(id)).toMatchObject({ notified_at: NOW.toISOString(), notify_attempts: 2 });
  });

  it("gives up after 8 attempts", async () => {
    const { run, email } = setup();
    const id = await insert({ createdAt: ago(DAY), attempts: 8 });
    const result = await run();
    expect(result.retried).toBe(0);
    expect(email.sent).toHaveLength(0);
    expect(await row(id)).toMatchObject({ notify_attempts: 8 });
  });

  it("handles at most 20 rows per run, oldest first", async () => {
    const { run, email } = setup();
    const ids: string[] = [];
    for (let index = 0; index < 22; index += 1) {
      ids.push(await insert({ createdAt: ago((60 - index) * MINUTE) }));
    }
    const result = await run();
    expect(result.retried).toBe(20);
    expect(email.sent).toHaveLength(20);
    expect(await row(ids[0] ?? "")).toMatchObject({ notify_attempts: 1 });
    expect(await row(ids[21] ?? "")).toMatchObject({ notify_attempts: 0 });
  });

  it("skips the retry pass, but still cleans up, when email is not configured", async () => {
    const { run, email } = setup({ EMAIL: undefined });
    await insert({ createdAt: ago(10 * MINUTE) });
    const expired = await insert({ createdAt: ago(400 * DAY) });
    const result = await run();
    expect(result).toEqual({ retried: 0, sent: 0, deleted: 1 });
    expect(email.sent).toHaveLength(0);
    expect(await row(expired)).toBeNull();
  });
});

describe("retention pass (AC-8)", () => {
  it("deletes rows older than 365 days and keeps younger ones", async () => {
    const { run } = setup();
    const expired = await insert({
      createdAt: ago(366 * DAY),
      notifiedAt: ago(366 * DAY),
      attempts: 1,
    });
    const kept = await insert({
      createdAt: ago(364 * DAY),
      notifiedAt: ago(364 * DAY),
      attempts: 1,
    });
    const unsentExpired = await insert({ createdAt: ago(370 * DAY), attempts: 8 });

    const result = await run();

    expect(result.deleted).toBe(2);
    expect(await row(expired)).toBeNull();
    expect(await row(unsentExpired)).toBeNull();
    expect(await row(kept)).not.toBeNull();
  });

  it("keeps a row exactly 365 days old and deletes one a millisecond older", async () => {
    const { run } = setup();
    const edge = await insert({ createdAt: ago(365 * DAY), notifiedAt: ago(365 * DAY) });
    const past = await insert({ createdAt: ago(365 * DAY + 1), notifiedAt: ago(365 * DAY) });

    const result = await run();

    expect(result.deleted).toBe(1);
    expect(await row(edge)).not.toBeNull();
    expect(await row(past)).toBeNull();
  });

  it("deletes an unsent row past retention without emailing it first", async () => {
    const { run, email } = setup();
    const expired = await insert({ createdAt: ago(366 * DAY), attempts: 1 });

    const result = await run();

    expect(result).toEqual({ retried: 0, sent: 0, deleted: 1 });
    expect(email.sent).toHaveLength(0);
    expect(await row(expired)).toBeNull();
  });
});
