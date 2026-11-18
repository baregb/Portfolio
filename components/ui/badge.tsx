import type { ReactNode } from "react";
import { cx } from "./cx";

type BadgeProps = {
  readonly children: ReactNode;
  /** `onAccent` for a badge sitting on the green block. */
  readonly tone?: "default" | "onAccent";
};

/** A dashed hairline label for a status, such as "Available on request". */
export function Badge({ children, tone = "default" }: BadgeProps) {
  return (
    <span
      className={cx(
        "inline-flex items-center border border-dashed px-2 py-0.5 label",
        tone === "default"
          ? "border-line-strong text-muted"
          : "border-block-muted text-block-muted",
      )}
    >
      {children}
    </span>
  );
}
