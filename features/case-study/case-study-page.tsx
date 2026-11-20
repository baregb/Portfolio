import { ArrowLeft, ArrowRight, Lock } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { CtaBand } from "@/components/portfolio/cta-band";
import { ExternalLinks } from "@/components/portfolio/external-links";
import { formatPeriod } from "@/components/portfolio/format";
import { projectLinks, requestHref } from "@/components/portfolio/links";
import { PAGE_TITLE_ID } from "@/components/portfolio/page-hero";
import { Picture } from "@/components/portfolio/picture";
import { Prose } from "@/components/portfolio/prose";
import { Testimonials } from "@/components/portfolio/testimonials";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Container } from "@/components/ui/container";
import { cx } from "@/components/ui/cx";
import { Icon } from "@/components/ui/icon";
import { Section } from "@/components/ui/section";
import { SpecSheet } from "@/components/ui/spec-sheet";
import { StatTile } from "@/components/ui/stat-tile";
import { Tag } from "@/components/ui/tag";
import { TrackCaseStudyRead } from "@/features/analytics";
import { TextLink } from "@/components/ui/text-link";
import {
  SECTIONS,
  getFlagshipNeighbours,
  getProfile,
  getTestimonialsFor,
  type Flagship,
  type OnRequestFlagship,
  type ProjectRef,
  type PublicFlagship,
} from "@/features/content";
import { getCvAsset } from "@/features/media/manifest";

// A case study (spec 0004, AC-4 to AC-6). Public flagships show the six
// sections; on request flagships show only their brief and a request panel,
// and never a link, image, or client name (the union types forbid them).

const REQUEST_PANEL = "The full case study, code, and screenshots are available on request.";

const BRIEF = [
  { heading: "Problem", key: "problem" },
  { heading: "Approach", key: "approach" },
  { heading: "Outcome", key: "outcome" },
  { heading: "How AI was used", key: "ai" },
] as const;

const sectionNumber = (index: number) => String(index + 1).padStart(2, "0");

function CaseStudyHero({
  project,
  cover,
}: {
  readonly project: Flagship;
  readonly cover?: ReactNode;
}) {
  const onRequest = project.visibility === "onRequest";
  const links = projectLinks(project);
  return (
    <Section variant="grid" spacing="hero" labelledBy={PAGE_TITLE_ID}>
      <Container
        className={cx(
          "grid gap-10 lg:gap-16",
          cover ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:items-start" : undefined,
        )}
      >
        <div className="grid min-w-0 content-start justify-items-start gap-5 md:gap-6">
          <div className="flex flex-wrap items-center gap-3">
            <p className="label text-accent">
              {project.primaryCategory.name} · {project.sector.name}
            </p>
            {onRequest ? <Badge>Available on request</Badge> : null}
          </div>
          <h1 id={PAGE_TITLE_ID} className="max-w-4xl text-title font-extrabold break-words">
            {project.title}
          </h1>
          <p className="max-w-prose text-lead text-muted">{project.summary}</p>
          <SpecSheet
            className="w-full max-w-2xl border border-line bg-surface"
            items={[
              { key: "Client", value: project.clientLabel },
              { key: "Role", value: project.role },
              { key: "Period", value: formatPeriod(project.period) },
              { key: "Sector", value: project.sector.name },
              { key: "Stack", value: project.stack.map((entry) => entry.name).join(", ") },
            ]}
          />
          <ExternalLinks links={links} label="Project links" />
        </div>
        {cover}
      </Container>
    </Section>
  );
}

// Columns that fill every row, so no empty cell shows the rule colour.
const resultColumns = (count: number): string => {
  if (count === 1) return "";
  if (count === 2) return "sm:grid-cols-2";
  if (count === 4) return "sm:grid-cols-2 lg:grid-cols-4";
  if (count % 3 === 0) return "sm:grid-cols-3";
  return "sm:grid-cols-2 sm:[&>*:last-child:nth-child(odd)]:col-span-2";
};

function ResultsBlock({ project }: { readonly project: Flagship }) {
  if (project.results.length === 0) return null;
  const labelId = "results-title";
  return (
    <Section variant="accent" labelledBy={labelId}>
      <Container className="grid gap-6">
        <h2 id={labelId} className="label text-block-muted">
          Key results
        </h2>
        <dl
          className={cx(
            "grid grid-cols-1 gap-px border border-block-line bg-block-line",
            resultColumns(project.results.length),
          )}
        >
          {project.results.map((result) => (
            <StatTile
              key={`${result.value} ${result.label}`}
              value={result.value}
              label={result.label}
              context={result.context}
              size="large"
              className="bg-block p-5 md:p-6"
            />
          ))}
        </dl>
      </Container>
    </Section>
  );
}

/** One numbered section: the blueprint number beside its `h2`, the body in a reading column. */
function NumberedSection({
  index,
  heading,
  children,
}: {
  readonly index: number;
  readonly heading: string;
  readonly children: ReactNode;
}) {
  const id = `section-${index + 1}`;
  return (
    <section
      aria-labelledby={id}
      className="grid gap-4 border-t border-line pt-8 lg:grid-cols-[10rem_minmax(0,1fr)] lg:gap-10"
    >
      <p aria-hidden="true" className="font-mono text-sm text-accent">
        {sectionNumber(index)}
      </p>
      <div className="grid min-w-0 gap-5">
        <h2 id={id} className="text-heading font-bold">
          {heading}
        </h2>
        {children}
      </div>
    </section>
  );
}

function PublicSections({ project }: { readonly project: PublicFlagship }) {
  const { diagram, screenshots = [] } = project;
  return SECTIONS.map(({ heading, key }, index) => (
    <NumberedSection key={key} index={index} heading={heading}>
      {key === "built" && diagram ? (
        <figure className="grid gap-3">
          <div className="border border-line bg-surface p-3 md:p-5">
            <Picture image={diagram} sizes="(min-width: 1024px) 48rem, 100vw" fit="contain" />
          </div>
          <details className="group max-w-prose border border-line bg-surface">
            <summary className="flex min-h-11 cursor-pointer items-center px-4 font-medium marker:text-accent">
              Diagram description
            </summary>
            <p className="border-t border-line px-4 py-3 text-muted">{diagram.description}</p>
          </details>
        </figure>
      ) : null}
      <Prose code={project.sections[key].code} />
      {key === "built" && screenshots.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2">
          {screenshots.map((shot) => (
            <figure key={shot.src} className="grid content-start gap-2">
              <div className="border border-line bg-surface">
                <Picture image={shot} sizes="(min-width: 640px) 24rem, 100vw" fit="contain" />
              </div>
              {shot.caption ? (
                <figcaption className="text-sm text-muted">{shot.caption}</figcaption>
              ) : null}
            </figure>
          ))}
        </div>
      ) : null}
      {key === "ai" && project.aiTools.length > 0 ? <AiTools project={project} /> : null}
    </NumberedSection>
  ));
}

function AiTools({ project }: { readonly project: Flagship }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <p className="label text-muted">AI tools</p>
      <ul className="flex flex-wrap gap-1.5">
        {project.aiTools.map((tool) => (
          <li key={tool.slug}>
            <Tag>{tool.name}</Tag>
          </li>
        ))}
      </ul>
    </div>
  );
}

function OnRequestSections({ project }: { readonly project: OnRequestFlagship }) {
  const href = requestHref(project);
  return (
    <>
      {BRIEF.map(({ heading, key }, index) => (
        <NumberedSection key={key} index={index} heading={heading}>
          <p className="max-w-prose text-[1.0625rem] leading-relaxed">{project.brief[key]}</p>
          {key === "ai" && project.aiTools.length > 0 ? <AiTools project={project} /> : null}
        </NumberedSection>
      ))}
      {href ? (
        <div className="grid gap-5 border border-dashed border-line-strong bg-surface p-6 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center md:p-8">
          <Icon icon={Lock} className="size-6 text-accent" />
          <p className="text-lg font-medium">{REQUEST_PANEL}</p>
          <ButtonGroup>
            <Button href={href} variant="line" iconEnd={<Icon icon={ArrowRight} />}>
              Request details
            </Button>
          </ButtonGroup>
        </div>
      ) : null}
    </>
  );
}

function NeighbourLink({
  neighbour,
  direction,
}: {
  readonly neighbour: ProjectRef;
  readonly direction: "previous" | "next";
}) {
  const previous = direction === "previous";
  return (
    <Link
      href={`/work/${neighbour.slug}`}
      className={cx(
        "group grid h-full content-start gap-2 bg-surface p-5 transition-colors duration-(--duration-fast) hover:bg-accent-soft md:p-6",
        !previous && "sm:text-end",
      )}
    >
      <span
        className={cx(
          "inline-flex items-center gap-1.5 label text-accent",
          !previous && "sm:justify-end",
        )}
      >
        {previous ? <Icon icon={ArrowLeft} /> : null}
        {previous ? "Previous case study" : "Next case study"}
        {previous ? null : <Icon icon={ArrowRight} />}
      </span>
      <span className="font-display text-subheading font-bold">{neighbour.title}</span>
    </Link>
  );
}

function Neighbours({ slug }: { readonly slug: string }) {
  const { previous, next } = getFlagshipNeighbours(slug);
  return (
    <nav aria-label="Case studies" className="grid gap-6">
      {previous || next ? (
        <ul className="grid gap-4 sm:grid-cols-2">
          {previous ? (
            <li className="border border-line">
              <NeighbourLink neighbour={previous} direction="previous" />
            </li>
          ) : null}
          {next ? (
            <li className="border border-line sm:col-start-2">
              <NeighbourLink neighbour={next} direction="next" />
            </li>
          ) : null}
        </ul>
      ) : null}
      <p>
        <TextLink href="/work">See all work</TextLink>
      </p>
    </nav>
  );
}

function SkillsShown({ project }: { readonly project: Flagship }) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-line pt-8">
      <p className="label text-muted">Skills shown</p>
      <ul className="flex flex-wrap gap-1.5">
        {project.skills.map((skill) => (
          <li key={skill.slug}>
            <Tag href={`/about#skill-${skill.slug}`}>{skill.name}</Tag>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CaseStudyPage({ project }: { readonly project: Flagship }) {
  const profile = getProfile();
  const cover =
    project.visibility === "public" ? (
      <div className="mx-auto w-full max-w-sm border border-line bg-surface lg:mx-0 lg:max-w-none">
        <Picture
          image={project.cover}
          sizes="(min-width: 1024px) 22rem, (min-width: 640px) 24rem, 100vw"
          fit="contain"
          priority
        />
      </div>
    ) : undefined;

  return (
    <>
      <CaseStudyHero project={project} cover={cover} />
      <ResultsBlock project={project} />
      <Testimonials quotes={getTestimonialsFor(project.slug)} />
      <Section>
        <Container className="grid gap-12">
          {project.visibility === "public" ? (
            <PublicSections project={project} />
          ) : (
            <OnRequestSections project={project} />
          )}
          {/* Feature 13: scrolling past the last section counts as a read. */}
          <TrackCaseStudyRead project={project.slug}>
            <SkillsShown project={project} />
          </TrackCaseStudyRead>
          <Neighbours slug={project.slug} />
        </Container>
      </Section>
      <CtaBand cv={getCvAsset()} availability={profile.availability} />
    </>
  );
}
