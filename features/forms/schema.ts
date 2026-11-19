import { z } from "zod";

// The contact and request details forms (spec 0005). Pure and shared: the
// browser validates with these before sending, and the Worker validates the
// same way on arrival, so the bounds can never drift apart. No browser or
// Worker imports here, and relative imports only (the Worker has no `@/` alias).

export const TOPICS = ["role", "project", "other"] as const;
export type Topic = (typeof TOPICS)[number];

/** How each topic reads in the select and in the email subject (AC-1, AC-6). */
export const TOPIC_LABELS: Readonly<Record<Topic, string>> = {
  role: "A role",
  project: "A freelance project",
  other: "Something else",
};

/** Rows older than this are deleted by the scheduled job (AC-8). */
export const RETENTION_DAYS = 365;

/** The line under both forms; it must match `RETENTION_DAYS` (AC-8). */
export const RETENTION_LINE =
  "I keep messages for 12 months, then delete them. Your details are used only to reply.";

/** The retry job gives up on a row after this many tries (AC-7). */
export const MAX_NOTIFY_ATTEMPTS = 8;
/** The try count at which a still unsent row raises a Sentry alert (AC-7). */
export const ALERT_AT_ATTEMPTS = 3;
/** The retry job skips rows younger than this, so it never races the first send (AC-7). */
export const RETRY_MIN_AGE_MS = 2 * 60 * 1000;
/** At most this many rows per scheduled run (AC-7). */
export const RETRY_BATCH_SIZE = 20;
/** Request bodies above this are refused (AC-5). */
export const MAX_BODY_BYTES = 16 * 1024;
/** The browser gives up on a request after this long (AC-10). */
export const CLIENT_TIMEOUT_MS = 15_000;

// Control characters (including line breaks) never belong in a name or an
// email, and keeping them out keeps both safe inside email headers (AC-3).
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/;
const noControlCharacters = (value: string) => !CONTROL_CHARACTERS.test(value);

const name = z
  .string()
  .trim()
  .min(1, "Enter your name.")
  .max(100, "Keep your name under 100 characters.")
  .refine(noControlCharacters, "Use letters, spaces, and punctuation only.");

const email = z
  .string()
  .trim()
  .min(1, "Enter your email.")
  .max(254, "Keep your email under 254 characters.")
  .refine(noControlCharacters, "Enter a valid email, like name@example.com.")
  .refine(
    (value) => z.email().safeParse(value).success,
    "Enter a valid email, like name@example.com.",
  );

const topic = z.enum(TOPICS, { error: "Choose what it is about." });

const message = z
  .string()
  .trim()
  .min(10, "Write at least 10 characters.")
  .max(4000, "Keep your message under 4,000 characters.");

const reason = z
  .string()
  .trim()
  .min(10, "Write at least 10 characters.")
  .max(1000, "Keep your reason under 1,000 characters.");

/** What a visitor types into the contact form (AC-1, AC-3). */
export const contactFields = z.object({ name, email, topic, message });
/** What a visitor types into the request details form (AC-2, AC-3). */
export const requestFields = z.object({ name, email, reason });

export type ContactFields = z.infer<typeof contactFields>;
export type RequestFields = z.infer<typeof requestFields>;

const id = z.uuid();
const turnstileToken = z.string().min(1).max(2048);
const projectSlug = z
  .string()
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

/** The JSON body of `POST /api/contact` (AC-5, AC-9). Unknown keys are dropped. */
export const contactPayload = contactFields.extend({ id, turnstileToken });
/** The JSON body of `POST /api/request` (AC-5, AC-9). Unknown keys are dropped. */
export const requestPayload = requestFields.extend({ id, turnstileToken, projectSlug });

export type ContactPayload = z.infer<typeof contactPayload>;
export type RequestPayload = z.infer<typeof requestPayload>;

/** The trap field bots fill and people never see (AC-5). */
export const HONEYPOT_FIELD = "website";

/**
 * Whether a parsed JSON body has the honeypot filled. Checked on the raw
 * object before the schema, so a bot that also breaks another field still
 * gets the same answer as a real success (AC-5).
 */
export const isHoneypotFilled = (body: unknown): boolean => {
  if (typeof body !== "object" || body === null) return false;
  const value: unknown = (body as Record<string, unknown>)[HONEYPOT_FIELD];
  if (value === undefined || value === null) return false;
  return typeof value !== "string" || value.trim() !== "";
};

/** The first error message for each field, for showing under the field (AC-3). */
export const fieldErrors = (error: z.ZodError): Readonly<Record<string, string>> => {
  const entries: [string, string][] = [];
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !entries.some(([existing]) => existing === key)) {
      entries.push([key, issue.message]);
    }
  }
  return Object.fromEntries(entries);
};
