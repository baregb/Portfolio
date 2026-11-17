import type { ReactNode } from "react";
import { cx } from "./cx";

/** Centres content at the page width with the side gutter. */
export function Container({
  children,
  className,
}: {
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return <div className={cx("mx-auto w-full max-w-page px-4 md:px-6", className)}>{children}</div>;
}
