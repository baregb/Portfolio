CREATE TABLE `submission` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`topic` text,
	`message` text NOT NULL,
	`project_slug` text,
	`created_at` text NOT NULL,
	`notified_at` text,
	`notify_attempts` integer DEFAULT 0 NOT NULL,
	CONSTRAINT "submission_kind_check" CHECK("submission"."kind" in ('contact', 'request')),
	CONSTRAINT "submission_kind_fields_check" CHECK(("submission"."kind" = 'contact' and "submission"."topic" is not null and "submission"."project_slug" is null) or ("submission"."kind" = 'request' and "submission"."topic" is null and "submission"."project_slug" is not null))
);
--> statement-breakpoint
CREATE INDEX `submission_created_at_idx` ON `submission` (`created_at`);--> statement-breakpoint
CREATE INDEX `submission_retry_idx` ON `submission` (`notified_at`,`created_at`);