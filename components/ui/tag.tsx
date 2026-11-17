import Link from "next/link";
import type { ReactNode } from "react";
import { cx } from "./cx";

type TagProps = {
  readonly children: ReactNode;
  readonly href?: string;
  /** `onAccent` for tags sitting on the green block. */
  readonly tone?: "default" | "onAccent";
};

/** A mono label in a square hairline box, such as a stack entry. A link when given `href`. */
export function Tag({ children, href, tone = "default" }: TagProps) {
  const classes = cx(
    "inline-flex items-center border px-2 py-0.5 font-mono text-[0.71875rem] leading-5",
    tone === "default" ? "border-line bg-surface text-fg" : "border-block-line text-block-ink",
    href && "transition-colors duration-(--duration-fast) hover:border-line-strong",
  );
  return href ? (
    <Link href={href} className={classes}>
      {children}
    </Link>
  ) : (
    <span className={classes}>{children}</span>
  );
}
