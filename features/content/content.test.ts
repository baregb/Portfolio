import { readdirSync } from "node:fs";
import { join, sep } from "node:path";
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
import { checkContent } from "./check.ts";
import { createContentReader } from "./read.ts";
import { SECTIONS } from "./rules.ts";

// AC-13: the real generated collections pass every rule in both draft modes,
// and the read layer resolves them. `pnpm test` runs `pnpm content` first.

const root = join(import.meta.dirname, "../../content");
const files = readdirSync(root, { recursive: true, withFileTypes: true })
  .filter((entry) => entry.isFile())
  .map((entry) =>
    join(entry.parentPath, entry.name)
      .slice(root.length + 1)
      .split(sep)
      .join("/"),
  )
  .filter((file) => !file.split("/").some((segment) => segment.startsWith(".")));

const data = {
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
};

describe("real content", () => {
  it.each([true, false])("passes checkContent with includeDrafts=%s", (includeDrafts) => {
    const result = checkContent(
      { ...data, files },
      { includeDrafts, today: new Date().toISOString().slice(0, 10) },
    );
    expect(result.ok ? [] : result.errors).toEqual([]);
  });

  it("returns the public flagship with six compiled sections", () => {
    const project = createContentReader(data, false).getProject("beccahs-kitchen");
    expect(project?.visibility === "public" && project.depth === "flagship").toBe(true);
    if (project?.visibility !== "public" || project.depth !== "flagship") return;
    for (const { key } of SECTIONS) {
      expect(project.sections[key].markdown).not.toBe("");
      expect(project.sections[key].code).toContain("return Component");
    }
    // Each section compiled from its own slice: no cache collisions.
    const codes = SECTIONS.map(({ key }) => project.sections[key].code);
    expect(new Set(codes).size).toBe(SECTIONS.length);
    expect(project.sections.problem.markdown).not.toMatch(/^## /);
  });

  it("keeps the on request flagship to its brief", () => {
    const project = createContentReader(data, false).getProject(
      "membership-charity-data-migration",
    );
    expect(project).toMatchObject({ visibility: "onRequest", depth: "flagship" });
    expect(project).not.toHaveProperty("sections");
    expect(project).not.toHaveProperty("links");
  });

  it("orders the lenses as the profile lists them", () => {
    expect(
      createContentReader(data, false)
        .getLenses()
        .map((lens) => lens.slug),
    ).toEqual([
      "solutions-architect",
      "software-developer",
      "ai-assisted-builder",
      "seo-specialist",
    ]);
  });
});
