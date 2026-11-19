import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Container } from "@/components/ui/container";
import { Icon } from "@/components/ui/icon";
import { Section } from "@/components/ui/section";
import { StatTile } from "@/components/ui/stat-tile";
import type { Flagship } from "@/features/content";
import { projectAnchor } from "./links";

const MAX_TILES = 4;

/**
 * The page's one green block (spec 0004, AC-1, AC-3): a flagship with up to
 * four results as large tiles and the way into its case study. The tile row
 * is left out when the project has no results.
 */
export function FeaturedProject({ project }: { readonly project: Flagship }) {
  const titleId = `featured-${project.slug}`;
  const onRequest = project.visibility === "onRequest";
  const results = project.results.slice(0, MAX_TILES);
  return (
    <Section variant="accent" labelledBy={titleId}>
      <Container className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center lg:gap-16">
        <div className="grid min-w-0 content-start justify-items-start gap-5">
          <div className="flex flex-wrap items-center gap-3">
            <p className="label text-block-muted">Featured case study</p>
            {onRequest ? <Badge tone="onAccent">Available on request</Badge> : null}
          </div>
          <h2 id={titleId} className="text-title font-extrabold">
            {project.title}
          </h2>
          <p className="max-w-prose text-lead text-block-muted">{project.summary}</p>
          <p className="label text-block-muted">
            {project.primaryCategory.name} · {project.sector.name}
          </p>
          <ButtonGroup className="mt-2 justify-self-stretch sm:justify-self-start">
            <Button
              href={projectAnchor(project)}
              variant="onAccent"
              iconEnd={<Icon icon={ArrowRight} />}
            >
              {onRequest ? "See the summary" : "Read the case study"}
            </Button>
          </ButtonGroup>
        </div>
        {results.length > 0 ? (
          <dl className="grid grid-cols-1 gap-px border border-block-line bg-block-line min-[420px]:grid-cols-2 min-[420px]:[&>*:last-child:nth-child(odd)]:col-span-2">
            {results.map((result) => (
              <StatTile
                key={`${result.value} ${result.label}`}
                value={result.value}
                label={result.label}
                size="large"
                className="bg-block p-5 md:p-6"
              />
            ))}
          </dl>
        ) : null}
      </Container>
    </Section>
  );
}
