import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Icon } from "@/components/ui/icon";
import { Section } from "@/components/ui/section";
import type { Profile } from "@/features/content";
import { Availability } from "./availability";
import { HighlightedText } from "./highlighted-text";

const TITLE_ID = "services-band-title";

/**
 * Home's way into the services (spec 0006, AC-12): a quiet hairline band
 * above the closing call to action, so the recruiter path stays proof first.
 * Home renders it only when a service is published (AC-5b).
 */
export function ServicesBand({
  services,
  availability,
}: {
  readonly services: Profile["services"];
  readonly availability: Profile["availability"];
}) {
  return (
    <Section labelledBy={TITLE_ID} reveal className="border-t border-line">
      <Container className="grid gap-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:gap-12">
        <div className="grid min-w-0 gap-4">
          <p className="label text-accent">Freelance</p>
          <h2 id={TITLE_ID} className="max-w-3xl text-heading font-bold">
            <HighlightedText text={services.headline} phrase={services.headlineHighlight} />
          </h2>
          <p className="max-w-prose text-muted">{services.intro}</p>
          <Availability availability={availability} audience="projects" />
        </div>
        <Button
          href="/services"
          variant="secondary"
          iconEnd={<Icon icon={ArrowRight} />}
          className="w-full sm:w-auto"
        >
          See services
        </Button>
      </Container>
    </Section>
  );
}
