import { describe, expect, it } from "vitest";
import {
  filterProjects,
  filtersToQuery,
  hasFilters,
  parseFilters,
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
