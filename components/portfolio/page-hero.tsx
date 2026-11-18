import type { ReactNode } from "react";
import { Container } from "@/components/ui/container";
import { cx } from "@/components/ui/cx";
import { Section } from "@/components/ui/section";
import { HighlightedText } from "./highlighted-text";

export const PAGE_TITLE_ID = "page-title";

type PageHeroProps = {
  /** The mono label above the title. */
  readonly label: ReactNode;
  /** The page's only `h1`. */
  readonly title: string;
  /** `display` for a name (home, lens, about); `title` for other pages. */
  readonly titleSize?: "display" | "title";
  readonly lead: string;
  /** A phrase of `lead` to highlight. */
  readonly highlight?: string;
  /** Actions and extra text under the lead. */
  readonly children?: ReactNode;
  /** A photo: in the right column from `md`. */
  readonly media?: ReactNode;
  /** Where `media` sits on phones: `top` (above the label) or `bottom` (after the text). */
  readonly mediaOnPhones?: "top" | "bottom";
};

/**
 * The page header band with the blueprint grid (spec 0004): label, title,
 * lead, then whatever the page adds. The grid appears only here (AC-14).
 */
export function PageHero({
  label,
  title,
  titleSize = "title",
  lead,
  highlight,
  children,
  media,
  mediaOnPhones = "top",
}: PageHeroProps) {
  return (
    <Section variant="grid" spacing="hero" labelledBy={PAGE_TITLE_ID}>
      <Container
        className={cx(
          "grid gap-6 md:items-center md:gap-12",
          media ? "md:grid-cols-[minmax(0,1fr)_auto]" : undefined,
        )}
      >
        <div className="grid min-w-0 content-start gap-5 md:gap-6">
          <p className="label text-accent">{label}</p>
          <h1
            id={PAGE_TITLE_ID}
            className={cx(
              "font-extrabold break-words",
              titleSize === "display" ? "text-display" : "text-title",
            )}
          >
            {title}
          </h1>
          <p className="max-w-prose text-lead text-muted">
            <HighlightedText text={lead} phrase={highlight} />
          </p>
          {children}
        </div>
        {media ? (
          <div className={cx(mediaOnPhones === "top" && "order-first md:order-none")}>{media}</div>
        ) : null}
      </Container>
    </Section>
  );
}
