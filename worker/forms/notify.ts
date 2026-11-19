import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { ALERT_AT_ATTEMPTS, TOPIC_LABELS } from "../../features/forms/schema";
import type { RequestProjectMap } from "../../features/forms/request-projects";
import { submission, type Submission } from "../db/schema";
import type { EmailConfig } from "./config";

// Spec 0005, AC-6 and AC-7: build the notification for a saved submission,
// send it, and record the attempt in one UPDATE.

export type BuiltEmail = { readonly subject: string; readonly text: string };

/** The subject and plain text body for one submission. Pure. */
export const buildEmail = (
  row: Submission,
  projects: RequestProjectMap,
  siteUrl: string,
  environment: string,
): BuiltEmail => {
  const prefix = environment === "preview" ? "[preview] " : "";
  const project = row.projectSlug ? projects[row.projectSlug] : undefined;
  const projectTitle = project?.title ?? row.projectSlug ?? "";

  const subject =
    row.kind === "contact"
      ? `${prefix}Portfolio: ${row.topic ? TOPIC_LABELS[row.topic] : "Message"} from ${row.name}`
      : `${prefix}Portfolio: details request for ${projectTitle} from ${row.name}`;

  const lines =
    row.kind === "contact"
      ? [
          `Name: ${row.name}`,
          `Email: ${row.email}`,
          `Topic: ${row.topic ? TOPIC_LABELS[row.topic] : ""}`,
          "",
          "Message:",
          row.message,
        ]
      : [
          `Name: ${row.name}`,
          `Email: ${row.email}`,
          `Project: ${projectTitle}`,
          `Case study: ${project ? `${siteUrl}${project.path}` : "(no longer listed)"}`,
          "",
          "Why they want the details:",
          row.message,
        ];

  const text = [
    ...lines,
    "",
    `Submitted: ${row.createdAt} (UTC)`,
    `Submission id: ${row.id}`,
    "",
    "Reply to this email to answer them directly.",
  ].join("\n");

  return { subject, text };
};

export type NotifyOutcome = "sent" | "failed";

/**
 * One notification attempt: send, then add 1 to `notify_attempts` and, on
 * success, set `notified_at`, in a single UPDATE. Calls `alert` when a row
 * reaches the alert threshold still unsent. Never throws.
 */
export const attemptNotify = async ({
  db,
  config,
  row,
  projects,
  now,
  alert,
}: {
  readonly db: D1Database;
  readonly config: EmailConfig;
  readonly row: Submission;
  readonly projects: RequestProjectMap;
  readonly now: Date;
  readonly alert: (submissionId: string) => void;
}): Promise<NotifyOutcome> => {
  const { subject, text } = buildEmail(row, projects, config.siteUrl, config.environment);

  let outcome: NotifyOutcome;
  try {
    await config.email.send({
      from: config.from,
      to: config.to,
      replyTo: row.email,
      subject,
      text,
    });
    outcome = "sent";
  } catch {
    outcome = "failed";
  }

  const updated = await drizzle(db)
    .update(submission)
    .set({
      notifyAttempts: sql`${submission.notifyAttempts} + 1`,
      ...(outcome === "sent" ? { notifiedAt: now.toISOString() } : {}),
    })
    .where(eq(submission.id, row.id))
    .returning({ notifyAttempts: submission.notifyAttempts });

  const attempts = updated[0]?.notifyAttempts ?? row.notifyAttempts + 1;
  if (outcome === "failed" && attempts === ALERT_AT_ATTEMPTS) alert(row.id);
  return outcome;
};
