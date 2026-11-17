import { cx } from "./cx";

type StatTileProps = {
  readonly value: string;
  readonly label: string;
  readonly context?: string;
  /** `large` for the green block (Bricolage numbers, C); `standard` elsewhere (mono, B). */
  readonly size?: "standard" | "large";
};

/** One headline number with what it counts. Use inside a `<dl>` row of tiles. */
export function StatTile({ value, label, context, size = "standard" }: StatTileProps) {
  const large = size === "large";
  return (
    <div className="flex flex-col gap-1">
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
