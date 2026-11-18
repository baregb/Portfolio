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

export const hasFilters = (filters: Filters): boolean =>
  FILTER_KEYS.some((key) => filters[key] !== undefined);
