import type { ReactNode } from "react";
import { cx } from "./cx";

/**
 * A row of actions. On phones every button stacks at the full width, so they
 * all match; from `sm` they sit side by side at their own widths.
 */
export function ButtonGroup({
  children,
  className,
}: {
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return (
    <div className={cx("grid gap-3 sm:flex sm:flex-wrap sm:items-center", className)}>
      {children}
    </div>
  );
}
