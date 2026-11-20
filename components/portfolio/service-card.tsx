import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import type { Service } from "@/features/content";
import { serialNumber } from "./format";

/**
 * One service on `/services` (spec 0006, AC-10): number, name linking to its
 * page, tagline, and headline. A square hairline cell; the whole box is the
 * link target. Place it in an `ol` with `border-s border-t` cells.
 */
export function ServiceCard({
  service,
  index,
  href = `/services/${service.slug}`,
}: {
  readonly service: Pick<Service, "slug" | "name" | "tagline" | "headline">;
  readonly index: number;
  /** Where the card goes; `/styleguide` passes its own page. */
  readonly href?: string;
}) {
  return (
    <article className="relative grid h-full content-start gap-4 bg-surface p-6 transition-colors duration-(--duration-fast) hover:bg-accent-soft md:p-8">
      <div className="flex items-center justify-between gap-4">
        <span aria-hidden="true" className="label text-muted">
          {serialNumber(index)}
        </span>
        <Icon icon={ArrowRight} className="text-accent" />
      </div>
      <h3 className="text-subheading font-bold">
        <Link href={href} className="after:absolute after:inset-0 after:content-['']">
          {service.name}
        </Link>
      </h3>
      <p className="label text-accent">{service.tagline}</p>
      <p className="text-muted">{service.headline}</p>
    </article>
  );
}
