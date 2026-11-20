import { ArrowRight } from "lucide-react";
import { Availability } from "@/components/portfolio/availability";
import { CtaBand } from "@/components/portfolio/cta-band";
import { enquiryHref } from "@/components/portfolio/enquiry";
import { LogoStrip, clientLogos } from "@/components/portfolio/logo-strip";
import { PageHero } from "@/components/portfolio/page-hero";
import { ServiceCard } from "@/components/portfolio/service-card";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Container } from "@/components/ui/container";
import { Icon } from "@/components/ui/icon";
import { Section } from "@/components/ui/section";
import { ANALYTICS_EVENTS } from "@/features/analytics/config";
import { getProfile, getServices } from "@/features/content";

const LIST_TITLE = "services-list-title";
/** Sent with `project-enquiry` from this page (spec 0006, AC-17). */
const INDEX = "index";

/**
 * `/services` (spec 0006, AC-10): what you offer clients, every published
 * service in `serviceOrder`, and one way in. With no published service it
 * keeps the hero and the call to action only (AC-5b), and is not indexed.
 */
export function ServicesIndexPage() {
  const profile = getProfile();
  const services = getServices();
  return (
    <>
      <PageHero
        label="Freelance"
        title="Services"
        lead={profile.services.headline}
        highlight={profile.services.headlineHighlight}
      >
        <p className="max-w-prose text-muted">{profile.services.intro}</p>
        <Availability availability={profile.availability} audience="projects" />
        <ButtonGroup>
          <Button
            href={enquiryHref()}
            iconEnd={<Icon icon={ArrowRight} />}
            data-analytics-event={ANALYTICS_EVENTS.projectEnquiry}
            data-analytics-service={INDEX}
          >
            Start a project
          </Button>
        </ButtonGroup>
      </PageHero>
      <LogoStrip logos={clientLogos(profile.clients)} />
      {services.length > 0 ? (
        <Section labelledBy={LIST_TITLE} reveal>
          <Container className="grid gap-8">
            <div className="grid gap-3">
              <p className="label text-accent">Pick one, or bring the whole project</p>
              <h2 id={LIST_TITLE} className="text-heading font-bold">
                What I can do for you
              </h2>
            </div>
            <ol className="grid border-s border-t border-line md:grid-cols-2">
              {services.map((service, index) => (
                <li key={service.slug} className="border-e border-b border-line">
                  <ServiceCard service={service} index={index} />
                </li>
              ))}
            </ol>
          </Container>
        </Section>
      ) : null}
      <CtaBand
        audience="projects"
        availability={profile.availability}
        href={enquiryHref()}
        service={INDEX}
      />
    </>
  );
}
