import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { SpecSheet } from "@/components/ui/spec-sheet";
import { Tag } from "@/components/ui/tag";
import { ExternalLinks } from "./external-links";
import type { LibraryBadge, LibraryItem } from "./library-item";

const BADGES: Readonly<Record<LibraryBadge, string>> = {
  "case-study": "Case study",
  "on-request": "Available on request",
};

/**
 * One project as a card (spec 0004, AC-7). A flagship card is one big link to
 * its case study; a public card shows its own links; an on request card offers
 * "Request details". Safe in client components: it takes a plain `LibraryItem`.
 */
export function ProjectCard({ item }: { readonly item: LibraryItem }) {
  const { href } = item;
  return (
    <Card
      id={`project-${item.slug}`}
      as="article"
      className="relative h-full transition-colors duration-(--duration-fast) has-[a.card-link:hover]:border-line-strong"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="label text-accent">{item.category}</p>
        {item.badge ? <Badge>{BADGES[item.badge]}</Badge> : null}
      </div>
      <h3 className="text-subheading font-bold">
        {href ? (
          // The link covers the whole card; its text alone names the destination.
          <Link
            href={href}
            className="card-link after:absolute after:inset-0 after:content-[''] hover:underline hover:decoration-1 hover:underline-offset-4"
          >
            {item.title}
          </Link>
        ) : (
          item.title
        )}
      </h3>
      <p className="text-muted">{item.summary}</p>
      {item.headlineResult ? (
        <p className="flex flex-wrap items-baseline gap-x-2">
          <span className="font-mono text-xl font-medium text-accent tabular-nums">
            {item.headlineResult.value}
          </span>
          <span className="text-sm text-muted">{item.headlineResult.label}</span>
        </p>
      ) : null}
      <SpecSheet
        className="-mx-1 border border-line"
        items={[
          { key: "Client", value: item.clientLabel },
          { key: "Period", value: item.period },
        ]}
      />
      {item.stack.length > 0 ? (
        <ul aria-label="Stack" className="flex flex-wrap gap-1.5">
          {item.stack.map((name) => (
            <li key={name}>
              <Tag>{name}</Tag>
            </li>
          ))}
        </ul>
      ) : null}
      {href ? (
        <p
          aria-hidden="true"
          className="mt-auto inline-flex items-center gap-1.5 pt-1 text-sm font-medium text-accent"
        >
          {item.badge === "on-request" ? "See the summary" : "Read the case study"}
          <Icon icon={ArrowRight} />
        </p>
      ) : null}
      {!href && item.requestHref ? (
        <div className="mt-auto pt-1">
          <Button href={item.requestHref} variant="line" size="sm">
            Request details
          </Button>
        </div>
      ) : null}
      {!href && item.links.length > 0 ? (
        <ExternalLinks links={item.links} label={`${item.title} links`} className="mt-auto pt-1" />
      ) : null}
    </Card>
  );
}
