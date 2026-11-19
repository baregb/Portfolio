import { Suspense } from "react";
import { countLabel } from "@/components/portfolio/format";
import { toLibraryItem } from "@/components/portfolio/library-item";
import { PageHero } from "@/components/portfolio/page-hero";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { getCategories, getLenses, getProjects, getStackEntries } from "@/features/content";
import { LIBRARY_LEAD } from "./copy";
import type { FilterOptions } from "./filter";
import { FilterBar } from "./filter-bar";
import { ProjectLibrary } from "./project-library";
import { ProjectList } from "./project-list";

const LIST_TITLE = "projects-title";

const pick = ({ slug, name }: { readonly slug: string; readonly name: string }) => ({
  slug,
  name,
});

/**
 * `/work` (spec 0004, AC-7, AC-8): every project as a card. The page and the
 * Suspense fallback both show the full list, so the first paint is never a
 * skeleton and the list still shows with JavaScript off.
 */
export function LibraryPage() {
  const items = getProjects().map(toLibraryItem);
  const options: FilterOptions = {
    problem: getCategories().map(pick),
    role: getLenses().map(pick),
    stack: getStackEntries().map(pick),
  };
  const all = countLabel(items.length, "project");
  return (
    <>
      <PageHero label="Work" title="Projects and case studies" lead={LIBRARY_LEAD} />
      <Section labelledBy={LIST_TITLE} spacing="compact">
        <Container className="grid gap-8">
          <h2 id={LIST_TITLE} className="sr-only">
            Projects
          </h2>
          <Suspense
            fallback={
              <div className="grid gap-8">
                <FilterBar options={options} filters={{}} status={all} />
                <ProjectList items={items} />
              </div>
            }
          >
            <ProjectLibrary items={items} options={options} />
          </Suspense>
        </Container>
      </Section>
    </>
  );
}
