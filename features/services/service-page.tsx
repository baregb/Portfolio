import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Availability } from "@/components/portfolio/availability";
import { CtaBand } from "@/components/portfolio/cta-band";
import { enquiryHref } from "@/components/portfolio/enquiry";
import { Faq } from "@/components/portfolio/faq";
import { toLibraryItem } from "@/components/portfolio/library-item";
import { LogoStrip, clientLogos } from "@/components/portfolio/logo-strip";
import { PageHero } from "@/components/portfolio/page-hero";
import { ProjectCard } from "@/components/portfolio/project-card";
import { Testimonials } from "@/components/portfolio/testimonials";
import { TRACK_RECORD_ID, TrackRecord } from "@/components/portfolio/track-record";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Container } from "@/components/ui/container";
import { Icon } from "@/components/ui/icon";
import { Section } from "@/components/ui/section";
import { TrackServiceVisit } from "@/features/analytics";
import { ANALYTICS_EVENTS } from "@/features/analytics/config";
import { getProfile, getServices, type Service } from "@/features/content";

const INCLUDED_TITLE = "included-title";
const RELATED_ID = "related-projects";
const RELATED_TITLE = "related-projects-title";
const OTHERS_TITLE = "other-services-title";

/**
 * One service at `/services/<slug>` (spec 0006, AC-11): hero, logos, what is
 * included, the track record as the page's one green block, related projects,
 * quotes, FAQ, the other services, and the client call to action.
 */
export function ServicePage({ service }: { readonly service: Service }) {
  const profile = getProfile();
  const others = getServices().filter((other) => other.slug !== service.slug);
  const enquiry = enquiryHref(service.slug);
  const proof = service.trackRecord.length > 0 ? TRACK_RECORD_ID : RELATED_ID;

  return (
    <>
      <TrackServiceVisit service={service.slug} />
      <PageHero
        label="Services"
        title={service.name}
        lead={service.headline}
        highlight={service.headlineHighlight}
      >
        <p className="max-w-prose text-muted">{service.intro}</p>
        <Availability availability={profile.availability} audience="projects" />
        <ButtonGroup>
          <Button
            href={enquiry}
            iconEnd={<Icon icon={ArrowRight} />}
            data-analytics-event={ANALYTICS_EVENTS.projectEnquiry}
            data-analytics-service={service.slug}
          >
            Start a project
          </Button>
          <Button href={`#${proof}`} variant="secondary">
            See the proof
          </Button>
        </ButtonGroup>
      </PageHero>

      <LogoStrip logos={clientLogos(profile.clients)} />

      <Section labelledBy={INCLUDED_TITLE} reveal>
        <Container className="grid gap-8">
          <div className="grid gap-3">
            <p className="label text-accent">{service.tagline}</p>
            <h2 id={INCLUDED_TITLE} className="text-heading font-bold">
              What&apos;s included
            </h2>
          </div>
          <ul className="grid border-s border-t border-line md:grid-cols-2">
            {service.offerings.map((offering) => (
              <li
                key={offering.title}
                className="grid content-start gap-2 border-e border-b border-line bg-surface p-6 md:p-8"
              >
                <h3 className="text-subheading font-bold">{offering.title}</h3>
                <p className="text-muted">{offering.description}</p>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <TrackRecord
        items={service.trackRecord}
        tone="green"
        lead="Numbers from shipped work, each one sourced in its case study."
      />

      <Section id={RELATED_ID} labelledBy={RELATED_TITLE} reveal>
        <Container className="grid gap-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 id={RELATED_TITLE} className="text-heading font-bold">
              Related projects
            </h2>
            <Link href="/work" className="text-accent underline underline-offset-4">
              See all work
            </Link>
          </div>
          <ul className="grid gap-4 md:grid-cols-2">
            {service.projects.map((project) => (
              <li key={project.slug}>
                <ProjectCard item={toLibraryItem(project)} />
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Testimonials quotes={service.testimonials} />
      <Faq items={service.faq} />

      {others.length > 0 ? (
        <Section labelledBy={OTHERS_TITLE} reveal className="border-t border-line">
          <Container className="grid gap-6">
            <h2 id={OTHERS_TITLE} className="text-heading font-bold">
              Other ways I can help
            </h2>
            <ul className="grid border-s border-t border-line sm:grid-cols-2 lg:grid-cols-3">
              {others.map((other) => (
                <li
                  key={other.slug}
                  className="relative grid content-start gap-2 border-e border-b border-line bg-surface p-5 transition-colors duration-(--duration-fast) hover:bg-accent-soft"
                >
                  <h3 className="font-semibold">
                    <Link
                      href={`/services/${other.slug}`}
                      className="after:absolute after:inset-0 after:content-['']"
                    >
                      {other.name}
                    </Link>
                  </h3>
                  <p className="label text-accent">{other.tagline}</p>
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      ) : null}

      <CtaBand
        audience="projects"
        availability={profile.availability}
        href={enquiry}
        service={service.slug}
      />
    </>
  );
}
