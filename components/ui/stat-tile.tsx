import { cx } from "./cx";

type StatTileProps = {
  readonly value: string;
  readonly label: string;
  readonly context?: string;
  /** `large` for the green block (Bricolage numbers, C); `standard` elsewhere (mono, B). */
  readonly size?: "standard" | "large";
  /** Classes for the tile itself (padding, fill). It must be the `<dl>`'s direct child. */
  readonly className?: string;
};

/**
 * One headline number with what it counts. Put it straight inside a `<dl>`:
 * its `<div>` is the group a `<dl>` allows, so wrapping it in another element
 * breaks the list for screen readers. Style the tile through `className`.
 */
export function StatTile({ value, label, context, size = "standard", className }: StatTileProps) {
  const large = size === "large";
  return (
    <div className={cx("flex flex-col gap-1", className)}>
      <dt className={cx("text-sm", large ? "text-block-muted" : "text-muted")}>{label}</dt>
      <dd
        className={cx(
          "order-first tabular-nums",
          large
            ? "font-display text-stat font-extrabold"
            : "font-mono text-2xl font-medium text-accent",
        )}
      >
        {value}
      </dd>
      {context ? (
        <dd className={cx("text-sm", large ? "text-block-muted" : "text-muted")}>{context}</dd>
      ) : null}
    </div>
  );
}
