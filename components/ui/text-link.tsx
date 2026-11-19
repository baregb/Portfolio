import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { cx } from "./cx";

type TextLinkProps = {
  readonly href: string;
  readonly children: ReactNode;
  /** Opens in a new tab, with an icon and a screen reader note. */
  readonly external?: boolean;
  readonly className?: string;
};

const classes =
  "font-medium text-accent underline decoration-1 underline-offset-4 " +
  "transition-[text-decoration-thickness] duration-(--duration-fast) hover:decoration-2";

/** An inline text link. */
export function TextLink({ href, children, external = false, className }: TextLinkProps) {
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cx(classes, "inline-flex items-center gap-0.5", className)}
      >
        {children}
        {/* The arrow's path leaves about 4px empty on its right; pull it in so
            punctuation after the link sits close, as it would after a word. */}
        <ArrowUpRight aria-hidden="true" className="-me-0.5 size-3.5" strokeWidth={2.25} />
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    );
  }
  return (
    <Link href={href} className={cx(classes, className)}>
      {children}
    </Link>
  );
}
