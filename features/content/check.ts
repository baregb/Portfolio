import {
  ABOUT_FILE,
  COLLECTION_FILES,
  DIAGRAM_EXTENSIONS,
  IMAGES_DIRECTORY,
  PROFILE_FILE,
  PROFILE_IMAGE_FOLDER,
  RESERVED_PROJECT_SLUGS,
  SLUG_PATTERN,
} from "./rules.ts";
import type { ContentData, RawProfile, RawProject } from "./types.ts";

// Every cross file content rule (spec 0002, "Where each rule runs"). Pure: the
// check script reads the disk and hands this a snapshot. Node runs this file
// directly, so imports keep their `.ts` extension and syntax stays erasable.

export type ContentIssue = {
  readonly file: string;
  readonly field?: string;
  readonly message: string;
};

export type ContentSnapshot = ContentData & {
  /** Every file under `content/`, relative to it, with `/` separators, dotfiles skipped. */
  readonly files: readonly string[];
};

export type CheckResult =
  | { readonly ok: true; readonly warnings: readonly ContentIssue[] }
  | {
      readonly ok: false;
      readonly errors: readonly ContentIssue[];
      readonly warnings: readonly ContentIssue[];
    };

type Issues = readonly ContentIssue[];

const contentPath = (file: string) => `content/${file}`;
const projectFile = (slug: string) => contentPath(`projects/${slug}.mdx`);
const lensFile = (slug: string) => contentPath(`lenses/${slug}.yaml`);
const skillFile = (slug: string) => contentPath(`skills/${slug}.yaml`);
const PROFILE = contentPath(PROFILE_FILE);
const ABOUT = contentPath(ABOUT_FILE);
const PRODUCTION = "in production (drafts excluded)";

const issue = (file: string, field: string | undefined, message: string): ContentIssue =>
  field === undefined ? { file, message } : { file, field, message };

const when = (condition: boolean, make: () => ContentIssue): Issues => (condition ? [make()] : []);

const duplicatesIn = (values: readonly string[]): readonly string[] => [
  ...new Set(values.filter((value, index) => values.indexOf(value) !== index)),
];

const slugOf = (doc: { readonly _meta: { readonly path: string } }) => doc._meta.path;
const slugSet = (docs: readonly { readonly _meta: { readonly path: string } }[]) =>
  new Set(docs.map(slugOf));
const isFlagship = (project: RawProject) => project.depth === "flagship";
const isImage = (file: string) => DIAGRAM_EXTENSIONS.some((ext) => file.endsWith(`.${ext}`));

/** The image `src` values a project references, with their field names. */
export const projectImages = (project: RawProject): readonly { field: string; src: string }[] => {
  if (project.visibility !== "public") return [];
  const cover = project.cover ? [{ field: "cover.src", src: project.cover.src }] : [];
  const screenshots = (project.screenshots ?? []).map((shot, index) => ({
    field: `screenshots[${index}].src`,
    src: shot.src,
  }));
  const diagram =
    project.depth === "flagship" && project.diagram
      ? [{ field: "diagram.src", src: project.diagram.src }]
      : [];
  return [...cover, ...screenshots, ...diagram];
};

// Which collection a file belongs to, or `undefined` for a stray file.
type FileKind =
  | { readonly kind: "document"; readonly collection: string; readonly slug: string }
  | { readonly kind: "image"; readonly owner: string }
  | undefined;

const classify = (file: string): FileKind => {
  if (file === PROFILE_FILE) return { kind: "document", collection: "profile", slug: "profile" };
  if (file === ABOUT_FILE) return { kind: "document", collection: "about", slug: "about" };
  const segments = file.split("/");
  if (segments[0] === IMAGES_DIRECTORY && segments.length >= 3 && isImage(file)) {
    return { kind: "image", owner: segments[1] ?? "" };
  }
  const match = Object.entries(COLLECTION_FILES).find(
    ([, { directory, extension }]) =>
      segments.length === 2 && segments[0] === directory && file.endsWith(`.${extension}`),
  );
  if (!match) return undefined;
  const [collection, { extension }] = match;
  return {
    kind: "document",
    collection,
    slug: (segments[1] ?? "").slice(0, -(extension.length + 1)),
  };
};

const builtSlugs = (data: ContentData): Readonly<Record<string, readonly string[]>> => ({
  projects: data.projects.map(slugOf),
  lenses: data.lenses.map(slugOf),
  categories: data.categories.map(slugOf),
  stack: data.stack.map(slugOf),
  skills: data.skills.map(slugOf),
  sectors: data.sectors.map(slugOf),
  profile: data.profiles.map(() => "profile"),
  about: data.abouts.map(() => "about"),
});

// Stray files, documents that did not build, slugs, and image files on disk.
function checkFiles(snapshot: ContentSnapshot): Issues {
  const built = builtSlugs(snapshot);
  const projects = new Map(snapshot.projects.map((p) => [slugOf(p), p]));
  const referenced = new Set([
    ...snapshot.projects.flatMap((p) => projectImages(p).map((image) => image.src)),
    ...snapshot.profiles.map((profile) => profile.photo.src),
  ]);

  return snapshot.files.flatMap((file): Issues => {
    const path = contentPath(file);
    const kind = classify(file);
    if (kind === undefined) {
      return [issue(path, undefined, "matches no collection and is not an image")];
    }
    if (kind.kind === "document") {
      return [
        ...when(!SLUG_PATTERN.test(kind.slug), () =>
          issue(path, undefined, `slug "${kind.slug}" must be kebab case, for example my-project`),
        ),
        ...when(!(built[kind.collection] ?? []).includes(kind.slug), () =>
          issue(path, undefined, "did not build; see the content build errors above"),
        ),
      ];
    }
    if (projects.get(kind.owner)?.visibility === "onRequest") {
      return [issue(path, undefined, `on request project "${kind.owner}" must have no images`)];
    }
    return when(!referenced.has(file.slice(IMAGES_DIRECTORY.length + 1)), () =>
      issue(path, undefined, "image is not referenced by any project or the profile"),
    );
  });
}

// Image paths each document references, reserved slugs, and singleton counts.
function checkDocuments(snapshot: ContentSnapshot): Issues {
  const existing = new Set(snapshot.files);
  const missing = (src: string) => !existing.has(`${IMAGES_DIRECTORY}/${src}`);

  const projectIssues = snapshot.projects.flatMap((project): Issues => {
    const slug = slugOf(project);
    const file = projectFile(slug);
    return [
      ...when(RESERVED_PROJECT_SLUGS.includes(slug), () =>
        issue(file, undefined, `"${slug}" is reserved and can't be a project slug`),
      ),
      ...projectImages(project).flatMap(({ field, src }) =>
        !src.startsWith(`${slug}/`)
          ? [issue(file, field, `must start with ${slug}/`)]
          : when(missing(src), () =>
              issue(file, field, `names a missing file: content/images/${src}`),
            ),
      ),
    ];
  });

  const profileIssues = snapshot.profiles.flatMap((profile) =>
    when(
      profile.photo.src.startsWith(`${PROFILE_IMAGE_FOLDER}/`) && missing(profile.photo.src),
      () =>
        issue(PROFILE, "photo.src", `names a missing file: content/images/${profile.photo.src}`),
    ),
  );

  return [
    ...projectIssues,
    ...profileIssues,
    ...when(snapshot.profiles.length !== 1, () =>
      issue(
        PROFILE,
        undefined,
        `there must be exactly one profile, found ${snapshot.profiles.length}`,
      ),
    ),
    ...when(snapshot.abouts.length !== 1, () =>
      issue(
        ABOUT,
        undefined,
        `there must be exactly one about page, found ${snapshot.abouts.length}`,
      ),
    ),
  ];
}

// Every slug in `values` exists in `known`, and none repeats.
const checkList = (
  file: string,
  field: string,
  values: readonly string[],
  known: ReadonlySet<string>,
  noun: string,
): Issues => [
  ...values
    .filter((value) => !known.has(value))
    .map((value) => issue(file, field, `unknown ${noun} "${value}"`)),
  ...duplicatesIn(values).map((value) => issue(file, field, `"${value}" is listed more than once`)),
];

function checkProjectReferences(data: ContentData): Issues {
  const sectors = slugSet(data.sectors);
  const categories = slugSet(data.categories);
  const stack = slugSet(data.stack);
  const skills = slugSet(data.skills);
  const aiStack = new Set(data.stack.filter((entry) => entry.group === "ai").map(slugOf));

  return data.projects.flatMap((project): Issues => {
    const file = projectFile(slugOf(project));
    return [
      ...when(!sectors.has(project.sector), () =>
        issue(file, "sector", `unknown sector "${project.sector}"`),
      ),
      ...checkList(file, "categories", project.categories, categories, "category"),
      ...checkList(file, "stack", project.stack, stack, "stack entry"),
      ...checkList(file, "skills", project.skills, skills, "skill"),
      ...checkList(file, "aiTools", project.aiTools, stack, "stack entry"),
      ...project.aiTools.flatMap((tool) => [
        ...when(stack.has(tool) && !aiStack.has(tool), () =>
          issue(file, "aiTools", `"${tool}" is not a stack entry with group: ai`),
        ),
        ...when(project.stack.includes(tool), () =>
          issue(file, "aiTools", `"${tool}" is also in stack; list it in one place only`),
        ),
      ]),
    ];
  });
}

function checkLensReferences(data: ContentData): Issues {
  const projects = slugSet(data.projects);
  const skills = slugSet(data.skills);
  return data.lenses.flatMap((lens) => {
    const file = lensFile(slugOf(lens));
    return [
      ...checkList(file, "projects", lens.projects, projects, "project"),
      ...checkList(file, "skills", lens.skills, skills, "skill"),
    ];
  });
}

function checkProfileReferences(data: ContentData, profile: RawProfile): Issues {
  const projects = slugSet(data.projects);
  const lenses = slugSet(data.lenses);
  const groups = new Set(profile.skillGroups);
  const flagships = data.projects.filter(isFlagship).map(slugOf);
  const cards = new Set(data.projects.filter((p) => !isFlagship(p)).map(slugOf));

  const onlyFlagships = (field: string, values: readonly string[], message: string) =>
    values
      .filter((slug) => cards.has(slug))
      .map((slug) => issue(PROFILE, field, `"${slug}" ${message}`));

  return [
    ...duplicatesIn(profile.skillGroups).map((group) =>
      issue(PROFILE, "skillGroups", `"${group}" is listed more than once`),
    ),
    ...data.skills
      .filter((skill) => !groups.has(skill.group))
      .map((skill) =>
        issue(
          skillFile(slugOf(skill)),
          "group",
          `unknown skill group "${skill.group}"; add it to profile skillGroups`,
        ),
      ),
    ...duplicatesIn(profile.links.map((link) => link.kind)).map((kind) =>
      issue(PROFILE, "links", `"${kind}" is listed more than once`),
    ),
    ...checkList(PROFILE, "featured", profile.featured, projects, "project"),
    ...onlyFlagships("featured", profile.featured, "is a card; featured may name only flagships"),
    ...checkList(PROFILE, "flagshipOrder", profile.flagshipOrder, projects, "project"),
    ...onlyFlagships("flagshipOrder", profile.flagshipOrder, "is a card; list flagships only"),
    ...flagships
      .filter((slug) => !profile.flagshipOrder.includes(slug))
      .map((slug) =>
        issue(PROFILE, "flagshipOrder", `flagship "${slug}" is missing (drafts included)`),
      ),
    ...checkList(PROFILE, "lensOrder", profile.lensOrder, lenses, "lens"),
    ...[...lenses]
      .filter((slug) => !profile.lensOrder.includes(slug))
      .map((slug) => issue(PROFILE, "lensOrder", `lens "${slug}" is missing`)),
  ];
}

// Production mode: drafts named in lists are dropped with a warning, and the
// minimums must still hold once they are gone.
function checkProduction(data: ContentData): { errors: Issues; warnings: Issues } {
  const drafts = new Set(data.projects.filter((p) => p.status === "draft").map(slugOf));
  const included = new Set(data.projects.filter((p) => p.status === "published").map(slugOf));
  const profile = data.profiles[0];

  const dropped = (file: string, field: string, slugs: readonly string[]) =>
    slugs
      .filter((slug) => drafts.has(slug))
      .map((slug) => issue(file, field, `draft "${slug}" is dropped ${PRODUCTION}`));

  const warnings = [
    ...data.lenses.flatMap((lens) => dropped(lensFile(slugOf(lens)), "projects", lens.projects)),
    ...(profile
      ? [
          ...dropped(PROFILE, "featured", profile.featured),
          ...dropped(PROFILE, "flagshipOrder", profile.flagshipOrder),
        ]
      : []),
  ];

  const errors = [
    ...data.lenses.flatMap((lens) =>
      when(!lens.projects.some((slug) => included.has(slug)), () =>
        issue(lensFile(slugOf(lens)), "projects", `lens has no projects ${PRODUCTION}`),
      ),
    ),
    ...when(profile !== undefined && !profile.featured.some((slug) => included.has(slug)), () =>
      issue(PROFILE, "featured", `no featured project remains ${PRODUCTION}`),
    ),
    ...when(!data.projects.some((p) => isFlagship(p) && included.has(slugOf(p))), () =>
      issue(contentPath("projects"), undefined, `no flagship remains ${PRODUCTION}`),
    ),
    ...when(data.lenses.length === 0, () =>
      issue(contentPath("lenses"), undefined, `no lens remains ${PRODUCTION}`),
    ),
  ];
  return { errors, warnings };
}

/**
 * Runs every cross file rule over one snapshot. `includeDrafts` picks the mode:
 * production mode (`false`) drops drafts with a warning and checks the
 * minimums. The check script runs both modes.
 */
export function checkContent(
  snapshot: ContentSnapshot,
  { includeDrafts }: { readonly includeDrafts: boolean },
): CheckResult {
  const profile = snapshot.profiles[0];
  const production = includeDrafts ? { errors: [], warnings: [] } : checkProduction(snapshot);
  const errors = [
    ...checkFiles(snapshot),
    ...checkDocuments(snapshot),
    ...checkProjectReferences(snapshot),
    ...checkLensReferences(snapshot),
    ...(profile ? checkProfileReferences(snapshot, profile) : []),
    ...production.errors,
  ];
  return errors.length === 0
    ? { ok: true, warnings: production.warnings }
    : { ok: false, errors, warnings: production.warnings };
}
