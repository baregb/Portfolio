import type { ReactNode } from "react";
import { cx } from "./cx";

export type SectionVariant = "plain" | "grid" | "accent";

export type SectionSpacing = "normal" | "hero" | "heroFlush" | "compact";

type SectionProps = {
  readonly id?: string;
  /** `grid` draws the blueprint grid (hero and page headers only); `accent` is the green block, at most once per page (AC-14). */
  readonly variant?: SectionVariant;
  readonly labelledBy?: string;
  /** Rise in as it enters the viewport (CSS only, AC-7). */
  readonly reveal?: boolean;
  /** `hero` is tighter on phones, so a page's first screen holds its key actions; `heroFlush` drops the top padding on phones for a photo that sits flush at the top; `compact` is for a slim strip. */
  readonly spacing?: SectionSpacing;
  readonly className?: string;
  readonly children: ReactNode;
};

const VARIANTS: Readonly<Record<SectionVariant, string>> = {
  plain: "",
  grid: "grid-band border-b border-line",
  accent: "bg-block text-block-ink",
};

const SPACING: Readonly<Record<SectionSpacing, string>> = {
  normal: "py-16 md:py-24",
  hero: "pt-10 pb-14 md:py-20",
  heroFlush: "pb-14 md:py-20",
  compact: "py-8 md:py-10",
};

/** A full width band. Put a `Container` inside it for the page width. */
export function Section({
  id,
  variant = "plain",
  labelledBy,
  reveal = false,
  spacing = "normal",
  className,
  children,
}: SectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cx(SPACING[spacing], VARIANTS[variant], reveal && "reveal", className)}
    >
      {children}
    </section>
  );
}
