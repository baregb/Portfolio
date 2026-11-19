import { and, asc, isNull, lt, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import type { RequestProjectMap } from "../../features/forms/request-projects";
import {
  MAX_NOTIFY_ATTEMPTS,
  RETENTION_DAYS,
  RETRY_BATCH_SIZE,
  RETRY_MIN_AGE_MS,
} from "../../features/forms/schema";
import { submission } from "../db/schema";
import { readEmailConfig } from "./config";
import { logEvent } from "./log";
import { attemptNotify } from "./notify";

// Spec 0005, AC-7 and AC-8: every 15 minutes, delete rows past the retention
// period, then resend notifications that have not gone out. Cutoffs are ISO
// strings computed here and bound as parameters, never SQLite's datetime().

const DAY_MS = 24 * 60 * 60 * 1000;
const WHERE = { path: "scheduled", method: "CRON" } as const;

export type ScheduledResult = {
  readonly retried: number;
  readonly sent: number;
  readonly deleted: number;
};

export const runScheduled = async ({
  env,
  now,
  projects,
  alert,
}: {
  readonly env: Env;
  readonly now: Date;
  readonly projects: RequestProjectMap;
  readonly alert: (submissionId: string) => void;
}): Promise<ScheduledResult> => {
  if (!env.DB) {
    logEvent("error", "unavailable", { ...WHERE, missing: ["DB"] });
    return { retried: 0, sent: 0, deleted: 0 };
  }
  const db = drizzle(env.DB);

  // Retention pass first, so a row past its retention is deleted, never emailed.
  const retentionCutoff = new Date(now.getTime() - RETENTION_DAYS * DAY_MS).toISOString();
  const deleted = await db
    .delete(submission)
    .where(lt(submission.createdAt, retentionCutoff))
    .returning({ id: submission.id });

  // Retry pass: oldest first, at most one batch per run.
  let retried = 0;
  let sent = 0;
  const email = readEmailConfig(env);
  if (!email.ok) {
    logEvent("error", "notify_unconfigured", { ...WHERE, missing: email.missing });
  } else {
    const retryCutoff = new Date(now.getTime() - RETRY_MIN_AGE_MS).toISOString();
    const pending = await db
      .select()
      .from(submission)
      .where(
        and(
          isNull(submission.notifiedAt),
          lt(submission.notifyAttempts, MAX_NOTIFY_ATTEMPTS),
          lte(submission.createdAt, retryCutoff),
        ),
      )
      .orderBy(asc(submission.createdAt))
      .limit(RETRY_BATCH_SIZE);

    for (const row of pending) {
      const outcome = await attemptNotify({
        db: env.DB,
        config: email.value,
        row,
        projects,
        now,
        alert,
      });
      retried += 1;
      if (outcome === "sent") sent += 1;
    }
  }

  logEvent("info", "scheduled_run", { ...WHERE, retried, sent, deleted: deleted.length });
  return { retried, sent, deleted: deleted.length };
};
