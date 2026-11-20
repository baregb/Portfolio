import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Availability } from "@/components/portfolio/availability";
import { CtaBand } from "@/components/portfolio/cta-band";
import { CvButton } from "@/components/portfolio/cv-button";
import { Faq } from "@/components/portfolio/faq";
import { FeaturedProject } from "@/components/portfolio/featured-project";
import { countLabel } from "@/components/portfolio/format";
import { LensSwitcher, type LensOption } from "@/components/portfolio/lens-switcher";
import { LogoStrip, type ClientLogo } from "@/components/portfolio/logo-strip";
import type { LibraryItem } from "@/components/portfolio/library-item";
import { PageHero } from "@/components/portfolio/page-hero";
import { ProfilePhoto } from "@/components/portfolio/profile-photo";
import { ProjectCard } from "@/components/portfolio/project-card";
import { ServicesBand } from "@/components/portfolio/services-band";
import { Testimonials } from "@/components/portfolio/testimonials";
import { TrackRecord } from "@/components/portfolio/track-record";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Container } from "@/components/ui/container";
import { Icon } from "@/components/ui/icon";
import { Section } from "@/components/ui/section";
import { Tag } from "@/components/ui/tag";
import { TextLink } from "@/components/ui/text-link";
import type { FaqItem, Flagship, Profile, Testimonial, TrackRecordItem } from "@/features/content";
import type { CvAsset } from "@/features/media/manifest";

// The one composition behind home and every role lens (spec 0004, AC-1,
// AC-3): a lens is this page with different values, not a second design.

export type ProfilePageHero = {
  readonly label: string;
  readonly lead: string;
  readonly highlight?: string;
  /** A lens's intro, under the lead. */
  readonly intro?: string;
};

export type CategorySummary = {
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly count: number;
};

export type SkillGroupSummary = { readonly group: string; readonly skills: readonly string[] };

export type LensSkill = {
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  /** `/about#skill-<slug>` when about lists the skill; plain text otherwise. */
  readonly href: string | null;
};

type ProfilePageProps = {
  readonly profile: Profile;
  readonly cv: CvAsset;
  readonly hero: ProfilePageHero;
  readonly lenses: readonly LensOption[];
  /** The current lens slug; `null` on home (Everything). */
  readonly current: string | null;
  /** The green block, when there is a flagship to feature. */
  readonly featured?: Flagship;
  /** The rest, as project cards. */
  readonly projects: readonly LibraryItem[];
  /** Home: "Problems I solve". */
  readonly categories?: readonly CategorySummary[];
  /** Home: every skill group with its skill names. */
  readonly skillGroups?: readonly SkillGroupSummary[];
  /** A lens: its own skills with descriptions. */
  readonly lensSkills?: readonly LensSkill[];
  /** Home: the client logo strip, right after the hero (spec 0006, AC-9). */
  readonly logos?: readonly ClientLogo[];
  /** A lens: its track record, plain, after the switcher (spec 0006, AC-15). */
  readonly trackRecord?: readonly TrackRecordItem[];
  /** Quotes after the work: home's featured ones, or a lens's (spec 0006, AC-8). */
  readonly testimonials?: readonly Testimonial[];
  /** A lens: its FAQ, after its skills (spec 0006, AC-15). */
  readonly faq?: readonly FaqItem[];
  /** Home: the way into the services, when one is published (spec 0006, AC-12). */
  readonly showServicesBand?: boolean;
};

const SWITCHER_TITLE = "lens-switcher-title";
const WORK_TITLE = "more-work-title";
const PROBLEMS_TITLE = "problems-title";
const SKILLS_TITLE = "skills-title";

export function ProfilePage({
  profile,
  cv,
  hero,
  lenses,
  current,
  featured,
  projects,
  categories = [],
  skillGroups = [],
  lensSkills = [],
  logos = [],
  trackRecord = [],
  testimonials = [],
  faq = [],
  showServicesBand = false,
}: ProfilePageProps) {
  return (
    <>
      <PageHero
        label={hero.label}
        title={profile.name}
        titleSize="display"
        lead={hero.lead}
        highlight={hero.highlight}
        media={<ProfilePhoto photo={profile.photo} variant="fill" priority />}
        mediaLayout="split"
      >
        {hero.intro ? <p className="max-w-prose text-muted">{hero.intro}</p> : null}
        <Availability availability={profile.availability} />
        <ButtonGroup>
          <Button href="#work" iconEnd={<Icon icon={ArrowRight} />}>
            See case studies
          </Button>
          <CvButton cv={cv} />
          <Button href="/contact" variant="secondary">
            Contact
          </Button>
        </ButtonGroup>
      </PageHero>

      <LogoStrip logos={logos} />

      <Section spacing="compact" labelledBy={SWITCHER_TITLE} className="border-b border-line">
        <Container className="grid gap-4 md:grid-cols-[auto_minmax(0,1fr)] md:items-center md:gap-8">
          <h2 id={SWITCHER_TITLE} className="label text-muted">
            Hiring for a specific role?
          </h2>
          <LensSwitcher lenses={lenses} current={current} labelledBy={SWITCHER_TITLE} />
        </Container>
      </Section>

      <TrackRecord items={trackRecord} tone="plain" />

      {/* The hero's "See case studies" lands here. */}
      <div id="work">
        {featured ? <FeaturedProject project={featured} /> : null}
        <Section labelledBy={WORK_TITLE} reveal>
          <Container className="grid gap-8">
            {projects.length > 0 ? (
              <>
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <h2 id={WORK_TITLE} className="text-heading font-bold">
                    {featured ? "More work" : "Selected work"}
                  </h2>
                  <TextLink href="/work">See all work</TextLink>
                </div>
                <ul className="grid gap-4 md:grid-cols-2">
                  {projects.map((item) => (
                    <li key={item.slug}>
                      <ProjectCard item={item} />
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-4 border-y border-line py-6">
                <h2 id={WORK_TITLE} className="text-heading font-bold">
                  More work
                </h2>
                <Button
                  href="/work"
                  variant="secondary"
                  iconEnd={<Icon icon={ArrowRight} />}
                  className="w-full sm:w-auto"
                >
                  See all work
                </Button>
              </div>
            )}
          </Container>
        </Section>
      </div>

      <Testimonials quotes={testimonials} />

      {categories.length > 0 ? (
        <Section labelledBy={PROBLEMS_TITLE} reveal className="border-t border-line">
          <Container className="grid gap-8">
            <h2 id={PROBLEMS_TITLE} className="text-heading font-bold">
              Problems I solve
            </h2>
            <ul className="grid border-s border-t border-line sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <li
                  key={category.slug}
                  className="relative grid content-start gap-3 border-e border-b border-line bg-surface p-5 transition-colors duration-(--duration-fast) hover:bg-accent-soft md:p-6"
                >
                  <h3 className="text-subheading font-bold">
                    <Link
                      href={`/work?problem=${category.slug}`}
                      className="after:absolute after:inset-0 after:content-['']"
                    >
                      {category.name}
                    </Link>
                  </h3>
                  <p className="text-muted">{category.description}</p>
                  <p className="label text-accent">{countLabel(category.count, "project")}</p>
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      ) : null}

      {skillGroups.length > 0 ? (
        <Section labelledBy={SKILLS_TITLE} reveal className="border-t border-line">
          <Container className="grid gap-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 id={SKILLS_TITLE} className="text-heading font-bold">
                Skills
              </h2>
              <TextLink href="/about#skills">See all skills</TextLink>
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {skillGroups.map(({ group, skills }) => (
                <div key={group} className="grid content-start gap-3 border-t border-line pt-4">
                  <h3 className="text-subheading font-bold">{group}</h3>
                  <ul className="flex flex-wrap gap-1.5">
                    {skills.map((name) => (
                      <li key={name}>
                        <Tag>{name}</Tag>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Container>
        </Section>
      ) : null}

      {lensSkills.length > 0 ? (
        <Section labelledBy={SKILLS_TITLE} reveal className="border-t border-line">
          <Container className="grid gap-8">
            <h2 id={SKILLS_TITLE} className="text-heading font-bold">
              Skills
            </h2>
            <ul className="grid border-s border-t border-line md:grid-cols-2">
              {lensSkills.map((skill) => (
                <li
                  key={skill.slug}
                  className="grid content-start gap-2 border-e border-b border-line bg-surface p-5 md:p-6"
                >
                  <h3 className="text-subheading font-bold">
                    {skill.href ? <TextLink href={skill.href}>{skill.name}</TextLink> : skill.name}
                  </h3>
                  <p className="text-muted">{skill.description}</p>
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      ) : null}

      <Faq items={faq} />

      {showServicesBand ? (
        <ServicesBand services={profile.services} availability={profile.availability} />
      ) : null}

      <CtaBand cv={cv} availability={profile.availability} />
    </>
  );
}
