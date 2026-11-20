import { cx } from "@/components/ui/cx";
import type { Profile } from "@/features/content";
import { availabilityLabel, projectAvailabilityLabel } from "./format";

/** Who the line speaks to: employers (`roles`) or clients (`projects`, spec 0006 AC-13). */
export type AvailabilityAudience = "roles" | "projects";

/**
 * The availability line (spec 0004, AC-16): a status mark and a fixed label,
 * then the note. The label carries the status, so colour is never the only cue.
 * The `projects` line never shows the note, which is written for roles.
 */
export function Availability({
  availability,
  audience = "roles",
  className,
}: {
  readonly availability: Profile["availability"];
  readonly audience?: AvailabilityAudience;
  readonly className?: string;
}) {
  const forProjects = audience === "projects";
  const muted = forProjects
    ? availability.projects === "closed"
    : availability.status === "unavailable";
  const label = forProjects
    ? projectAvailabilityLabel(availability.projects)
    : availabilityLabel(availability.status);
  const note = forProjects ? undefined : availability.note;
  return (
    <p className={cx("flex flex-wrap items-center gap-x-2 gap-y-1 text-sm", className)}>
      <span
        aria-hidden="true"
        className={cx(
          "size-2.5 shrink-0 rounded-full",
          muted ? "bg-muted" : "bg-accent ring-4 ring-accent-soft",
        )}
      />
      <span className="font-medium">{label}</span>
      {note ? <span className="text-muted">· {note}</span> : null}
    </p>
  );
}
