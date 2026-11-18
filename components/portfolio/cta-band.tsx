import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Container } from "@/components/ui/container";
import { Icon } from "@/components/ui/icon";
import { Section } from "@/components/ui/section";
import type { Profile } from "@/features/content";
import type { CvAsset } from "@/features/media/manifest";
import { Availability } from "./availability";
import { CvButton } from "./cv-button";

const TITLE_ID = "cta-title";

/** The closing call to action on every profile and case study page (spec 0004): contact and the CV. */
export function CtaBand({
  cv,
  availability,
}: {
  readonly cv: CvAsset;
  readonly availability: Profile["availability"];
}) {
  return (
    <Section labelledBy={TITLE_ID} reveal>
      <Container>
        <div className="grid gap-8 border border-line bg-surface p-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:p-10">
          <div className="grid min-w-0 gap-4">
            <Availability availability={availability} />
            <h2 id={TITLE_ID} className="max-w-2xl text-title font-extrabold">
              Want to talk about a role or a project?
            </h2>
          </div>
          <ButtonGroup>
            <Button href="/contact" iconEnd={<Icon icon={ArrowRight} />}>
              Get in touch
            </Button>
            <CvButton cv={cv} />
          </ButtonGroup>
        </div>
      </Container>
    </Section>
  );
}
