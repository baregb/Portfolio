import Link from "next/link";
import { Container } from "@/components/ui/container";
import { cx } from "@/components/ui/cx";
import { Section } from "@/components/ui/section";
import type { TrackRecordItem } from "@/features/content";
import { serialNumber } from "./format";

const TITLE_ID = "track-record-title";
export const TRACK_RECORD_ID = "track-record";

// One column per result from `md`, so a short list never leaves an empty cell.
const COLUMNS = ["", "md:grid-cols-2", "md:grid-cols-3"] as const;

/**
 * Spec 0006, AC-6: up to three numbered results drawn from a page's projects.
 * `green` is a service page's one green block; `plain` sits on a lens, whose
 * featured project already holds the green. Renders nothing when empty.
 */
export function TrackRecord({
  items,
  tone,
  lead,
}: {
  readonly items: readonly TrackRecordItem[];
  readonly tone: "plain" | "green";
  /** A line under the heading. */
  readonly lead?: string;
}) {
  if (items.length === 0) return null;
  const green = tone === "green";
  return (
    <Section
      id={TRACK_RECORD_ID}
      variant={green ? "accent" : "plain"}
      labelledBy={TITLE_ID}
      reveal={!green}
      className={green ? undefined : "border-b border-line"}
    >
      <Container className="grid gap-8 md:gap-10">
        <div className="grid gap-3">
          <p className={cx("label", green ? "text-block-muted" : "text-accent")}>The proof</p>
          <h2
            id={TITLE_ID}
            className={green ? "text-title font-extrabold" : "text-heading font-bold"}
          >
            Track record
          </h2>
          {lead ? (
            <p className={cx("max-w-prose", green ? "text-block-muted" : "text-muted")}>{lead}</p>
          ) : null}
        </div>
        <ol
          className={cx(
            "grid border-s border-t",
            COLUMNS[Math.min(items.length, 3) - 1],
            green ? "border-block-line" : "border-line",
          )}
        >
          {items.map((item, index) => (
            <li
              key={`${item.project.title} ${item.result.label}`}
              className={cx(
                "grid min-w-0 content-start gap-3 border-e border-b p-5 md:p-6",
                green ? "border-block-line bg-block" : "border-line bg-surface",
              )}
            >
              <span
                aria-hidden="true"
                className={cx("label", green ? "text-block-muted" : "text-muted")}
              >
                {serialNumber(index)}
              </span>
              <h3 className="grid gap-1">
                <span
                  className={cx(
                    "break-words tabular-nums",
                    green
                      ? "font-display text-stat font-extrabold"
                      : "font-mono text-2xl font-medium text-accent",
                  )}
                >
                  {item.result.value}
                </span>
                <span
                  className={cx("text-base font-semibold", green ? "text-block-ink" : "text-fg")}
                >
                  {item.result.label}
                </span>
              </h3>
              {item.result.context ? (
                <p className={cx("text-sm", green ? "text-block-muted" : "text-muted")}>
                  {item.result.context}
                </p>
              ) : null}
              <p className={cx("mt-auto pt-2 label", green ? "text-block-muted" : "text-muted")}>
                From{" "}
                {item.project.href ? (
                  <Link
                    href={item.project.href}
                    className={cx(
                      "underline decoration-1 underline-offset-4",
                      green ? "text-block-ink" : "text-accent",
                    )}
                  >
                    {item.project.title}
                  </Link>
                ) : (
                  <span className={green ? "text-block-ink" : "text-fg"}>{item.project.title}</span>
                )}
              </p>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  );
}
