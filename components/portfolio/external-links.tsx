import { ArrowUpRight } from "lucide-react";
import { cx } from "@/components/ui/cx";
import { TextLink } from "@/components/ui/text-link";
import { displayAddress, type ExternalLink } from "./links";

type ExternalLinksProps = {
  readonly links: readonly ExternalLink[];
  /** `inline` is a row of text links; `list` is one box per link with its address shown. */
  readonly variant?: "inline" | "list";
  /** Names the list for screen readers. */
  readonly label: string;
  readonly className?: string;
};

/** External links that open in a new tab and say so (spec 0004). Renders nothing when empty. */
export function ExternalLinks({ links, variant = "inline", label, className }: ExternalLinksProps) {
  if (links.length === 0) return null;

  if (variant === "inline") {
    return (
      <ul aria-label={label} className={cx("flex flex-wrap gap-x-5 gap-y-2", className)}>
        {links.map(({ label: text, href }) => (
          <li key={href}>
            <TextLink href={href} external>
              {text}
            </TextLink>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul aria-label={label} className={cx("grid gap-px border border-line bg-line", className)}>
      {links.map(({ label: text, href }) => (
        <li key={href}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex min-h-16 items-center justify-between gap-4 bg-surface px-5 py-4 transition-colors duration-(--duration-fast) hover:bg-accent-soft"
          >
            <span className="grid min-w-0 gap-0.5">
              <span className="font-medium">{text}</span>
              <span className="font-mono text-[0.8125rem] break-all text-muted">
                {displayAddress(href)}
              </span>
            </span>
            <ArrowUpRight
              aria-hidden="true"
              className="size-5 shrink-0 text-accent transition-transform duration-(--duration-fast) group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              strokeWidth={2}
            />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
