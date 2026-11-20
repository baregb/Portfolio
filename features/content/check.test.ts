import { describe, expect, it } from "vitest";
import { checkContent, type ContentIssue, type ContentSnapshot } from "./check.ts";
import {
  baseSnapshot,
  lens,
  onRequestCard,
  onRequestFlagship,
  profile,
  publicCard,
  publicFlagship,
  TODAY,
} from "./fixtures.ts";

// Cross file rules (AC-2, AC-5, AC-7, AC-8, AC-10, AC-12), invented fixtures.

const both = [true, false] as const;

const errorsOf = (snapshot: ContentSnapshot, includeDrafts = true): readonly ContentIssue[] => {
  const result = checkContent(snapshot, { includeDrafts, today: TODAY });
  return result.ok ? [] : result.errors;
};

const withProjects = (
  replace: (projects: ContentSnapshot["projects"]) => ContentSnapshot["projects"],
) => {
  const base = baseSnapshot();
  return baseSnapshot({ projects: replace(base.projects), files: base.files });
};

const swapProject = (slug: string, next: ContentSnapshot["projects"][number]) =>
  withProjects((projects) => projects.map((p) => (p._meta.path === slug ? next : p)));

describe("checkContent: the base fixture", () => {
  it.each(both)("passes with includeDrafts=%s", (includeDrafts) => {
    expect(checkContent(baseSnapshot(), { includeDrafts, today: TODAY }).ok).toBe(true);
  });
});

describe("references (AC-5)", () => {
  it.each([
    ["sector", { sector: "space" }, 'unknown sector "space"'],
    ["categories", { categories: ["commerce", "space"] }, 'unknown category "space"'],
    ["stack", { stack: ["nextjs", "space"] }, 'unknown stack entry "space"'],
    ["skills", { skills: ["space"] }, 'unknown skill "space"'],
    ["aiTools", { aiTools: ["space"] }, 'unknown stack entry "space"'],
  ])("fails on an unknown %s slug, naming file, field, and slug", (field, extra, message) => {
    const errors = errorsOf(swapProject("atlas-shop", publicFlagship("atlas-shop", extra)));
    expect(errors).toEqual([{ file: "content/projects/atlas-shop.mdx", field, message }]);
  });

  it("fails on an unknown lens project and skill", () => {
    const base = baseSnapshot();
    const lenses = [
      lens("architect", { projects: ["atlas-shop", "ghost"], skills: ["ghost-skill"] }),
      ...base.lenses.slice(1),
    ];
    expect(errorsOf(baseSnapshot({ lenses, files: base.files }))).toEqual([
      {
        file: "content/lenses/architect.yaml",
        field: "projects",
        message: 'unknown project "ghost"',
      },
      {
        file: "content/lenses/architect.yaml",
        field: "skills",
        message: 'unknown skill "ghost-skill"',
      },
    ]);
  });

  it("fails on unknown profile featured, flagshipOrder, and lensOrder slugs", () => {
    const profiles = [
      profile({
        featured: ["atlas-shop", "ghost"],
        flagshipOrder: ["atlas-shop", "quiet-ledger", "ghost"],
        lensOrder: ["architect", "developer", "ghost-lens"],
      }),
    ];
    const fields = errorsOf(baseSnapshot({ profiles })).map((e) => [e.field, e.message]);
    expect(fields).toEqual([
      ["featured", 'unknown project "ghost"'],
      ["flagshipOrder", 'unknown project "ghost"'],
      ["lensOrder", 'unknown lens "ghost-lens"'],
    ]);
  });

  it("fails on a skill group missing from profile skillGroups", () => {
    const profiles = [profile({ skillGroups: ["Architecture"] })];
    expect(errorsOf(baseSnapshot({ profiles }))).toEqual([
      expect.objectContaining({ file: "content/skills/typescript.yaml", field: "group" }),
      expect.objectContaining({ file: "content/skills/unused-skill.yaml", field: "group" }),
    ]);
  });

  it("fails on an aiTools entry whose group is not ai", () => {
    const next = publicFlagship("atlas-shop", { aiTools: ["postgres"] });
    expect(errorsOf(swapProject("atlas-shop", next))).toEqual([
      {
        file: "content/projects/atlas-shop.mdx",
        field: "aiTools",
        message: '"postgres" is not a stack entry with group: ai',
      },
    ]);
  });

  it("fails on a slug in both stack and aiTools", () => {
    const next = publicFlagship("atlas-shop", { stack: ["nextjs", "claude"], aiTools: ["claude"] });
    expect(errorsOf(swapProject("atlas-shop", next))).toEqual([
      expect.objectContaining({
        field: "aiTools",
        message: expect.stringMatching(/also in stack/),
      }),
    ]);
  });

  it("fails on a duplicate in a list", () => {
    const next = publicFlagship("atlas-shop", { categories: ["commerce", "commerce"] });
    expect(errorsOf(swapProject("atlas-shop", next))).toEqual([
      expect.objectContaining({
        field: "categories",
        message: '"commerce" is listed more than once',
      }),
    ]);
  });

  it("fails on a profile link kind used twice", () => {
    const links = [
      { kind: "github" as const, url: "https://example.com/a" },
      { kind: "github" as const, url: "https://example.com/b" },
    ];
    expect(errorsOf(baseSnapshot({ profiles: [profile({ links })] }))).toEqual([
      expect.objectContaining({ field: "links", message: '"github" is listed more than once' }),
    ]);
  });
});

describe("featured and flagshipOrder (AC-8)", () => {
  it.each(both)("fails when flagshipOrder misses a draft flagship (includeDrafts=%s)", (mode) => {
    const snapshot = withProjects((projects) => [
      ...projects,
      onRequestFlagship("hidden-draft", { status: "draft" }),
    ]);
    const files = [...snapshot.files, "projects/hidden-draft.mdx"];
    expect(errorsOf({ ...snapshot, files }, mode)).toContainEqual({
      file: "content/profile.yaml",
      field: "flagshipOrder",
      message: 'flagship "hidden-draft" is missing (drafts included)',
    });
  });

  it("fails on a duplicate in flagshipOrder", () => {
    const profiles = [profile({ flagshipOrder: ["atlas-shop", "quiet-ledger", "atlas-shop"] })];
    expect(errorsOf(baseSnapshot({ profiles }))).toEqual([
      expect.objectContaining({
        field: "flagshipOrder",
        message: '"atlas-shop" is listed more than once',
      }),
    ]);
  });

  it("fails on a card in flagshipOrder or featured", () => {
    const profiles = [
      profile({
        featured: ["atlas-shop", "harbor-tools"],
        flagshipOrder: ["atlas-shop", "quiet-ledger", "harbor-tools"],
      }),
    ];
    expect(errorsOf(baseSnapshot({ profiles })).map((e) => e.field)).toEqual([
      "featured",
      "flagshipOrder",
    ]);
  });

  it("fails when lensOrder misses a lens", () => {
    const profiles = [profile({ lensOrder: ["architect"] })];
    expect(errorsOf(baseSnapshot({ profiles }))).toEqual([
      expect.objectContaining({ field: "lensOrder", message: 'lens "developer" is missing' }),
    ]);
  });
});

describe("drafts (AC-7)", () => {
  it("drops a draft named in a lens with a warning in production mode", () => {
    const result = checkContent(baseSnapshot(), { includeDrafts: false, today: TODAY });
    expect(result.warnings).toEqual([
      {
        file: "content/lenses/developer.yaml",
        field: "projects",
        message: 'draft "small-sync" is dropped in production (drafts excluded)',
      },
    ]);
  });

  it("keeps drafts without warnings in draft mode", () => {
    expect(checkContent(baseSnapshot(), { includeDrafts: true, today: TODAY }).warnings).toEqual(
      [],
    );
  });

  it("fails in production when a lens holds only drafts", () => {
    const base = baseSnapshot();
    const lenses = [...base.lenses, lens("drafts-only", { projects: ["small-sync"] })];
    const profiles = [profile({ lensOrder: ["architect", "developer", "drafts-only"] })];
    const snapshot = baseSnapshot({
      lenses,
      profiles,
      files: [...base.files, "lenses/drafts-only.yaml"],
    });
    expect(errorsOf(snapshot, true)).toEqual([]);
    expect(errorsOf(snapshot, false)).toEqual([
      {
        file: "content/lenses/drafts-only.yaml",
        field: "projects",
        message: "lens has no projects in production (drafts excluded)",
      },
    ]);
  });

  it("fails in production with no featured project and no flagship left", () => {
    const snapshot = withProjects((projects) =>
      projects.map((p) => (p.depth === "flagship" ? { ...p, status: "draft" as const } : p)),
    );
    expect(errorsOf(snapshot, true)).toEqual([]);
    expect(errorsOf(snapshot, false).map((e) => e.message)).toEqual([
      "lens has no projects in production (drafts excluded)",
      "no featured project remains in production (drafts excluded)",
      "no flagship remains in production (drafts excluded)",
    ]);
  });

  it("fails in production with no lens", () => {
    const base = baseSnapshot();
    const snapshot = baseSnapshot({
      lenses: [],
      profiles: [profile({ lensOrder: [] })],
      files: base.files.filter((f) => !f.startsWith("lenses/")),
    });
    expect(errorsOf(snapshot, false)).toEqual([
      { file: "content/lenses", message: "no lens remains in production (drafts excluded)" },
    ]);
  });
});

describe("files and images (AC-2, AC-10, AC-12)", () => {
  const withFiles = (change: (files: readonly string[]) => readonly string[]) =>
    baseSnapshot({ files: change(baseSnapshot().files) });

  it("fails on a stray file", () => {
    expect(errorsOf(withFiles((files) => [...files, "projects/notes.md"]))).toEqual([
      { file: "content/projects/notes.md", message: "matches no collection and is not an image" },
    ]);
  });

  it("allows the CV at content/cv/cv.pdf and nothing else in content/cv", () => {
    expect(errorsOf(baseSnapshot())).toEqual([]);
    expect(errorsOf(withFiles((files) => [...files, "cv/old.pdf"]))).toEqual([
      { file: "content/cv/old.pdf", message: "matches no collection and is not an image" },
    ]);
  });

  it.each(both)("only warns when the CV is missing (includeDrafts=%s)", (includeDrafts) => {
    const result = checkContent(
      withFiles((files) => files.filter((file) => file !== "cv/cv.pdf")),
      { includeDrafts, today: TODAY },
    );
    expect(result.ok).toBe(true);
    expect(result.warnings).toContainEqual({
      file: "content/cv/cv.pdf",
      message:
        'is missing: the CV button shows "CV coming soon", and a production build fails until you add it',
    });
  });

  it("fails on an orphan image", () => {
    expect(errorsOf(withFiles((files) => [...files, "images/atlas-shop/old.png"]))).toEqual([
      {
        file: "content/images/atlas-shop/old.png",
        message: "image is not referenced by any project, the profile, or a testimonial",
      },
    ]);
  });

  it("fails on an image folder for an on request project", () => {
    expect(errorsOf(withFiles((files) => [...files, "images/quiet-ledger/a.png"]))).toEqual([
      {
        file: "content/images/quiet-ledger/a.png",
        message: 'on request project "quiet-ledger" must have no images',
      },
    ]);
  });

  it("fails on an image src outside the project's folder", () => {
    const next = publicFlagship("atlas-shop", {
      cover: { src: "harbor-tools/cover.png", alt: "Cover" },
    });
    const snapshot = swapProject("atlas-shop", next);
    const files = [...snapshot.files, "images/harbor-tools/cover.png"];
    expect(errorsOf({ ...snapshot, files })).toContainEqual({
      file: "content/projects/atlas-shop.mdx",
      field: "cover.src",
      message: "must start with atlas-shop/",
    });
  });

  it("fails on a missing image file", () => {
    const next = publicCard("harbor-tools", {
      screenshots: [{ src: "harbor-tools/one.webp", alt: "One" }],
    });
    expect(errorsOf(swapProject("harbor-tools", next))).toEqual([
      {
        file: "content/projects/harbor-tools.mdx",
        field: "screenshots[0].src",
        message: "names a missing file: content/images/harbor-tools/one.webp",
      },
    ]);
  });

  it("fails on a missing profile photo", () => {
    expect(
      errorsOf(withFiles((files) => files.filter((f) => f !== "images/profile/me.jpg"))),
    ).toEqual([
      {
        file: "content/profile.yaml",
        field: "photo.src",
        message: "names a missing file: content/images/profile/me.jpg",
      },
    ]);
  });

  it("fails on a collection file that did not build", () => {
    expect(errorsOf(withFiles((files) => [...files, "projects/broken.mdx"]))).toEqual([
      {
        file: "content/projects/broken.mdx",
        message: "did not build; see the content build errors above",
      },
    ]);
  });

  it("fails on a non kebab case filename", () => {
    const errors = errorsOf(withFiles((files) => [...files, "sectors/Big_Sector.yaml"]));
    expect(errors[0]).toEqual({
      file: "content/sectors/Big_Sector.yaml",
      message: 'slug "Big_Sector" must be kebab case, for example my-project',
    });
  });

  it("fails on a project slug of profile", () => {
    const snapshot = withProjects((projects) => [...projects, onRequestCard("profile")]);
    expect(errorsOf(snapshot)).toContainEqual({
      file: "content/projects/profile.mdx",
      message: '"profile" is reserved and can\'t be a project slug',
    });
  });

  it("fails without exactly one profile and one about", () => {
    const errors = errorsOf(baseSnapshot({ profiles: [], abouts: [] }));
    expect(errors.map((e) => e.message)).toEqual(
      expect.arrayContaining([
        "there must be exactly one profile, found 0",
        "there must be exactly one about page, found 0",
      ]),
    );
  });
});

describe("headline highlights (spec 0004, AC-15)", () => {
  it("passes when the phrase appears once in the headline", () => {
    const profiles = [
      profile({ headline: "I build shops end to end", headlineHighlight: "end to end" }),
    ];
    const lenses = baseSnapshot().lenses.map((l) => ({
      ...l,
      headline: "Shapes systems well",
      headlineHighlight: "systems",
    }));
    expect(errorsOf(baseSnapshot({ profiles, lenses }))).toEqual([]);
  });

  it("fails, naming the profile, when the phrase is missing", () => {
    const profiles = [profile({ headline: "Invented headline", headlineHighlight: "nowhere" })];
    expect(errorsOf(baseSnapshot({ profiles }))).toEqual([
      {
        file: "content/profile.yaml",
        field: "headlineHighlight",
        message: '"nowhere" must appear exactly once in headline (found 0 times)',
      },
    ]);
  });

  it("fails, naming the lens file, when the phrase appears twice", () => {
    const lenses = baseSnapshot().lenses.map((l) =>
      l._meta.path === "architect"
        ? { ...l, headline: "Data in, data out", headlineHighlight: "data" }
        : l,
    );
    expect(errorsOf(baseSnapshot({ lenses }))).toEqual([]);
    const twice = baseSnapshot().lenses.map((l) =>
      l._meta.path === "architect"
        ? { ...l, headline: "data in, data out", headlineHighlight: "data" }
        : l,
    );
    expect(errorsOf(baseSnapshot({ lenses: twice }))).toEqual([
      {
        file: "content/lenses/architect.yaml",
        field: "headlineHighlight",
        message: '"data" must appear exactly once in headline (found 2 times)',
      },
    ]);
  });
});
