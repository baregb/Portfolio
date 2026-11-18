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

/** `1 project`, `3 projects`. */
export const countLabel = (count: number, noun: string): string =>
  `${count} ${noun}${count === 1 ? "" : "s"}`;
