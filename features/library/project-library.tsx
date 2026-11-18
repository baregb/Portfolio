"use client";

import { SearchX } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { countLabel } from "@/components/portfolio/format";
import type { LibraryItem } from "@/components/portfolio/library-item";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import {
  changeFilterQuery,
  filterProjects,
  parseFilters,
  type FilterKey,
  type FilterOptions,
} from "./filter";
import { FilterBar } from "./filter-bar";
import { ProjectList } from "./project-list";

// The filterable library (spec 0004, AC-8). The address is the state: a
// change writes it with `history.replaceState` (no navigation, no payload
// fetch, no flood of history entries), and `useSearchParams` follows it.
// Imports only types from the content layer, never the read layer.

const writeQuery = (query: string) =>
  window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);

export function ProjectLibrary({
  items,
  options,
}: {
  readonly items: readonly LibraryItem[];
  readonly options: FilterOptions;
}) {
  const filters = parseFilters(useSearchParams(), options);
  const visible = filterProjects(items, filters);

  // Read the live address, not `filters`: a second change can arrive before
  // the re-render that follows the first.
  const change = (key: FilterKey, value: string) =>
    writeQuery(changeFilterQuery(window.location.search, options, key, value));
  const clear = () => writeQuery("");

  return (
    <div className="grid gap-8">
      <FilterBar
        options={options}
        filters={filters}
        onChange={change}
        onClear={clear}
        status={countLabel(visible.length, "project")}
      />
      {visible.length > 0 ? (
        <ProjectList items={visible} />
      ) : (
        <Card className="justify-items-start gap-4 py-10 md:p-12">
          <Icon icon={SearchX} className="size-8 text-accent" />
          <h3 className="text-subheading font-bold">No projects match these filters</h3>
          <p className="text-muted">Try fewer filters, or clear them to see everything.</p>
          <ButtonGroup className="justify-self-stretch sm:justify-self-start">
            <Button variant="secondary" onClick={clear}>
              Clear filters
            </Button>
          </ButtonGroup>
        </Card>
      )}
    </div>
  );
}
