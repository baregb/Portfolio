import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Container } from "@/components/ui/container";
import { Icon } from "@/components/ui/icon";
import { Section } from "@/components/ui/section";
import type { Profile } from "@/features/content";
import { ANALYTICS_EVENTS } from "@/features/analytics/config";
import type { CvAsset } from "@/features/media/manifest";
import { Availability } from "./availability";
import { CvButton } from "./cv-button";

const TITLE_ID = "cta-title";

type CtaBandProps =
  | {
      /** Recruiter pages (spec 0004): contact and the CV. */
      readonly audience?: "roles";
      readonly cv: CvAsset;
      readonly availability: Profile["availability"];
    }
  | {
      /** Services pages (spec 0006, AC-12): one way in, the contact form, and no CV. */
      readonly audience: "projects";
      readonly availability: Profile["availability"];
      /** The page's enquiry link. */
      readonly href: string;
      /** Sent with the `project-enquiry` event: the service slug, or `index`. */
      readonly service: string;
    };

/** The closing call to action on every profile, case study, and services page. */
export function CtaBand(props: CtaBandProps) {
  const forProjects = props.audience === "projects";
  return (
    <Section labelledBy={TITLE_ID} reveal>
      <Container>
        <div className="grid gap-8 border border-line bg-surface p-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:p-10">
          <div className="grid min-w-0 gap-4">
            <Availability
              availability={props.availability}
              audience={forProjects ? "projects" : "roles"}
            />
            <h2 id={TITLE_ID} className="max-w-2xl text-title font-extrabold">
              {forProjects ? "Have a project in mind?" : "Want to talk about a role or a project?"}
            </h2>
          </div>
          <ButtonGroup>
            {props.audience === "projects" ? (
              <Button
                href={props.href}
                iconEnd={<Icon icon={ArrowRight} />}
                data-analytics-event={ANALYTICS_EVENTS.projectEnquiry}
                data-analytics-service={props.service}
              >
                Start a project
              </Button>
            ) : (
              <>
                <Button href="/contact" iconEnd={<Icon icon={ArrowRight} />}>
                  Get in touch
                </Button>
                <CvButton cv={props.cv} />
              </>
            )}
          </ButtonGroup>
        </div>
      </Container>
    </Section>
  );
}
