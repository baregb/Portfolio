import type { ReactNode } from "react";
import { cx } from "./cx";

export type SpecSheetItem = { readonly key: string; readonly value: ReactNode };

/** Key and value rows with dashed rules, the blueprint spec sheet (B). Renders nothing when empty. */
export function SpecSheet({
  items,
  className,
}: {
  readonly items: readonly SpecSheetItem[];
  readonly className?: string;
}) {
  if (items.length === 0) return null;
  return (
    <dl className={cx("font-mono text-[0.8125rem]", className)}>
      {items.map(({ key, value }) => (
        <div
          key={key}
          className="flex justify-between gap-3 border-b border-dashed border-line px-3.5 py-2.5 last:border-b-0"
        >
          <dt className="shrink-0 text-muted">{key}</dt>
          <dd className="min-w-0 text-right break-words">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
