import type { Profile } from "@/features/content";

// Display formats shared by every page (spec 0004). Pure and locale fixed, so
// the static HTML is the same on every build machine.

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/** `2026-06` → `Jun 2026`. The content check guarantees the `YYYY-MM` form. */
const formatMonth = (month: string): string => {
  const [year, number] = month.split("-");
  return `${MONTHS[Number(number) - 1] ?? month} ${year}`;
};

/** AC-17: `Jun 2026 to Sep 2026`, `Jun 2026 to now`, or `Jun 2026` for a single month. */
export const formatPeriod = (period: {
  readonly start: string;
  readonly end: string | null;
}): string => {
  if (period.end === null) return `${formatMonth(period.start)} to now`;
  if (period.end === period.start) return formatMonth(period.start);
  return `${formatMonth(period.start)} to ${formatMonth(period.end)}`;
};

export type AvailabilityStatus = Profile["availability"]["status"];

const AVAILABILITY: Readonly<Record<AvailabilityStatus, string>> = {
  open: "Open to new roles",
  selective: "Open to the right role",
  unavailable: "Not looking right now",
};

/** AC-16: the fixed label for each availability status. */
export const availabilityLabel = (status: AvailabilityStatus): string => AVAILABILITY[status];

export type ProjectAvailability = Profile["availability"]["projects"];

const PROJECT_AVAILABILITY: Readonly<Record<ProjectAvailability, string>> = {
  open: "Taking on new projects",
  limited: "Booking a few weeks out",
  closed: "Not taking projects right now",
};

/** Spec 0006, AC-13: the fixed label clients see for `availability.projects`. */
export const projectAvailabilityLabel = (status: ProjectAvailability): string =>
  PROJECT_AVAILABILITY[status];

/** Spec 0006: `01`, `02`, `03` for numbered lists (track record, service cards). */
export const serialNumber = (index: number): string => String(index + 1).padStart(2, "0");

/** Spec 0006, AC-8: `Founder · Atlas`, `Founder`, `Atlas`, or an empty string. */
export const testimonialRole = (quote: {
  readonly role?: string;
  readonly company?: string;
}): string => [quote.role, quote.company].filter(Boolean).join(" · ");

/** `1 project`, `3 projects`. */
export const countLabel = (count: number, noun: string): string =>
  `${count} ${noun}${count === 1 ? "" : "s"}`;
