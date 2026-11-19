import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Availability } from "@/components/portfolio/availability";
import { CvButton } from "@/components/portfolio/cv-button";
import { ExternalLinks } from "@/components/portfolio/external-links";
import { profileLinks } from "@/components/portfolio/links";
import { PageHero } from "@/components/portfolio/page-hero";
import { ButtonGroup } from "@/components/ui/button-group";
import { Container } from "@/components/ui/container";
import { Icon } from "@/components/ui/icon";
import { Section } from "@/components/ui/section";
import { getProfile, type OnRequestCard, type OnRequestFlagship } from "@/features/content";
import { ContactForm } from "@/features/forms/contact-form";
import { RequestForm } from "@/features/forms/request-form";
import { getCvAsset } from "@/features/media/manifest";

// Contact and request details (spec 0004, AC-11). Both exist before the forms
// (group D), which mount at the marked spot, so no link to them ever breaks.

const CONTACT_LEAD = "Hiring, or have a project in mind? Here is where to find me.";
const REQUEST_LINE =
  "I share the details of this project privately. Reach me through any of the links below and mention the project.";

const LINKS_TITLE = "profiles-title";

function ProfileLinks() {
  const links = profileLinks(getProfile());
  if (links.length === 0) return null;
  return (
    <div className="grid gap-4">
      <h2 id={LINKS_TITLE} className="label text-muted">
        Find me on
      </h2>
      <ExternalLinks links={links} variant="list" label="Profiles" />
    </div>
  );
}

/** Where each page's form lives (spec 0004, AC-11; spec 0005). */
function FormSlot({
  form,
  children,
}: {
  readonly form: "contact" | "request";
  readonly children: ReactNode;
}) {
  return (
    <div id={`${form}-form`} data-form-slot={form}>
      {children}
    </div>
  );
}

const linkedinUrl = () => getProfile().links.find((link) => link.kind === "linkedin")?.url;

export function ContactPage() {
  const profile = getProfile();
  return (
    <>
      <PageHero label="Contact" title="Get in touch" lead={CONTACT_LEAD}>
        <Availability availability={profile.availability} />
        <ButtonGroup>
          <CvButton cv={getCvAsset()} />
        </ButtonGroup>
      </PageHero>
      <Section>
        <Container>
          <div className="grid max-w-3xl gap-10">
            <ProfileLinks />
            <FormSlot form="contact">
              <ContactForm linkedinUrl={linkedinUrl()} />
            </FormSlot>
          </div>
        </Container>
      </Section>
    </>
  );
}

export const contactMetadata = () => ({
  title: "Contact",
  description: `How to reach ${getProfile().name} about a role or a project.`,
});

export function RequestPage({
  project,
  backHref,
}: {
  readonly project: OnRequestFlagship | OnRequestCard;
  readonly backHref: string;
}) {
  return (
    <>
      <PageHero label="Request details" title={project.title} lead={project.summary}>
        <p className="max-w-prose">{REQUEST_LINE}</p>
      </PageHero>
      <Section>
        <Container>
          <div className="grid max-w-3xl gap-10">
            <ProfileLinks />
            <FormSlot form="request">
              <RequestForm projectSlug={project.slug} linkedinUrl={linkedinUrl()} />
            </FormSlot>
            <p>
              <Link
                href={backHref}
                className="inline-flex min-h-11 items-center gap-2 font-medium text-accent underline decoration-1 underline-offset-4 hover:decoration-2"
              >
                <Icon icon={ArrowLeft} />
                Back to {project.title}
              </Link>
            </p>
          </div>
        </Container>
      </Section>
    </>
  );
}
