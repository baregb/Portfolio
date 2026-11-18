"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { SelectField } from "@/components/ui/text-field";
import { FILTER_KEYS, type FilterKey, type FilterOptions, type Filters } from "./filter";

export const FILTER_LABELS: Readonly<Record<FilterKey, string>> = {
  problem: "Problem",
  role: "Role",
  stack: "Stack",
};

type FilterBarProps = {
  readonly options: FilterOptions;
  readonly filters: Filters;
  /** Leave out for the static stand in shown until JavaScript loads. */
  readonly onChange?: (key: FilterKey, value: string) => void;
  readonly onClear?: () => void;
  readonly status: string;
};

/**
 * Three labelled native selects and the live count (spec 0004, AC-8). Without
 * `onChange` it renders read only, as the same size stand in, so the list does
 * not jump when the real bar takes over. Hidden when scripting is off.
 */
export function FilterBar({ options, filters, onChange, onClear, status }: FilterBarProps) {
  const live = onChange !== undefined;
  const active = FILTER_KEYS.some((key) => filters[key] !== undefined);
  return (
    <form
      aria-label="Filter projects"
      onSubmit={(event) => event.preventDefault()}
      className="grid gap-4 border border-line bg-surface p-4 md:p-5 noscript:hidden"
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {FILTER_KEYS.map((key) => (
          <SelectField
            key={key}
            label={FILTER_LABELS[key]}
            name={key}
            id={`filter-${key}`}
            value={filters[key] ?? ""}
            disabled={!live}
            onChange={(event) => onChange?.(key, event.target.value)}
            options={[
              { value: "", label: "All" },
              ...options[key].map((option) => ({ value: option.slug, label: option.name })),
            ]}
          />
        ))}
      </div>
      <div className="flex min-h-9 flex-wrap items-center justify-between gap-3">
        <p role={live ? "status" : undefined} className="label text-muted">
          {status}
        </p>
        {live && active ? (
          <Button variant="ghost" size="sm" onClick={onClear} iconStart={<Icon icon={X} />}>
            Clear filters
          </Button>
        ) : null}
      </div>
    </form>
  );
}
