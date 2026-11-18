"use client";

import { SearchX } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { countLabel } from "@/components/portfolio/format";
import type { LibraryItem } from "@/components/portfolio/library-item";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import {
  filterProjects,
  filtersToQuery,
  parseFilters,
  type FilterKey,
  type FilterOptions,
  type Filters,
} from "./filter";
import { FilterBar } from "./filter-bar";
import { ProjectList } from "./project-list";

// The filterable library (spec 0004, AC-8). The address is the state: a
// change writes it with `history.replaceState` (no navigation, no payload
// fetch, no flood of history entries), and `useSearchParams` follows it.
// Imports only types from the content layer, never the read layer.

const writeAddress = (filters: Filters) => {
  const query = filtersToQuery(filters);
  window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
};

export function ProjectLibrary({
  items,
  options,
}: {
  readonly items: readonly LibraryItem[];
  readonly options: FilterOptions;
}) {
  const filters = parseFilters(useSearchParams(), options);
  const visible = filterProjects(items, filters);

  const change = (key: FilterKey, value: string) => {
    const { [key]: _previous, ...rest } = filters;
    writeAddress(value ? { ...rest, [key]: value } : rest);
  };
  const clear = () => writeAddress({});

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
          <Button variant="secondary" onClick={clear}>
            Clear filters
          </Button>
        </Card>
      )}
    </div>
  );
}
