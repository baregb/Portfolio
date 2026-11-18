import { describe, expect, it } from "vitest";
import {
  baseSnapshot,
  lens,
  onRequestCard,
  onRequestFlagship,
  profile,
  publicCard,
  publicFlagship,
} from "./fixtures.ts";
import { createContentReader } from "./read.ts";

// The read layer (AC-1, AC-4, AC-6, AC-7, AC-8, AC-9, AC-11), invented fixtures.

const reader = (includeDrafts = false, snapshot = baseSnapshot()) =>
  createContentReader(snapshot, includeDrafts);
const slugs = (items: readonly { slug: string }[]) => items.map((item) => item.slug);

describe("getProject (AC-1)", () => {
  it("returns a public flagship with resolved fields, sections, and derived values", () => {
    const project = reader().getProject("atlas-shop");
    expect(project).toMatchObject({
      slug: "atlas-shop",
      visibility: "public",
      depth: "flagship",
      sector: { slug: "retail", name: "Retail" },
      categories: [{ slug: "commerce", name: "Commerce", description: "Selling things" }],
      primaryCategory: { slug: "commerce" },
      stack: [{ slug: "nextjs", name: "Next.js", group: "frontend" }],
      skills: [{ slug: "system-design", name: "System design" }],
      aiTools: [],
      lenses: [
        { slug: "architect", name: "Lens architect" },
        { slug: "developer", name: "Lens developer" },
      ],
      clientLabel: "an invented retailer",
      headlineResult: { value: "2x", label: "faster checkout" },
      seoTitle: "Title atlas-shop",
      seoDescription: "Summary atlas-shop",
    });
    expect(
      project?.depth === "flagship" && project.visibility === "public" && project.sections.problem,
    ).toEqual({
      code: "code:problem",
      markdown: "About problem.",
    });
    expect(project).not.toHaveProperty("_meta");
  });

  it("prefers client.name, seo.title, and seo.description when present", () => {
    const next = publicFlagship("atlas-shop", {
      client: { descriptor: "an invented retailer", name: "Invented Ltd" },
      seo: { title: "SEO title", description: "SEO description" },
    });
    const base = baseSnapshot();
    const snapshot = baseSnapshot({
      projects: base.projects.map((p) => (p._meta.path === "atlas-shop" ? next : p)),
    });
    expect(reader(false, snapshot).getProject("atlas-shop")).toMatchObject({
      clientLabel: "Invented Ltd",
      seoTitle: "SEO title",
      seoDescription: "SEO description",
    });
  });

  it("returns undefined for an unknown slug and for an excluded draft", () => {
    expect(reader().getProject("nope")).toBeUndefined();
    expect(reader(false).getProject("small-sync")).toBeUndefined();
    expect(reader(true).getProject("small-sync")).toMatchObject({ slug: "small-sync" });
  });

  it("gives a card no headline result when it has none", () => {
    expect(reader().getProject("harbor-tools")?.headlineResult).toBeUndefined();
  });
});

describe("flagships and featured (AC-4, AC-8)", () => {
  it("lists only flagships, in flagshipOrder", () => {
    const profiles = [profile({ flagshipOrder: ["quiet-ledger", "atlas-shop"] })];
    expect(slugs(reader(false, baseSnapshot({ profiles })).getFlagships())).toEqual([
      "quiet-ledger",
      "atlas-shop",
    ]);
  });

  it("drops draft flagships in production but keeps them in draft mode", () => {
    const base = baseSnapshot();
    const snapshot = baseSnapshot({
      projects: [...base.projects, publicFlagship("draft-ship", { status: "draft" })],
      profiles: [profile({ flagshipOrder: ["atlas-shop", "draft-ship", "quiet-ledger"] })],
    });
    expect(slugs(reader(false, snapshot).getFlagships())).toEqual(["atlas-shop", "quiet-ledger"]);
    expect(slugs(reader(true, snapshot).getFlagships())).toEqual([
      "atlas-shop",
      "draft-ship",
      "quiet-ledger",
    ]);
    expect(reader(false, snapshot).getFlagshipNeighbours("atlas-shop")).toEqual({
      next: { slug: "quiet-ledger", title: "Title quiet-ledger" },
    });
  });

  it("finds neighbours without wrapping", () => {
    const content = reader();
    expect(content.getFlagshipNeighbours("atlas-shop")).toEqual({
      next: { slug: "quiet-ledger", title: "Title quiet-ledger" },
    });
    expect(content.getFlagshipNeighbours("quiet-ledger")).toEqual({
      previous: { slug: "atlas-shop", title: "Title atlas-shop" },
    });
    expect(content.getFlagshipNeighbours("harbor-tools")).toEqual({});
  });

  it("returns featured in profile order", () => {
    const profiles = [profile({ featured: ["quiet-ledger", "atlas-shop"] })];
    expect(slugs(reader(false, baseSnapshot({ profiles })).getFeatured())).toEqual([
      "quiet-ledger",
      "atlas-shop",
    ]);
  });
});

describe("lenses (AC-6, AC-7)", () => {
  it("returns lenses in lensOrder with projects and skills in file order", () => {
    const profiles = [profile({ lensOrder: ["developer", "architect"] })];
    const lenses = reader(true, baseSnapshot({ profiles })).getLenses();
    expect(slugs(lenses)).toEqual(["developer", "architect"]);
    expect(slugs(lenses[0]?.projects ?? [])).toEqual(["harbor-tools", "atlas-shop", "small-sync"]);
    expect(slugs(lenses[1]?.skills ?? [])).toEqual(["system-design"]);
  });

  it("drops drafts from a lens in production", () => {
    expect(slugs(reader(false).getLens("developer")?.projects ?? [])).toEqual([
      "harbor-tools",
      "atlas-shop",
    ]);
  });

  it("falls back to name and headline for lens SEO", () => {
    expect(reader().getLens("architect")).toMatchObject({
      seoTitle: "Lens architect",
      seoDescription: "Headline architect",
    });
  });

  it("gives a project no lenses when no lens lists it", () => {
    const base = baseSnapshot();
    const snapshot = baseSnapshot({ projects: [...base.projects, publicCard("loner")] });
    expect(reader(false, snapshot).getProject("loner")?.lenses).toEqual([]);
  });

  it("orders project.lenses by lensOrder", () => {
    const profiles = [profile({ lensOrder: ["developer", "architect"] })];
    expect(reader(false, baseSnapshot({ profiles })).getProject("atlas-shop")?.lenses).toEqual([
      { slug: "developer", name: "Lens developer" },
      { slug: "architect", name: "Lens architect" },
    ]);
  });

  it("passes headlineHighlight through only when the lens sets it (spec 0004, AC-15)", () => {
    const base = baseSnapshot();
    const lenses = base.lenses.map((l) =>
      l._meta.path === "architect" ? { ...l, headlineHighlight: "architect" } : l,
    );
    const read = reader(false, baseSnapshot({ lenses }));
    expect(read.getLens("architect")?.headlineHighlight).toBe("architect");
    expect(read.getLens("developer")).not.toHaveProperty("headlineHighlight");
  });

  it("returns undefined for an unknown lens", () => {
    expect(reader().getLens("nope")).toBeUndefined();
  });
});

describe("library order (AC-9)", () => {
  it("orders ongoing first, then end, start, title, and slug", () => {
    const projects = [
      publicCard("old", { period: { start: "2020-01", end: "2020-05" } }),
      publicCard("ongoing-early", { period: { start: "2021-01", end: null } }),
      publicCard("ongoing-late", { period: { start: "2024-01", end: null } }),
      publicCard("ended-recent", { period: { start: "2023-01", end: "2025-01" } }),
      publicCard("same-end-late-start", { period: { start: "2024-06", end: "2025-01" } }),
      publicCard("b-title", { title: "beta", period: { start: "2019-01", end: "2019-02" } }),
      publicCard("a-title", { title: "Alpha", period: { start: "2019-01", end: "2019-02" } }),
      publicCard("z-slug", { title: "alpha", period: { start: "2019-01", end: "2019-02" } }),
      publicFlagship("atlas-shop"),
      onRequestFlagship("quiet-ledger"),
    ];
    const snapshot = baseSnapshot({
      projects,
      lenses: [
        lens("architect", { projects: ["atlas-shop"] }),
        lens("developer", { projects: ["old"] }),
      ],
    });
    expect(slugs(reader(false, snapshot).getProjects())).toEqual([
      "quiet-ledger",
      "ongoing-late",
      "ongoing-early",
      "same-end-late-start",
      "ended-recent",
      "atlas-shop",
      "old",
      "a-title",
      "z-slug",
      "b-title",
    ]);
  });

  it("excludes drafts in production and includes them in draft mode", () => {
    expect(slugs(reader(false).getProjects())).not.toContain("small-sync");
    expect(slugs(reader(true).getProjects())).toContain("small-sync");
  });
});

describe("taxonomies and skill groups (AC-11)", () => {
  it("returns only used categories, stack entries, and sectors, in name order", () => {
    const content = reader();
    expect(slugs(content.getCategories())).toEqual(["commerce", "data-platform"]);
    expect(slugs(content.getStackEntries())).toEqual(["nextjs", "postgres"]);
    expect(slugs(content.getSectors())).toEqual(["retail"]);
  });

  it("counts aiTools as used stack entries", () => {
    const base = baseSnapshot();
    const snapshot = baseSnapshot({
      projects: base.projects.map((p) =>
        p._meta.path === "atlas-shop" ? publicFlagship("atlas-shop", { aiTools: ["claude"] }) : p,
      ),
    });
    expect(slugs(reader(false, snapshot).getStackEntries())).toEqual([
      "claude",
      "nextjs",
      "postgres",
    ]);
  });

  it("ignores taxonomy used only by an excluded draft", () => {
    const base = baseSnapshot();
    const snapshot = baseSnapshot({
      projects: [
        ...base.projects.filter((p) => p._meta.path !== "small-sync"),
        onRequestCard("small-sync", { status: "draft", sector: "charity" }),
      ],
    });
    expect(slugs(reader(false, snapshot).getSectors())).toEqual(["retail"]);
    expect(slugs(reader(true, snapshot).getSectors())).toEqual(["charity", "retail"]);
  });

  it("groups skills in profile order, leaving out unused skills and empty groups", () => {
    const profiles = [profile({ skillGroups: ["Engineering", "Empty", "Architecture"] })];
    const groups = reader(false, baseSnapshot({ profiles })).getSkillGroups();
    expect(groups.map((g) => g.group)).toEqual(["Engineering", "Architecture"]);
    expect(groups[0]?.skills.map((s) => s.skill.slug)).toEqual(["typescript"]);
    expect(slugs(groups[0]?.skills[0]?.projects ?? [])).toEqual(["quiet-ledger"]);
    expect(slugs(groups[1]?.skills[0]?.projects ?? [])).toEqual(["atlas-shop"]);
  });
});

describe("profile and about", () => {
  it("returns the profile without _meta and the about body", () => {
    const content = reader();
    expect(content.getProfile()).toMatchObject({ name: "Ada Example" });
    expect(content.getProfile()).not.toHaveProperty("_meta");
    expect(content.getAbout()).toEqual({ body: { code: "code:about", markdown: "About me." } });
  });
});
