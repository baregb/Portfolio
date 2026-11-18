// Library filters (spec 0004, AC-8): pure, so the client component only wires
// them to the address. Each filter is unset or one valid slug; filters combine
// with AND, and a project matches one filter when it has that value.

export const FILTER_KEYS = ["problem", "role", "stack"] as const;
export type FilterKey = (typeof FILTER_KEYS)[number];

export type Filters = Readonly<Partial<Record<FilterKey, string>>>;

export type FilterOption = { readonly slug: string; readonly name: string };
export type FilterOptions = Readonly<Record<FilterKey, readonly FilterOption[]>>;

export type Filterable = {
  readonly categorySlugs: readonly string[];
  readonly lensSlugs: readonly string[];
  readonly stackSlugs: readonly string[];
};

const FIELD: Readonly<Record<FilterKey, keyof Filterable>> = {
  problem: "categorySlugs",
  role: "lensSlugs",
  stack: "stackSlugs",
};

/** Reads `?problem=&role=&stack=`, dropping any value that is not a known option. */
export const parseFilters = (
  params: { get: (key: string) => string | null },
  options: FilterOptions,
): Filters =>
  Object.fromEntries(
    FILTER_KEYS.flatMap((key) => {
      const value = params.get(key);
      return value && options[key].some((option) => option.slug === value) ? [[key, value]] : [];
    }),
  );

/** Keeps the projects that match every set filter, in their original (library) order. */
export const filterProjects = <T extends Filterable>(
  items: readonly T[],
  filters: Filters,
): readonly T[] =>
  items.filter((item) =>
    FILTER_KEYS.every((key) => {
      const value = filters[key];
      return value === undefined || item[FIELD[key]].includes(value);
    }),
  );

/** The query string for a set of filters, in a fixed order, unset filters left out. */
export const filtersToQuery = (filters: Filters): string =>
  FILTER_KEYS.flatMap((key) => {
    const value = filters[key];
    return value ? [`${key}=${encodeURIComponent(value)}`] : [];
  }).join("&");

/** Sets one filter, or unsets it for an empty value, leaving the others alone. */
export const setFilter = (filters: Filters, key: FilterKey, value: string): Filters => {
  const { [key]: _previous, ...rest } = filters;
  return value ? { ...rest, [key]: value } : rest;
};

/**
 * The query after one filter change, built from the address as it is now
 * (`location.search`), not from the last render. Two changes can land before
 * React re-renders; building from rendered state made the second one drop
 * the first.
 */
export const changeFilterQuery = (
  search: string,
  options: FilterOptions,
  key: FilterKey,
  value: string,
): string =>
  filtersToQuery(setFilter(parseFilters(new URLSearchParams(search), options), key, value));

export const hasFilters = (filters: Filters): boolean =>
  FILTER_KEYS.some((key) => filters[key] !== undefined);
