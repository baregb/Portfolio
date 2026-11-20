import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  allAbouts,
  allCategories,
  allLenses,
  allProfiles,
  allProjects,
  allSectors,
  allServices,
  allSkills,
  allStacks,
  allTestimonials,
} from "content-collections";
import { describe, expect, it } from "vitest";
import { createContentReader } from "../content/read";
import { cardFileName, cardPath, fullTitle, sitePages } from "./pages";

// Feature 13: one page list drives metadata, the sitemap, and the cards, so
// these checks run against the real content in both draft modes.

const pagesFor = (includeDrafts: boolean) => {
  const reader = createContentReader(
    {
      projects: allProjects,
      lenses: allLenses,
      categories: allCategories,
      stack: allStacks,
      skills: allSkills,
      sectors: allSectors,
      services: allServices,
      testimonials: allTestimonials,
      profiles: allProfiles,
      abouts: allAbouts,
    },
    includeDrafts,
  );
  return {
    reader,
    pages: sitePages({
      profile: reader.getProfile(),
      about: reader.getAbout(),
      lenses: reader.getLenses(),
      flagships: reader.getFlagships(),
    }),
  };
};

describe.each([false, true])("sitePages (drafts %s)", (includeDrafts) => {
  const { reader, pages } = pagesFor(includeDrafts);
  const paths = pages.map(({ path }) => path);

  it("lists every public page: home, about, work, contact, privacy, each lens, each flagship", () => {
    expect(paths).toEqual([
      "/",
      "/about",
      "/work",
      "/contact",
      "/privacy",
      ...reader.getLenses().map(({ slug }) => `/for/${slug}`),
      ...reader.getFlagships().map(({ slug }) => `/work/${slug}`),
    ]);
  });

  it("never lists the pages that are kept out of search", () => {
    expect(paths.filter((path) => /^\/(request|styleguide)/.test(path))).toEqual([]);
  });

  it("gives every page a title, a description, and its own card file", () => {
    for (const page of pages) {
      expect(page.title.trim(), page.path).not.toBe("");
      expect(page.description.trim(), page.path).not.toBe("");
      expect(page.card.heading.trim(), page.path).not.toBe("");
    }
    const files = pages.map(({ path }) => cardFileName(path));
    expect(new Set(files).size).toBe(files.length);
  });

  it("leaves the name suffix to the layout template (spec 0004, AC-13)", () => {
    const { name } = reader.getProfile();
    for (const page of pages.filter(({ absoluteTitle }) => !absoluteTitle)) {
      expect(page.title, page.path).not.toContain(` · ${name}`);
    }
  });
});

describe("every static route has a page entry", () => {
  const appDir = join(import.meta.dirname, "..", "..", "app");
  const NOT_INDEXED = new Set(["request", "styleguide"]);
  const staticRoutes = readdirSync(appDir).filter(
    (entry) =>
      statSync(join(appDir, entry)).isDirectory() &&
      !NOT_INDEXED.has(entry) &&
      readdirSync(join(appDir, entry)).includes("page.tsx"),
  );

  it.each(staticRoutes)("/%s is listed", (route) => {
    expect(pagesFor(false).pages.map(({ path }) => path)).toContain(`/${route}`);
  });
});

describe("card file names and titles", () => {
  it("maps routes to flat file names under /og", () => {
    expect(cardFileName("/")).toBe("home.png");
    expect(cardFileName("/about")).toBe("about.png");
    expect(cardFileName("/work/ledger-engine")).toBe("work-ledger-engine.png");
    expect(cardPath("/for/software-developer")).toBe("/og/for-software-developer.png");
  });

  it("adds the name to a page title unless the title is absolute", () => {
    const base = {
      kind: "work",
      path: "/work",
      description: "d",
      card: { label: "Work", heading: "h" },
    } as const;
    expect(fullTitle({ ...base, title: "Work", absoluteTitle: false }, "Ada")).toBe("Work · Ada");
    expect(fullTitle({ ...base, title: "Ada · Builder", absoluteTitle: true }, "Ada")).toBe(
      "Ada · Builder",
    );
  });
});
