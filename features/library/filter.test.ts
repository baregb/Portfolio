import { describe, expect, it } from "vitest";
import {
  changeFilterQuery,
  filterProjects,
  setFilter,
  filtersToQuery,
  hasFilters,
  parseFilters,
  type FilterKey,
  type FilterOptions,
} from "./filter.ts";

// Library filters (spec 0004, AC-8), invented items.

const options: FilterOptions = {
  problem: [
    { slug: "commerce", name: "Commerce" },
    { slug: "data", name: "Data" },
  ],
  role: [
    { slug: "architect", name: "Architect" },
    { slug: "developer", name: "Developer" },
  ],
  stack: [
    { slug: "nextjs", name: "Next.js" },
    { slug: "postgres", name: "Postgres" },
    { slug: "claude", name: "Claude" },
  ],
};

const item = (slug: string, categories: string[], lenses: string[], stack: string[]) => ({
  slug,
  categorySlugs: categories,
  lensSlugs: lenses,
  stackSlugs: stack,
});

const items = [
  item("shop", ["commerce"], ["architect", "developer"], ["nextjs", "claude"]),
  item("migration", ["data"], ["developer"], ["postgres"]),
  item("tools", ["commerce", "data"], [], ["nextjs", "postgres"]),
];

const slugs = (list: readonly { slug: string }[]) => list.map((entry) => entry.slug);

describe("parseFilters", () => {
  it("reads known values", () => {
    expect(
      parseFilters(new URLSearchParams("problem=data&role=developer&stack=nextjs"), options),
    ).toEqual({ problem: "data", role: "developer", stack: "nextjs" });
  });

  it("ignores unknown and empty values and other keys", () => {
    expect(
      parseFilters(new URLSearchParams("problem=nope&role=developer&stack=&page=2"), options),
    ).toEqual({ role: "developer" });
  });

  it("is empty for an empty address", () => {
    expect(parseFilters(new URLSearchParams(""), options)).toEqual({});
  });
});

describe("filterProjects", () => {
  it("keeps everything with no filters", () => {
    expect(slugs(filterProjects(items, {}))).toEqual(["shop", "migration", "tools"]);
  });

  it("matches a project that has the value, within one filter", () => {
    expect(slugs(filterProjects(items, { problem: "data" }))).toEqual(["migration", "tools"]);
    expect(slugs(filterProjects(items, { role: "developer" }))).toEqual(["shop", "migration"]);
  });

  it("matches AI tools through the stack filter", () => {
    expect(slugs(filterProjects(items, { stack: "claude" }))).toEqual(["shop"]);
  });

  it("combines filters with AND and keeps the original order", () => {
    expect(slugs(filterProjects(items, { problem: "commerce", stack: "nextjs" }))).toEqual([
      "shop",
      "tools",
    ]);
    expect(slugs(filterProjects(items, { problem: "data", role: "developer" }))).toEqual([
      "migration",
    ]);
  });

  it("returns nothing when no project matches every filter", () => {
    expect(filterProjects(items, { problem: "data", stack: "claude" })).toEqual([]);
  });
});

describe("filtersToQuery and hasFilters", () => {
  it("writes set filters in a fixed order and leaves out unset ones", () => {
    expect(filtersToQuery({ stack: "nextjs", problem: "data" })).toBe("problem=data&stack=nextjs");
    expect(filtersToQuery({})).toBe("");
  });

  it("round trips through parseFilters", () => {
    const filters = { problem: "commerce", role: "architect", stack: "postgres" };
    expect(parseFilters(new URLSearchParams(filtersToQuery(filters)), options)).toEqual(filters);
  });

  it("says whether any filter is set", () => {
    expect(hasFilters({})).toBe(false);
    expect(hasFilters({ role: "developer" })).toBe(true);
  });
});

describe("setFilter", () => {
  it("sets, replaces, and unsets one filter, leaving the rest", () => {
    expect(setFilter({ role: "developer" }, "stack", "nextjs")).toEqual({
      role: "developer",
      stack: "nextjs",
    });
    expect(setFilter({ stack: "nextjs" }, "stack", "postgres")).toEqual({ stack: "postgres" });
    expect(setFilter({ role: "developer", stack: "nextjs" }, "stack", "")).toEqual({
      role: "developer",
    });
  });
});

describe("changeFilterQuery", () => {
  // Regression: two selects changed before React re-rendered. The second
  // change built on the rendered (stale) filters, so `?problem=` was lost and
  // only `?stack=` survived. Each change must build on the address written by
  // the one before it.
  it("keeps the first of two changes made back to back", () => {
    const rendered = "";
    const first = changeFilterQuery(rendered, options, "problem", "commerce");
    const second = changeFilterQuery(`?${first}`, options, "stack", "nextjs");
    expect(second).toBe("problem=commerce&stack=nextjs");
  });

  it("applies three quick changes in any order", () => {
    const changes: readonly (readonly [FilterKey, string])[] = [
      ["stack", "postgres"],
      ["role", "developer"],
      ["problem", "data"],
    ];
    const query = changes.reduce(
      (search, [key, value]) => `?${changeFilterQuery(search, options, key, value)}`,
      "",
    );
    expect(query).toBe("?problem=data&role=developer&stack=postgres");
  });

  it("unsets a filter and drops unknown values already in the address", () => {
    expect(changeFilterQuery("?problem=data&stack=nope", options, "role", "architect")).toBe(
      "problem=data&role=architect",
    );
    expect(changeFilterQuery("?problem=data&role=architect", options, "problem", "")).toBe(
      "role=architect",
    );
  });
});
