import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { TOPICS } from "../../features/forms/schema";

// Spec 0005, data model: one table for both forms. No IP addresses or user
// agents are stored. Times are ISO 8601 UTC text, set by the Worker.

export const KINDS = ["contact", "request"] as const;
export type Kind = (typeof KINDS)[number];

export const submission = sqliteTable(
  "submission",
  {
    // A UUID made in the browser: the idempotency key (AC-9).
    id: text("id").primaryKey(),
    kind: text("kind", { enum: KINDS }).notNull(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    // Set exactly when `kind` is `contact`.
    topic: text("topic", { enum: TOPICS }),
    // The contact message, or the request reason.
    message: text("message").notNull(),
    // Set exactly when `kind` is `request`.
    projectSlug: text("project_slug"),
    createdAt: text("created_at").notNull(),
    notifiedAt: text("notified_at"),
    notifyAttempts: integer("notify_attempts").notNull().default(0),
  },
  (table) => [
    index("submission_created_at_idx").on(table.createdAt),
    index("submission_retry_idx").on(table.notifiedAt, table.createdAt),
    check("submission_kind_check", sql`${table.kind} in ('contact', 'request')`),
    check(
      "submission_kind_fields_check",
      sql`(${table.kind} = 'contact' and ${table.topic} is not null and ${table.projectSlug} is null) or (${table.kind} = 'request' and ${table.topic} is null and ${table.projectSlug} is not null)`,
    ),
  ],
);

export type Submission = typeof submission.$inferSelect;
export type NewSubmission = typeof submission.$inferInsert;
