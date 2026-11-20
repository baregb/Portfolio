import { z } from "zod";
import {
  CLIENT_IMAGE_FOLDER,
  DIAGRAM_EXTENSIONS,
  IMAGE_EXTENSIONS,
  PROFILE_IMAGE_FOLDER,
  RESULT_REF_PATTERN,
  SLUG_PATTERN,
  STACK_GROUPS,
  TESTIMONIAL_IMAGE_FOLDER,
  TITLE_MAX,
} from "./rules.ts";

// Per file rules for every collection (spec 0002, "Data model sketch"). Every
// object is strict, so an unknown or forbidden key fails instead of being
// dropped. Cross file rules (references, ordering, drafts, images on disk)
// live in `check.ts`.

type RawIssue = { readonly code?: string; readonly input?: unknown };

// "is required" reads better than "expected string, received undefined".
const requiredMessage = (issue: RawIssue): string | undefined =>
  issue.input === undefined ? "is required" : undefined;

const text = (max: number) =>
  z
    .string({ error: requiredMessage })
    .trim()
    .min(1, "must not be empty")
    .max(max, `must be at most ${max} characters`);

const slug = z
  .string({ error: requiredMessage })
  .regex(SLUG_PATTERN, "must be a kebab case slug, for example my-project");

const slugs = z.array(slug, { error: requiredMessage });

const month = z
  .string({
    error: (issue: RawIssue) =>
      issue.input === undefined
        ? "is required (use null for ongoing work)"
        : "must be a month in YYYY-MM form, for example 2025-03",
  })
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "must be a month in YYYY-MM form, for example 2025-03");

const httpsUrl = z.url({
  protocol: /^https$/,
  error: (issue: RawIssue) => requiredMessage(issue) ?? "must be an https URL",
});

/**
 * A strict object whose unknown keys fail with a message naming where they
 * are not allowed, for example "is not allowed on an on request project".
 */
const strict = <T extends z.ZodRawShape>(shape: T, where: string) =>
  z.strictObject(shape, {
    error: (issue: RawIssue) =>
      issue.code === "unrecognized_keys" ? `is not allowed ${where}` : requiredMessage(issue),
  });

const hasExtension = (src: string, extensions: readonly string[]) =>
  extensions.some((extension) => src.endsWith(`.${extension}`));

const imageSrc = (extensions: readonly string[]) =>
  z
    .string({ error: requiredMessage })
    .min(1, "must not be empty")
    .refine((src) => !src.startsWith("/") && !/^[a-z][a-z0-9+.-]*:/i.test(src), {
      message: "must be relative to content/images, not absolute",
    })
    .refine((src) => !src.includes(".."), { message: "must not contain .." })
    .refine((src) => hasExtension(src, extensions), {
      message: `must end in ${extensions.map((extension) => `.${extension}`).join(", ")}`,
    });

const image = strict({ src: imageSrc(IMAGE_EXTENSIONS), alt: text(200) }, "on an image");

const screenshot = strict(
  { src: imageSrc(IMAGE_EXTENSIONS), alt: text(200), caption: text(160).optional() },
  "on a screenshot",
);

const diagram = strict(
  { src: imageSrc(DIAGRAM_EXTENSIONS), alt: text(200), description: text(600) },
  "on a diagram",
);

const links = strict(
  {
    repo: httpsUrl.optional(),
    live: httpsUrl.optional(),
    other: z.array(strict({ label: text(40), url: httpsUrl }, "on a link")).optional(),
  },
  "on links",
);

const seo = strict(
  { title: text(TITLE_MAX).optional(), description: text(160).optional() },
  "on seo",
);

const isoDate = z.preprocess(
  // A bare YAML date may arrive as a Date; keep it as the plain string.
  (value) => (value instanceof Date ? value.toISOString().slice(0, 10) : value),
  z
    .string({ error: requiredMessage })
    .regex(
      /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,
      "must be a date in YYYY-MM-DD form, for example 2026-11-17",
    ),
);

const updated = isoDate;

/** Where an image `src` must start, for collections that own one folder. */
const inFolder = (extensions: readonly string[], folder: string) =>
  imageSrc(extensions).refine((src) => src.startsWith(`${folder}/`), {
    message: `must start with ${folder}/`,
  });

// Spec 0006, AC-2: a result may carry an id so a lens or service can point at it.
const resultId = z
  .string()
  .regex(SLUG_PATTERN, "must be a kebab case id, for example seo-score")
  .max(40, "must be at most 40 characters");

const resultRef = z
  .string({ error: requiredMessage })
  .regex(
    RESULT_REF_PATTERN,
    "must be <project-slug>/<result-id>, for example my-project/seo-score",
  );

const trackRecord = z.array(resultRef).max(3, "may hold at most 3 results").default([]);

const faq = z
  .array(strict({ question: text(120), answer: text(600) }, "on an FAQ item"))
  .max(6, "may hold at most 6 questions")
  .default([]);

const period = strict({ start: month, end: month.nullable() }, "on a period").refine(
  (value) => value.end === null || value.end >= value.start,
  { message: "must not be before start", path: ["end"] },
);

const publicResult = strict(
  {
    id: resultId.optional(),
    value: text(40),
    label: text(60),
    context: text(160).optional(),
    source: text(300),
  },
  "on a result",
);

const onRequestResult = strict(
  { id: resultId.optional(), value: text(40), label: text(60), context: text(160).optional() },
  "on an on request result (results on on request projects carry no source)",
);

const publicClient = strict({ descriptor: text(80), name: text(80).optional() }, "on a client");

const onRequestClient = strict(
  { descriptor: text(80) },
  "on an on request project (use descriptor, never the client's name)",
);

const brief = strict(
  { problem: text(600), approach: text(600), outcome: text(600), ai: text(600) },
  "on a brief",
);

// Fields every project variant shares.
const projectBase = {
  title: text(70),
  summary: text(160),
  status: z.enum(["draft", "published"]),
  updated: updated.optional(),
  role: text(60),
  period,
  sector: slug,
  categories: slugs.min(1, "needs at least one category").max(3, "may hold at most 3 categories"),
  stack: slugs.min(1, "needs at least one entry"),
  aiTools: slugs.default([]),
  // Added by the frontmatter parser: the MDX body.
  content: z.string(),
};

const publicFlagship = strict(
  {
    ...projectBase,
    visibility: z.literal("public"),
    depth: z.literal("flagship"),
    client: publicClient,
    skills: slugs.min(1, "a flagship needs at least one skill"),
    results: z.array(publicResult).min(1, "a public flagship needs at least one result"),
    links: links.optional(),
    cover: image,
    screenshots: z.array(screenshot).optional(),
    diagram: diagram.optional(),
    seo: seo.optional(),
  },
  "on a public flagship",
);

const publicCard = strict(
  {
    ...projectBase,
    visibility: z.literal("public"),
    depth: z.literal("card"),
    client: publicClient,
    skills: slugs.default([]),
    aiNote: text(200).optional(),
    results: z.array(publicResult).default([]),
    links: links.optional(),
    cover: image.optional(),
    screenshots: z.array(screenshot).optional(),
  },
  "on a public card",
);

const onRequestFlagship = strict(
  {
    ...projectBase,
    visibility: z.literal("onRequest"),
    depth: z.literal("flagship"),
    client: onRequestClient,
    skills: slugs.min(1, "a flagship needs at least one skill"),
    results: z.array(onRequestResult).default([]),
    brief,
    seo: seo.optional(),
  },
  "on an on request project",
);

const onRequestCard = strict(
  {
    ...projectBase,
    visibility: z.literal("onRequest"),
    depth: z.literal("card"),
    client: onRequestClient,
    skills: slugs.default([]),
    aiNote: text(200).optional(),
    results: z.array(onRequestResult).default([]),
  },
  "on an on request card",
);

const depthError = { error: "depth must be flagship or card" };

export const projectSchema = z.discriminatedUnion(
  "visibility",
  [
    z.discriminatedUnion("depth", [publicFlagship, publicCard], depthError),
    z.discriminatedUnion("depth", [onRequestFlagship, onRequestCard], depthError),
  ],
  { error: "visibility must be public or onRequest" },
);

export const aboutSchema = strict(
  { seo: seo.optional(), content: z.string() },
  "on the about page",
);

export const lensSchema = strict(
  {
    name: text(40),
    headline: text(120),
    // A phrase of `headline` the hero highlights; check.ts makes sure it is there once.
    headlineHighlight: text(60).optional(),
    intro: text(400),
    projects: slugs.min(1, "a lens needs at least one project"),
    skills: slugs.default([]),
    trackRecord,
    faq,
    seo: seo.optional(),
  },
  "on a lens",
);

// Spec 0006, AC-1: one freelance service.
export const serviceSchema = strict(
  {
    status: z.enum(["draft", "published"]),
    name: text(40),
    tagline: text(60),
    headline: text(120),
    headlineHighlight: text(60).optional(),
    intro: text(400),
    offerings: z
      .array(strict({ title: text(40), description: text(160) }, "on an offering"))
      .min(3, "needs at least 3 offerings")
      .max(4, "may hold at most 4 offerings"),
    trackRecord,
    projects: slugs.min(1, "a service needs at least one project"),
    faq,
    seo: seo.optional(),
  },
  "on a service",
);

// Spec 0006, AC-3: a quote, published only with permission on record.
export const testimonialSchema = strict(
  {
    quote: text(400),
    name: text(80),
    role: text(60).optional(),
    company: text(80).optional(),
    project: slug.optional(),
    photo: strict(
      {
        src: inFolder(IMAGE_EXTENSIONS, TESTIMONIAL_IMAGE_FOLDER),
        // Empty means decorative: the caption already names the person.
        alt: z.string().trim().max(200, "must be at most 200 characters"),
      },
      "on a testimonial photo",
    ).optional(),
    permission: isoDate,
  },
  "on a testimonial",
);

export const categorySchema = strict({ name: text(40), description: text(200) }, "on a category");

export const stackSchema = strict(
  { name: text(40), group: z.enum(STACK_GROUPS).optional() },
  "on a stack entry",
);

export const skillSchema = strict(
  { name: text(60), group: text(40), description: text(200) },
  "on a skill",
);

export const sectorSchema = strict({ name: text(40) }, "on a sector");

export const profileSchema = strict(
  {
    name: text(60),
    roleLine: text(80),
    headline: text(160),
    location: text(60),
    photo: strict(
      {
        src: imageSrc(IMAGE_EXTENSIONS).refine(
          (src) => src.startsWith(`${PROFILE_IMAGE_FOLDER}/`),
          { message: `must start with ${PROFILE_IMAGE_FOLDER}/` },
        ),
        alt: text(200),
        // Where the square crop centres (spec 0004, AC-15): CSS object-position.
        focus: z
          .string()
          .regex(
            /^(100|[1-9]?\d)% (100|[1-9]?\d)%$/,
            "must be two percentages from 0 to 100, for example 50% 25%",
          )
          .optional(),
      },
      "on the profile photo",
    ),
    headlineHighlight: text(60).optional(),
    // The city service titles name (spec 0006, AC-4); `location` stays visitor facing.
    base: text(60),
    availability: strict(
      {
        status: z.enum(["open", "selective", "unavailable"]),
        // Spec 0006, AC-13: what clients see on the services pages.
        projects: z.enum(["open", "limited", "closed"]),
        note: text(120).optional(),
      },
      "on availability",
    ),
    services: strict(
      { headline: text(120), headlineHighlight: text(60).optional(), intro: text(300) },
      "on services",
    ),
    clients: z
      .array(
        strict(
          {
            name: text(80),
            logo: inFolder(["svg"], CLIENT_IMAGE_FOLDER),
            permission: isoDate,
            project: slug.optional(),
          },
          "on a client",
        ),
      )
      .max(12, "may hold at most 12 clients")
      .default([]),
    links: z
      .array(
        strict({ kind: z.enum(["github", "linkedin", "website"]), url: httpsUrl }, "on a link"),
      )
      .default([]),
    featured: slugs
      .min(1, "needs at least one featured flagship")
      .max(6, "may hold at most 6 projects"),
    flagshipOrder: slugs,
    lensOrder: slugs,
    serviceOrder: slugs.default([]),
    featuredTestimonials: slugs.max(2, "may hold at most 2 testimonials").default([]),
    skillGroups: z.array(text(40)).min(1, "needs at least one group"),
  },
  "on the profile",
);

// Content Collections prints each issue as "<path>: <message>" and joins the
// path with commas. Hand it one readable path instead ("results[0].source"),
// and split an unknown key issue into one issue per key so the key is named.

type PathSegment = PropertyKey | { readonly key: PropertyKey };
type Issue = {
  readonly message: string;
  readonly path?: readonly PathSegment[] | undefined;
  readonly code?: string;
  readonly keys?: readonly string[];
};

export const formatPath = (path: readonly PathSegment[] = []): string =>
  path
    .map((segment) => (typeof segment === "object" ? segment.key : segment))
    .reduce<string>(
      (joined, key) =>
        typeof key === "number"
          ? `${joined}[${key}]`
          : joined
            ? `${joined}.${String(key)}`
            : String(key),
      "",
    );

export const readableIssues = (issues: readonly Issue[]): { message: string; path: string[] }[] =>
  issues.flatMap((issue) => {
    const base = issue.path ?? [];
    const keys = issue.code === "unrecognized_keys" && issue.keys ? issue.keys : [undefined];
    return keys.map((key) => ({
      message: issue.message,
      path: [formatPath(key === undefined ? base : [...base, key]) || "(file)"],
    }));
  });

/** Wraps a schema so the issues it reports carry readable paths. */
export const withReadableIssues = <S extends z.ZodType>(schema: S): Pick<S, "~standard"> => {
  const standard = schema["~standard"];
  type Validated = Awaited<ReturnType<typeof standard.validate>>;
  const readable = (result: Validated): Validated =>
    result.issues ? ({ issues: readableIssues(result.issues) } as Validated) : result;
  return {
    "~standard": {
      ...standard,
      validate: (value) => {
        const result = standard.validate(value);
        return result instanceof Promise ? result.then(readable) : readable(result);
      },
    },
  };
};
