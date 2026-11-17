// Invented test fixtures for the content model suites. Never real client
// detail (spec 0002, "Security model").

import type { Meta } from "@content-collections/core";
import type { ContentSnapshot } from "./check.ts";
import { SECTIONS } from "./rules.ts";
import type {
  RawLens,
  RawOnRequestCard,
  RawOnRequestFlagship,
  RawProfile,
  RawProject,
  RawPublicCard,
  RawPublicFlagship,
  Sections,
} from "./types.ts";

export const meta = (slug: string, extension: string): Meta => ({
  filePath: `${slug}.${extension}`,
  fileName: `${slug}.${extension}`,
  directory: ".",
  path: slug,
  extension,
});

export const sections = (): Sections =>
  Object.fromEntries(
    SECTIONS.map(({ key }) => [key, { code: `code:${key}`, markdown: `About ${key}.` }]),
  ) as Sections;

const shared = {
  status: "published",
  role: "Lead developer",
  sector: "retail",
  categories: ["commerce"],
  stack: ["nextjs"],
  aiTools: [],
} as const;

export const publicFlagship = (
  slug: string,
  overrides: Partial<RawPublicFlagship> = {},
): RawPublicFlagship => ({
  ...shared,
  categories: [...shared.categories],
  stack: [...shared.stack],
  aiTools: [],
  title: `Title ${slug}`,
  summary: `Summary ${slug}`,
  visibility: "public",
  depth: "flagship",
  client: { descriptor: "an invented retailer" },
  period: { start: "2024-01", end: "2024-06" },
  skills: ["system-design"],
  results: [{ value: "2x", label: "faster checkout", source: "invented analytics" }],
  cover: { src: `${slug}/cover.png`, alt: "Invented cover" },
  sections: sections(),
  _meta: meta(slug, "mdx"),
  ...overrides,
});

export const publicCard = (
  slug: string,
  overrides: Partial<RawPublicCard> = {},
): RawPublicCard => ({
  ...shared,
  categories: [...shared.categories],
  stack: [...shared.stack],
  aiTools: [],
  title: `Title ${slug}`,
  summary: `Summary ${slug}`,
  visibility: "public",
  depth: "card",
  client: { descriptor: "an invented studio" },
  period: { start: "2023-01", end: "2023-04" },
  skills: [],
  results: [],
  _meta: meta(slug, "mdx"),
  ...overrides,
});

export const onRequestFlagship = (
  slug: string,
  overrides: Partial<RawOnRequestFlagship> = {},
): RawOnRequestFlagship => ({
  ...shared,
  categories: ["data-platform"],
  stack: ["postgres"],
  aiTools: [],
  title: `Title ${slug}`,
  summary: `Summary ${slug}`,
  visibility: "onRequest",
  depth: "flagship",
  client: { descriptor: "an invented charity" },
  period: { start: "2025-02", end: null },
  skills: ["typescript"],
  results: [{ value: "40k", label: "records moved" }],
  brief: {
    problem: "An invented problem.",
    approach: "An invented approach.",
    outcome: "An invented outcome.",
    ai: "An invented AI note.",
  },
  _meta: meta(slug, "mdx"),
  ...overrides,
});

export const onRequestCard = (
  slug: string,
  overrides: Partial<RawOnRequestCard> = {},
): RawOnRequestCard => ({
  ...shared,
  categories: ["data-platform"],
  stack: ["postgres"],
  aiTools: [],
  title: `Title ${slug}`,
  summary: `Summary ${slug}`,
  visibility: "onRequest",
  depth: "card",
  client: { descriptor: "an invented agency" },
  period: { start: "2022-05", end: "2022-07" },
  skills: [],
  results: [],
  _meta: meta(slug, "mdx"),
  ...overrides,
});

export const lens = (slug: string, overrides: Partial<RawLens> = {}): RawLens => ({
  name: `Lens ${slug}`,
  headline: `Headline ${slug}`,
  intro: `Intro ${slug}`,
  projects: [],
  skills: [],
  _meta: meta(slug, "yaml"),
  ...overrides,
});

export const profile = (overrides: Partial<RawProfile> = {}): RawProfile => ({
  name: "Ada Example",
  roleLine: "Invented role line",
  headline: "Invented headline",
  location: "Nowhere",
  photo: { src: "profile/me.jpg", alt: "An invented portrait" },
  availability: { status: "open" },
  links: [{ kind: "github", url: "https://example.com/ada" }],
  featured: ["atlas-shop", "quiet-ledger"],
  flagshipOrder: ["atlas-shop", "quiet-ledger"],
  lensOrder: ["architect", "developer"],
  skillGroups: ["Architecture", "Engineering"],
  _meta: meta("profile", "yaml"),
  ...overrides,
});

const projectFiles = (projects: readonly RawProject[]) =>
  projects.map((project) => `projects/${project._meta.path}.mdx`);

/**
 * A complete, valid snapshot: two flagships (one public, one on request), a
 * public card, and an on request draft card, in two lenses.
 */
export const baseSnapshot = (overrides: Partial<ContentSnapshot> = {}): ContentSnapshot => {
  const projects = overrides.projects ?? [
    publicFlagship("atlas-shop"),
    publicCard("harbor-tools"),
    onRequestFlagship("quiet-ledger"),
    onRequestCard("small-sync", { status: "draft" }),
  ];
  const lenses = overrides.lenses ?? [
    lens("architect", { projects: ["atlas-shop", "quiet-ledger"], skills: ["system-design"] }),
    lens("developer", { projects: ["harbor-tools", "atlas-shop", "small-sync"] }),
  ];
  const data = {
    projects,
    lenses,
    categories: [
      { name: "Commerce", description: "Selling things", _meta: meta("commerce", "yaml") },
      { name: "Data platform", description: "Moving data", _meta: meta("data-platform", "yaml") },
      { name: "Unused", description: "Nobody uses this", _meta: meta("unused", "yaml") },
    ],
    stack: [
      { name: "Next.js", group: "frontend" as const, _meta: meta("nextjs", "yaml") },
      { name: "Postgres", group: "data" as const, _meta: meta("postgres", "yaml") },
      { name: "Claude", group: "ai" as const, _meta: meta("claude", "yaml") },
    ],
    skills: [
      {
        name: "System design",
        group: "Architecture",
        description: "Shaping systems",
        _meta: meta("system-design", "yaml"),
      },
      {
        name: "TypeScript",
        group: "Engineering",
        description: "Typed code",
        _meta: meta("typescript", "yaml"),
      },
      {
        name: "Unused skill",
        group: "Engineering",
        description: "Nobody uses this",
        _meta: meta("unused-skill", "yaml"),
      },
    ],
    sectors: [
      { name: "Retail", _meta: meta("retail", "yaml") },
      { name: "Charity", _meta: meta("charity", "yaml") },
    ],
    profiles: [profile()],
    abouts: [{ body: { code: "code:about", markdown: "About me." }, _meta: meta("about", "mdx") }],
    ...overrides,
  };
  return {
    ...data,
    files: overrides.files ?? [
      ...projectFiles(data.projects),
      ...data.lenses.map((l) => `lenses/${l._meta.path}.yaml`),
      ...data.categories.map((c) => `categories/${c._meta.path}.yaml`),
      ...data.stack.map((s) => `stack/${s._meta.path}.yaml`),
      ...data.skills.map((s) => `skills/${s._meta.path}.yaml`),
      ...data.sectors.map((s) => `sectors/${s._meta.path}.yaml`),
      "profile.yaml",
      "about.mdx",
      "images/atlas-shop/cover.png",
      "images/profile/me.jpg",
    ],
  };
};
