import { describe, expect, it } from "vitest";
import type { z } from "zod";
import {
  lensSchema,
  profileSchema,
  projectSchema,
  stackSchema,
  withReadableIssues,
} from "./schema.ts";

// Per file rules (AC-2, AC-3, AC-4, AC-10). Inputs are frontmatter as the
// parser hands it over; every fixture is invented.

const issuesOf = async (schema: z.ZodType, input: unknown): Promise<string[]> => {
  const result = await withReadableIssues(schema)["~standard"].validate(input);
  return (result.issues ?? []).map((issue) => `${String(issue.path?.[0])}: ${issue.message}`);
};

const publicFlagship = {
  title: "Invented shop",
  summary: "An invented storefront rebuild.",
  status: "published",
  depth: "flagship",
  visibility: "public",
  client: { descriptor: "an invented retailer", name: "Invented Ltd" },
  role: "Lead developer",
  period: { start: "2024-01", end: "2024-06" },
  sector: "retail",
  categories: ["commerce"],
  stack: ["nextjs"],
  skills: ["system-design"],
  results: [{ value: "2x", label: "faster checkout", source: "invented analytics" }],
  cover: { src: "invented-shop/cover.png", alt: "The shop" },
  content: "## Problem\n\nText.",
};

const publicCard = {
  ...publicFlagship,
  depth: "card",
  cover: undefined,
  skills: undefined,
  results: undefined,
  content: "",
};

const onRequestFlagship = {
  title: "Invented migration",
  summary: "An invented data migration.",
  status: "published",
  depth: "flagship",
  visibility: "onRequest",
  client: { descriptor: "an invented charity" },
  role: "Lead developer",
  period: { start: "2025-02", end: null },
  sector: "charity",
  categories: ["data-platform"],
  stack: ["postgres"],
  skills: ["typescript"],
  brief: {
    problem: "An invented problem.",
    approach: "An invented approach.",
    outcome: "An invented outcome.",
    ai: "An invented AI note.",
  },
  content: "",
};

const { brief: _brief, skills: _skills, ...onRequestShared } = onRequestFlagship;
const onRequestCard = { ...onRequestShared, depth: "card" };

describe("project schema: valid variants", () => {
  it.each([
    ["public flagship", publicFlagship],
    ["public card", publicCard],
    ["on request flagship", onRequestFlagship],
    ["on request card", onRequestCard],
  ])("accepts a complete %s", async (_name, input) => {
    expect(await issuesOf(projectSchema, input)).toEqual([]);
  });

  it("defaults optional lists and normalises a YAML date for updated", () => {
    const result = projectSchema.parse({ ...onRequestCard, updated: new Date("2026-11-17") });
    expect(result.updated).toBe("2026-11-17");
    expect(result.aiTools).toEqual([]);
    expect(result.results).toEqual([]);
  });
});

describe("project schema: on request privacy (AC-2)", () => {
  it.each([
    ["client.name", { client: { descriptor: "an invented charity", name: "Real Name" } }],
    ["links", { links: { repo: "https://example.com/repo" } }],
    ["cover", { cover: { src: "x/cover.png", alt: "x" } }],
    ["screenshots", { screenshots: [] }],
    ["diagram", { diagram: { src: "x/d.svg", alt: "x", description: "x" } }],
    ["results[0].source", { results: [{ value: "1", label: "x", source: "an invoice" }] }],
  ])("rejects %s on an on request flagship, naming the field", async (field, extra) => {
    const issues = await issuesOf(projectSchema, { ...onRequestFlagship, ...extra });
    expect(issues).toEqual([
      expect.stringMatching(new RegExp(`^${escape(field)}: is not allowed`)),
    ]);
  });

  it.each([
    ["client.name", { client: { descriptor: "an invented agency", name: "Real Name" } }],
    ["links", { links: { live: "https://example.com" } }],
    ["cover", { cover: { src: "x/cover.png", alt: "x" } }],
    ["seo", { seo: { title: "x" } }],
    ["brief", { brief: onRequestFlagship.brief }],
  ])("rejects %s on an on request card, naming the field", async (field, extra) => {
    const issues = await issuesOf(projectSchema, { ...onRequestCard, ...extra });
    expect(issues).toEqual([
      expect.stringMatching(new RegExp(`^${escape(field)}: is not allowed`)),
    ]);
  });

  it("rejects an on request flagship without brief.ai", async () => {
    const { ai: _ai, ...brief } = onRequestFlagship.brief;
    expect(await issuesOf(projectSchema, { ...onRequestFlagship, brief })).toEqual([
      "brief.ai: is required",
    ]);
  });

  it("rejects an on request flagship with no brief", async () => {
    expect(await issuesOf(projectSchema, { ...onRequestFlagship, brief: undefined })).toEqual([
      "brief: is required",
    ]);
  });
});

describe("project schema: cards (AC-4)", () => {
  it("rejects a brief on a public card", async () => {
    const issues = await issuesOf(projectSchema, { ...publicCard, brief: onRequestFlagship.brief });
    expect(issues).toEqual(["brief: is not allowed on a public card"]);
  });

  it("rejects a diagram and seo on a public card", async () => {
    const issues = await issuesOf(projectSchema, {
      ...publicCard,
      diagram: { src: "x/d.svg", alt: "x", description: "x" },
      seo: { title: "x" },
    });
    expect(issues).toEqual([
      "diagram: is not allowed on a public card",
      "seo: is not allowed on a public card",
    ]);
  });
});

describe("project schema: public flagship (AC-3)", () => {
  it("requires a cover", async () => {
    expect(await issuesOf(projectSchema, { ...publicFlagship, cover: undefined })).toEqual([
      "cover: is required",
    ]);
  });

  it("requires at least one result", async () => {
    expect(await issuesOf(projectSchema, { ...publicFlagship, results: [] })).toEqual([
      "results: a public flagship needs at least one result",
    ]);
  });

  it("requires a source on every result", async () => {
    const results = [{ value: "2x", label: "faster" }];
    expect(await issuesOf(projectSchema, { ...publicFlagship, results })).toEqual([
      "results[0].source: is required",
    ]);
  });

  it("requires a source on a public card result too", async () => {
    const results = [{ value: "2x", label: "faster" }];
    expect(await issuesOf(projectSchema, { ...publicCard, results })).toEqual([
      "results[0].source: is required",
    ]);
  });

  it("requires at least one skill", async () => {
    expect(await issuesOf(projectSchema, { ...publicFlagship, skills: [] })).toEqual([
      "skills: a flagship needs at least one skill",
    ]);
  });
});

describe("project schema: formats and limits (AC-10)", () => {
  it("rejects a title over 70 characters", async () => {
    expect(await issuesOf(projectSchema, { ...publicFlagship, title: "x".repeat(71) })).toEqual([
      "title: must be at most 70 characters",
    ]);
  });

  it("rejects a summary over 160 characters", async () => {
    expect(await issuesOf(projectSchema, { ...publicCard, summary: "x".repeat(161) })).toEqual([
      "summary: must be at most 160 characters",
    ]);
  });

  it("rejects more than three categories", async () => {
    const categories = ["a", "b", "c", "d"];
    expect(await issuesOf(projectSchema, { ...publicCard, categories })).toEqual([
      "categories: may hold at most 3 categories",
    ]);
  });

  it("shows the expected form for a bad period month", async () => {
    const period = { start: "2024-1", end: null };
    expect(await issuesOf(projectSchema, { ...publicCard, period })).toEqual([
      "period.start: must be a month in YYYY-MM form, for example 2025-03",
    ]);
  });

  it("rejects a period that ends before it starts", async () => {
    const period = { start: "2024-06", end: "2024-05" };
    expect(await issuesOf(projectSchema, { ...publicCard, period })).toEqual([
      "period.end: must not be before start",
    ]);
  });

  it("requires the period end key, null for ongoing", async () => {
    expect(await issuesOf(projectSchema, { ...publicCard, period: { start: "2024-06" } })).toEqual([
      "period.end: is required (use null for ongoing work)",
    ]);
  });

  it("rejects an updated value not in YYYY-MM-DD form", async () => {
    expect(await issuesOf(projectSchema, { ...publicCard, updated: "17/11/2026" })).toEqual([
      "updated: must be a date in YYYY-MM-DD form, for example 2026-11-17",
    ]);
  });

  it("rejects a non kebab case slug reference", async () => {
    expect(await issuesOf(projectSchema, { ...publicCard, sector: "Retail_Sector" })).toEqual([
      "sector: must be a kebab case slug, for example my-project",
    ]);
  });

  it("rejects a non https link", async () => {
    const links = { repo: "http://example.com/repo" };
    expect(await issuesOf(projectSchema, { ...publicCard, links })).toEqual([
      "links.repo: must be an https URL",
    ]);
  });

  it("rejects an empty alt text", async () => {
    const cover = { src: "invented-shop/cover.png", alt: "  " };
    expect(await issuesOf(projectSchema, { ...publicFlagship, cover })).toEqual([
      "cover.alt: must not be empty",
    ]);
  });

  it.each([
    [
      "an absolute path",
      "/invented-shop/cover.png",
      "must be relative to content/images, not absolute",
    ],
    ["a URL", "https://example.com/cover.png", "must be relative to content/images, not absolute"],
    ["..", "invented-shop/../other/cover.png", "must not contain .."],
    ["a gif", "invented-shop/cover.gif", "must end in .png, .jpg, .jpeg, .webp"],
    ["an svg cover", "invented-shop/cover.svg", "must end in .png, .jpg, .jpeg, .webp"],
  ])("rejects an image src that is %s", async (_name, src, message) => {
    const cover = { src, alt: "The shop" };
    expect(await issuesOf(projectSchema, { ...publicFlagship, cover })).toEqual([
      `cover.src: ${message}`,
    ]);
  });

  it("allows an svg diagram", async () => {
    const diagram = { src: "invented-shop/flow.svg", alt: "Flow", description: "How it flows" };
    expect(await issuesOf(projectSchema, { ...publicFlagship, diagram })).toEqual([]);
  });

  it("names an unknown visibility", async () => {
    expect(await issuesOf(projectSchema, { ...publicCard, visibility: "private" })).toEqual([
      "visibility: visibility must be public or onRequest",
    ]);
  });
});

describe("other schemas", () => {
  it("rejects a lens with no projects", async () => {
    const lens = { name: "Lens", headline: "Headline", intro: "Intro", projects: [] };
    expect(await issuesOf(lensSchema, lens)).toEqual([
      "projects: a lens needs at least one project",
    ]);
  });

  it("rejects an unknown stack group", async () => {
    expect(await issuesOf(stackSchema, { name: "Thing", group: "magic" })).toEqual([
      expect.stringMatching(/^group: /),
    ]);
  });

  it("requires the profile photo under profile/", async () => {
    const profile = {
      name: "Ada Example",
      roleLine: "Role",
      headline: "Headline",
      location: "Nowhere",
      photo: { src: "me.jpg", alt: "Portrait" },
      availability: { status: "open" },
      featured: ["a"],
      flagshipOrder: ["a"],
      lensOrder: ["l"],
      skillGroups: ["Engineering"],
    };
    expect(await issuesOf(profileSchema, profile)).toEqual(["photo.src: must start with profile/"]);
  });
});

describe("spec 0004 additions (AC-15)", () => {
  const profile = {
    name: "Ada Example",
    roleLine: "Role",
    headline: "Headline",
    location: "Nowhere",
    photo: { src: "profile/me.jpg", alt: "Portrait" },
    availability: { status: "open" },
    featured: ["a"],
    flagshipOrder: ["a"],
    lensOrder: ["l"],
    skillGroups: ["Engineering"],
  };
  const withFocus = (focus: string) => ({ ...profile, photo: { ...profile.photo, focus } });

  it.each(["50% 25%", "0% 100%", "100% 0%", "7% 93%"])("accepts photo.focus %s", async (focus) => {
    expect(await issuesOf(profileSchema, withFocus(focus))).toEqual([]);
  });

  it.each(["50%", "101% 0%", "50% 25", "center top", "-5% 10%", "050% 25%"])(
    "rejects photo.focus %s",
    async (focus) => {
      expect(await issuesOf(profileSchema, withFocus(focus))).toEqual([
        "photo.focus: must be two percentages from 0 to 100, for example 50% 25%",
      ]);
    },
  );

  it("accepts headlineHighlight up to 60 characters on the profile and a lens", async () => {
    const lens = { name: "Lens", headline: "Headline", intro: "Intro", projects: ["a"] };
    expect(await issuesOf(profileSchema, { ...profile, headlineHighlight: "Head" })).toEqual([]);
    expect(await issuesOf(lensSchema, { ...lens, headlineHighlight: "Head" })).toEqual([]);
    expect(await issuesOf(lensSchema, { ...lens, headlineHighlight: "x".repeat(61) })).toEqual([
      "headlineHighlight: must be at most 60 characters",
    ]);
  });
});

function escape(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
