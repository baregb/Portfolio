import type { ReactNode } from "react";
import { cx } from "./cx";

/** A square hairline box for content (B). Not a control, so no radius and no shadow. */
export function Card({
  id,
  children,
  className,
  as: Tag = "div",
}: {
  readonly id?: string;
  readonly children: ReactNode;
  readonly className?: string;
  readonly as?: "div" | "article" | "aside" | "li";
}) {
  return (
    <Tag
      id={id}
      className={cx("grid content-start gap-3 border border-line bg-surface p-5 md:p-6", className)}
    >
      {children}
    </Tag>
  );
}
