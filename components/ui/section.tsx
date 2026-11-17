import type { ReactNode } from "react";
import { cx } from "./cx";

export type SectionVariant = "plain" | "grid" | "accent";

type SectionProps = {
  /** `grid` draws the blueprint grid (hero and page headers only); `accent` is the green block, at most once per page (AC-14). */
  readonly variant?: SectionVariant;
  readonly labelledBy?: string;
  /** Rise in as it enters the viewport (CSS only, AC-7). */
  readonly reveal?: boolean;
  readonly className?: string;
  readonly children: ReactNode;
};

const VARIANTS: Readonly<Record<SectionVariant, string>> = {
  plain: "",
  grid: "grid-band border-b border-line",
  accent: "bg-block text-block-ink",
};

/** A full width band. Put a `Container` inside it for the page width. */
export function Section({
  variant = "plain",
  labelledBy,
  reveal = false,
  className,
  children,
}: SectionProps) {
  return (
    <section
      aria-labelledby={labelledBy}
      className={cx("py-16 md:py-24", VARIANTS[variant], reveal && "reveal", className)}
    >
      {children}
    </section>
  );
}
