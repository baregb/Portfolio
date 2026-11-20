import { describe, expect, it } from "vitest";
import type { z } from "zod";
import { checkContent, type ContentIssue, type ContentSnapshot } from "./check.ts";
import {
  baseSnapshot,
  lens,
  onRequestCard,
  onRequestFlagship,
  profile,
  publicCard,
  publicFlagship,
  service,
  testimonial,
  TODAY,
} from "./fixtures.ts";
import { createContentReader } from "./read.ts";
import { serviceFallbackTitle, splitRef } from "./rules.ts";
import {
  lensSchema,
  projectSchema,
  serviceSchema,
  testimonialSchema,
  withReadableIssues,
} from "./schema.ts";

// Spec 0006, AC-1 to AC-5: services, testimonials, result ids and refs, the
// profile additions, and how drafts drop. Every fixture is invented.

const issuesOf = async (schema: z.ZodType, input: unknown): Promise<string[]> => {
  const result = await withReadableIssues(schema)["~standard"].validate(input);
  return (result.issues ?? []).map((issue) => `${String(issue.path?.[0])}: ${issue.message}`);
};

const check = (snapshot: ContentSnapshot, includeDrafts = true) =>
  checkContent(snapshot, { includeDrafts, today: TODAY });
const errorsOf = (snapshot: ContentSnapshot, includeDrafts = true): readonly ContentIssue[] => {
  const result = check(snapshot, includeDrafts);
  return result.ok ? [] : result.errors;
};

// A published atlas-shop with two results that carry ids, and quiet-ledger
// (on request) with one, so refs have something to point at.
const withIds = (overrides: Partial<ContentSnapshot> = {}) => {
  const base = baseSnapshot();
  const projects = base.projects.map((project) => {
    if (project._meta.path === "atlas-shop" && project.visibility === "public") {
      return {
        ...project,
        results: [
          { id: "checkout", value: "2x", label: "faster checkout", source: "invented analytics" },
          { id: "seo-score", value: "100", label: "SEO score", source: "invented audit" },
        ],
      };
    }
    if (project._meta.path === "quiet-ledger" && project.visibility === "onRequest") {
      return { ...project, results: [{ id: "records", value: "40k", label: "records moved" }] };
    }
    return project;
  });
  return baseSnapshot({ projects, ...overrides });
};

const withServices = (
  services: ContentSnapshot["services"],
  extra: Partial<ContentSnapshot> = {},
  profileOverrides: Parameters<typeof profile>[0] = {},
) =>
  withIds({
    services,
    profiles: [profile({ serviceOrder: services.map((s) => s._meta.path), ...profileOverrides })],
    ...extra,
  });

describe("schemas (AC-1 to AC-4)", () => {
  const validService = {
    status: "draft",
    name: "Web performance and SEO",
    tagline: "Faster pages. Found pages.",
    headline: "Speed and search fixed in the code.",
    intro: "An invented intro.",
    offerings: [
      { title: "Audits", description: "Find what is slow." },
      { title: "Fixes", description: "Make it fast." },
      { title: "Search", description: "Make it found." },
    ],
    projects: ["atlas-shop"],
  };

  it("accepts a service and defaults trackRecord and faq to empty", async () => {
    expect(await issuesOf(serviceSchema, validService)).toEqual([]);
  });

  it("needs 3 to 4 offerings", async () => {
    expect(
      await issuesOf(serviceSchema, {
        ...validService,
        offerings: validService.offerings.slice(1),
      }),
    ).toEqual(["offerings: needs at least 3 offerings"]);
  });

  it("caps the track record at 3 and the FAQ at 6", async () => {
    const refs = ["a/one", "a/two", "a/three", "a/four"];
    const faq = Array.from({ length: 7 }, (_, i) => ({ question: `Q${i}`, answer: "A" }));
    expect(await issuesOf(serviceSchema, { ...validService, trackRecord: refs, faq })).toEqual([
      "trackRecord: may hold at most 3 results",
      "faq: may hold at most 6 questions",
    ]);
  });

  it("rejects a ref that is not <project>/<id>", async () => {
    expect(
      await issuesOf(lensSchema, {
        name: "L",
        headline: "H",
        intro: "I",
        projects: ["a"],
        trackRecord: ["just-a-project"],
      }),
    ).toEqual([
      "trackRecord[0]: must be <project-slug>/<result-id>, for example my-project/seo-score",
    ]);
  });

  it("accepts a result id on public and on request results, and rejects a bad one", async () => {
    const card = {
      title: "T",
      summary: "S",
      status: "published",
      role: "R",
      period: { start: "2024-01", end: null },
      sector: "retail",
      categories: ["commerce"],
      stack: ["nextjs"],
      content: "",
    };
    const publicCardInput = {
      ...card,
      visibility: "public",
      depth: "card",
      client: { descriptor: "d" },
      results: [{ id: "speed", value: "1", label: "l", source: "s" }],
    };
    const onRequestInput = {
      ...card,
      visibility: "onRequest",
      depth: "card",
      client: { descriptor: "d" },
      results: [{ id: "rows", value: "1", label: "l" }],
    };
    expect(await issuesOf(projectSchema, publicCardInput)).toEqual([]);
    expect(await issuesOf(projectSchema, onRequestInput)).toEqual([]);
    expect(
      await issuesOf(projectSchema, {
        ...publicCardInput,
        results: [{ id: "Bad Id", value: "1", label: "l", source: "s" }],
      }),
    ).toEqual(["results[0].id: must be a kebab case id, for example seo-score"]);
  });

  it("needs a permission date on a testimonial and allows an empty photo alt", async () => {
    expect(await issuesOf(testimonialSchema, { quote: "Q", name: "N" })).toEqual([
      "permission: is required",
    ]);
    expect(
      await issuesOf(testimonialSchema, {
        quote: "Q",
        name: "N",
        permission: new Date("2026-01-02"),
        photo: { src: "testimonials/n.jpg", alt: "" },
      }),
    ).toEqual([]);
    expect(
      await issuesOf(testimonialSchema, {
        quote: "Q",
        name: "N",
        permission: "2026-01-02",
        photo: { src: "people/n.jpg", alt: "" },
      }),
    ).toEqual(["photo.src: must start with testimonials/"]);
  });
});

describe("cross file checks (AC-1 to AC-4)", () => {
  it("passes a service with good refs, projects, and order", () => {
    const snapshot = withServices([
      service("speed", { trackRecord: ["atlas-shop/seo-score", "quiet-ledger/records"] }),
    ]);
    expect(errorsOf(snapshot)).toEqual([]);
  });

  it("fails on unknown projects, unknown result ids, and repeated refs", () => {
    const snapshot = withServices([
      service("speed", {
        projects: ["atlas-shop", "ghost"],
        trackRecord: [
          "ghost/one",
          "atlas-shop/nope",
          "atlas-shop/seo-score",
          "atlas-shop/seo-score",
        ],
      }),
    ]);
    expect(errorsOf(snapshot)).toEqual([
      {
        file: "content/services/speed.yaml",
        field: "projects",
        message: 'unknown project "ghost"',
      },
      {
        file: "content/services/speed.yaml",
        field: "trackRecord",
        message: '"ghost/one" names an unknown project "ghost"',
      },
      {
        file: "content/services/speed.yaml",
        field: "trackRecord",
        message: '"atlas-shop/nope" names no result with id "nope" in atlas-shop',
      },
      {
        file: "content/services/speed.yaml",
        field: "trackRecord",
        message: '"atlas-shop/seo-score" is listed more than once',
      },
    ]);
  });

  it("checks lens track records the same way", () => {
    const snapshot = withIds({
      lenses: [
        lens("architect", { projects: ["atlas-shop"], trackRecord: ["atlas-shop/missing"] }),
        lens("developer", { projects: ["harbor-tools"] }),
      ],
    });
    expect(errorsOf(snapshot)).toEqual([
      {
        file: "content/lenses/architect.yaml",
        field: "trackRecord",
        message: '"atlas-shop/missing" names no result with id "missing" in atlas-shop',
      },
    ]);
  });

  it("fails when two results in one project share an id", () => {
    const snapshot = baseSnapshot({
      projects: [
        publicFlagship("atlas-shop", {
          results: [
            { id: "same", value: "1", label: "a", source: "s" },
            { id: "same", value: "2", label: "b", source: "s" },
          ],
        }),
        onRequestFlagship("quiet-ledger"),
        publicCard("harbor-tools"),
        onRequestCard("small-sync", { status: "draft" }),
      ],
    });
    expect(errorsOf(snapshot)).toEqual([
      {
        file: "content/projects/atlas-shop.mdx",
        field: "results[0].id",
        message: 'id "same" is used by more than one result',
      },
    ]);
  });

  it("needs every service in serviceOrder, and only real ones", () => {
    const snapshot = withServices(
      [service("speed"), service("apps")],
      {},
      {
        serviceOrder: ["speed", "ghost"],
      },
    );
    expect(errorsOf(snapshot)).toEqual([
      { file: "content/profile.yaml", field: "serviceOrder", message: 'unknown service "ghost"' },
      {
        file: "content/profile.yaml",
        field: "serviceOrder",
        message: 'service "apps" is missing (drafts included)',
      },
    ]);
  });

  it("checks service and profile services highlights", () => {
    const snapshot = withServices(
      [service("speed", { headlineHighlight: "absent" })],
      {},
      {
        services: { headline: "Fast sites", headlineHighlight: "slow", intro: "Intro" },
      },
    );
    expect(errorsOf(snapshot)).toEqual([
      {
        file: "content/profile.yaml",
        field: "services.headlineHighlight",
        message: '"slow" must appear exactly once in headline (found 0 times)',
      },
      {
        file: "content/services/speed.yaml",
        field: "headlineHighlight",
        message: '"absent" must appear exactly once in headline (found 0 times)',
      },
    ]);
  });

  it("asks for seo.title when the fallback title is over 70 characters", () => {
    const name = "A very long service name for testing titles";
    const title = serviceFallbackTitle(name, "Somewhere");
    expect(title.length).toBeGreaterThan(70);
    expect(errorsOf(withServices([service("long", { name })]))).toEqual([
      {
        file: "content/services/long.yaml",
        field: "seo.title",
        message: `is required: the title "${title}" is longer than 70 characters`,
      },
    ]);
    expect(
      errorsOf(withServices([service("long", { name, seo: { title: "Short title" } })])),
    ).toEqual([]);
  });

  it("refuses a permission dated after today, and unknown projects", () => {
    const snapshot = withIds({
      testimonials: [testimonial("ana", { permission: "2026-06-02", project: "ghost" })],
    });
    expect(errorsOf(snapshot)).toEqual([
      {
        file: "content/testimonials/ana.yaml",
        field: "permission",
        message: "2026-06-02 is in the future (today is 2026-06-01)",
      },
      {
        file: "content/testimonials/ana.yaml",
        field: "project",
        message: 'unknown project "ghost"',
      },
    ]);
    expect(
      errorsOf(withIds({ testimonials: [testimonial("ana", { permission: TODAY })] })),
    ).toEqual([]);
  });

  it("keeps a private client private: no company or photo on an on request quote", () => {
    const snapshot = withIds({
      testimonials: [
        testimonial("ana", {
          project: "quiet-ledger",
          company: "Invented Charity",
          photo: { src: "testimonials/ana.jpg", alt: "" },
        }),
      ],
      files: [...withIds().files, "testimonials/ana.yaml", "images/testimonials/ana.jpg"],
    });
    expect(errorsOf(snapshot)).toEqual([
      {
        file: "content/testimonials/ana.yaml",
        field: "company",
        message: 'must be left out: "quiet-ledger" is on request',
      },
      {
        file: "content/testimonials/ana.yaml",
        field: "photo",
        message: 'must be left out: "quiet-ledger" is on request',
      },
    ]);
  });

  it("checks client logos: file on disk, permission, and never an on request client", () => {
    const snapshot = withIds({
      profiles: [
        profile({
          clients: [
            {
              name: "Atlas",
              logo: "clients/atlas.svg",
              permission: "2026-01-01",
              project: "atlas-shop",
            },
            {
              name: "Ledger",
              logo: "clients/ledger.svg",
              permission: "2027-01-01",
              project: "quiet-ledger",
            },
          ],
        }),
      ],
      files: [...withIds().files, "images/clients/atlas.svg"],
    });
    expect(errorsOf(snapshot)).toEqual([
      {
        file: "content/profile.yaml",
        field: "clients[1].logo",
        message: "names a missing file: content/images/clients/ledger.svg",
      },
      {
        file: "content/profile.yaml",
        field: "clients[1].permission",
        message: "2027-01-01 is in the future (today is 2026-06-01)",
      },
      {
        file: "content/profile.yaml",
        field: "clients[1].project",
        message: '"quiet-ledger" is on request, so its client must not be named',
      },
    ]);
  });

  it("counts testimonial photos and logos as referenced images", () => {
    const snapshot = withIds({
      testimonials: [testimonial("ana", { photo: { src: "testimonials/ana.jpg", alt: "" } })],
      profiles: [
        profile({ clients: [{ name: "Atlas", logo: "clients/atlas.svg", permission: TODAY }] }),
      ],
      files: [
        ...withIds().files,
        "testimonials/ana.yaml",
        "images/testimonials/ana.jpg",
        "images/clients/atlas.svg",
      ],
    });
    expect(errorsOf(snapshot)).toEqual([]);
  });

  it("checks featuredTestimonials names real quotes", () => {
    const snapshot = withIds({
      testimonials: [testimonial("ana")],
      profiles: [profile({ featuredTestimonials: ["ana", "ghost"] })],
    });
    expect(errorsOf(snapshot)).toEqual([
      {
        file: "content/profile.yaml",
        field: "featuredTestimonials",
        message: 'unknown testimonial "ghost"',
      },
    ]);
  });

  it("reserves the testimonials and clients image folders", () => {
    const projects = [...withIds().projects, publicCard("clients")];
    expect(errorsOf(withIds({ projects }))).toContainEqual({
      file: "content/projects/clients.mdx",
      message: '"clients" is reserved and can\'t be a project slug',
    });
  });
});

describe("drafts in production (AC-5)", () => {
  const draftProjects = () => [
    publicFlagship("atlas-shop", {
      results: [{ id: "seo-score", value: "100", label: "SEO", source: "s" }],
    }),
    onRequestFlagship("quiet-ledger"),
    publicCard("harbor-tools"),
    onRequestCard("small-sync", {
      status: "draft",
      results: [{ id: "rows", value: "9", label: "l" }],
    }),
  ];

  it("warns for each draft a published service, lens, or quote points at", () => {
    const snapshot = baseSnapshot({
      projects: draftProjects(),
      lenses: [
        lens("architect", { projects: ["atlas-shop"], trackRecord: ["small-sync/rows"] }),
        lens("developer", { projects: ["harbor-tools"] }),
      ],
      services: [
        service("speed", {
          projects: ["atlas-shop", "small-sync"],
          trackRecord: ["small-sync/rows"],
        }),
        service("rebuilds", { projects: ["small-sync"] }),
        service("later", { status: "draft", projects: ["small-sync"] }),
      ],
      testimonials: [testimonial("ana", { project: "small-sync" })],
      profiles: [
        profile({ serviceOrder: ["speed", "rebuilds", "later"], featuredTestimonials: ["ana"] }),
      ],
    });
    const result = check(snapshot, false);
    expect(result.ok).toBe(true);
    const dropped = 'draft "small-sync" is dropped in production (drafts excluded)';
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        { file: "content/lenses/architect.yaml", field: "trackRecord", message: dropped },
        { file: "content/services/speed.yaml", field: "projects", message: dropped },
        { file: "content/services/speed.yaml", field: "trackRecord", message: dropped },
        { file: "content/services/rebuilds.yaml", field: "projects", message: dropped },
        {
          file: "content/services/rebuilds.yaml",
          field: "projects",
          message: "service has no projects, so it is dropped in production (drafts excluded)",
        },
        { file: "content/testimonials/ana.yaml", field: "project", message: dropped },
        {
          file: "content/profile.yaml",
          field: "serviceOrder",
          message: 'draft "later" is dropped in production (drafts excluded)',
        },
        {
          file: "content/profile.yaml",
          field: "featuredTestimonials",
          message: '"ana" is dropped in production (drafts excluded): its project is a draft',
        },
      ]),
    );
    // A draft service's own projects never warn: the whole service drops.
    expect(result.warnings.filter((w) => w.file === "content/services/later.yaml")).toEqual([]);
  });

  it("drops the same things from the read layer, silently", () => {
    const snapshot = baseSnapshot({
      projects: draftProjects(),
      lenses: [
        lens("architect", {
          projects: ["atlas-shop"],
          trackRecord: ["small-sync/rows", "atlas-shop/seo-score"],
        }),
        lens("developer", { projects: ["harbor-tools"] }),
      ],
      services: [
        service("speed", { projects: ["atlas-shop", "small-sync"] }),
        service("rebuilds", { projects: ["small-sync"] }),
        service("later", { status: "draft" }),
      ],
      testimonials: [testimonial("ana", { project: "small-sync" }), testimonial("bo")],
      profiles: [
        profile({
          serviceOrder: ["speed", "rebuilds", "later"],
          featuredTestimonials: ["ana", "bo"],
        }),
      ],
    });
    const production = createContentReader(snapshot, false);
    expect(production.getServices().map((s) => s.slug)).toEqual(["speed"]);
    expect(production.getServices()[0]?.projects.map((p) => p.slug)).toEqual(["atlas-shop"]);
    expect(production.getLens("architect")?.trackRecord).toHaveLength(1);
    expect(production.getFeaturedTestimonials().map((t) => t.slug)).toEqual(["bo"]);

    const drafts = createContentReader(snapshot, true);
    expect(drafts.getServices().map((s) => s.slug)).toEqual(["speed", "rebuilds", "later"]);
    expect(drafts.getFeaturedTestimonials().map((t) => t.slug)).toEqual(["ana", "bo"]);
  });
});

describe("read layer (AC-6, AC-8, AC-16)", () => {
  const snapshot = withServices(
    [
      service("speed", {
        projects: ["harbor-tools", "atlas-shop"],
        trackRecord: ["atlas-shop/seo-score", "quiet-ledger/records"],
        faq: [{ question: "Q?", answer: "A." }],
      }),
    ],
    {
      testimonials: [
        testimonial("zed", { project: "atlas-shop", role: "Founder", company: "Atlas" }),
        testimonial("amy", { project: "atlas-shop" }),
        testimonial("hal", { project: "harbor-tools" }),
        testimonial("solo"),
      ],
    },
  );
  const reader = createContentReader(snapshot, true);

  it("resolves a track record to title, link, and result, never the source", () => {
    expect(reader.getService("speed")?.trackRecord).toEqual([
      {
        project: { title: "Title atlas-shop", href: "/work/atlas-shop" },
        result: { value: "100", label: "SEO score" },
      },
      {
        project: { title: "Title quiet-ledger", href: "/work/quiet-ledger" },
        result: { value: "40k", label: "records moved" },
      },
    ]);
  });

  it("links a card's result to nothing", () => {
    const cardSnapshot = withServices([service("s", { trackRecord: ["harbor-tools/fast"] })], {
      projects: [
        ...withIds().projects.filter((p) => p._meta.path !== "harbor-tools"),
        publicCard("harbor-tools", {
          results: [{ id: "fast", value: "3x", label: "faster", source: "s", context: "C" }],
        }),
      ],
    });
    expect(createContentReader(cardSnapshot, true).getService("s")?.trackRecord).toEqual([
      {
        project: { title: "Title harbor-tools", href: null },
        result: { value: "3x", label: "faster", context: "C" },
      },
    ]);
  });

  it("orders a page's quotes by its project order, then by file name", () => {
    expect(reader.getService("speed")?.testimonials.map((t) => t.slug)).toEqual([
      "hal",
      "amy",
      "zed",
    ]);
    expect(reader.getTestimonialsFor("atlas-shop").map((t) => t.slug)).toEqual(["amy", "zed"]);
  });

  it("keeps permission out of the quote pages read", () => {
    expect(reader.getTestimonialsFor("atlas-shop")[1]).toEqual({
      slug: "zed",
      quote: "An invented quote from zed.",
      name: "Person zed",
      role: "Founder",
      company: "Atlas",
      project: "atlas-shop",
    });
  });

  it("builds the service title from profile.base unless seo.title is set", () => {
    expect(reader.getService("speed")?.seoTitle).toBe(
      "Service speed in Somewhere, working worldwide",
    );
    expect(reader.getService("speed")?.seoDescription).toBe("Headline speed");
  });

  it("splits refs into project and id", () => {
    expect(splitRef("atlas-shop/seo-score")).toEqual({ project: "atlas-shop", id: "seo-score" });
  });
});
