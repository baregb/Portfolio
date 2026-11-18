import { cx } from "@/components/ui/cx";
import type { Profile } from "@/features/content";
import { availabilityLabel } from "./format";

/**
 * The availability line (spec 0004, AC-16): a status mark and a fixed label,
 * then the note. The label carries the status, so colour is never the only cue.
 */
export function Availability({
  availability,
  className,
}: {
  readonly availability: Profile["availability"];
  readonly className?: string;
}) {
  const { status, note } = availability;
  return (
    <p className={cx("flex flex-wrap items-center gap-x-2 gap-y-1 text-sm", className)}>
      <span
        aria-hidden="true"
        className={cx(
          "size-2.5 shrink-0 rounded-full",
          status === "unavailable" ? "bg-muted" : "bg-accent ring-4 ring-accent-soft",
        )}
      />
      <span className="font-medium">{availabilityLabel(status)}</span>
      {note ? <span className="text-muted">· {note}</span> : null}
    </p>
  );
}
