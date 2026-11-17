import { cx } from "./cx";

/**
 * Holds layout while content loads (AC-11). A gentle pulse, static under
 * reduced motion. Hidden from screen readers; the region that loads announces it.
 */
export function Skeleton({ className }: { readonly className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        "block animate-[skeleton-pulse_1.6s_ease-in-out_infinite] bg-line/60",
        className,
      )}
    />
  );
}
