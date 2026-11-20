// Shared constants for the content model (spec 0002). Imported by the schemas,
// the section splitter, and the check script, so this file and everything the
// check imports use `.ts` extension imports and erasable syntax only: Node
// runs `scripts/check-content.ts` directly with type stripping.

/** A slug is the filename without its extension, in kebab case. */
export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** The profile photo lives in `content/images/profile/`. */
export const PROFILE_IMAGE_FOLDER = "profile";

/** Testimonial photos live in `content/images/testimonials/` (spec 0006, AC-3). */
export const TESTIMONIAL_IMAGE_FOLDER = "testimonials";

/** Client logos live in `content/images/clients/` (spec 0006, AC-4). */
export const CLIENT_IMAGE_FOLDER = "clients";

/** These name image folders that belong to no project, so no project may use them. */
export const RESERVED_PROJECT_SLUGS: readonly string[] = [
  PROFILE_IMAGE_FOLDER,
  TESTIMONIAL_IMAGE_FOLDER,
  CLIENT_IMAGE_FOLDER,
];

/** A result ref (spec 0006, AC-2): `<project-slug>/<result-id>`. */
export const RESULT_REF_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*\/[a-z0-9]+(-[a-z0-9]+)*$/;

/** Splits a well formed ref into its project slug and result id. */
export const splitRef = (ref: string): { readonly project: string; readonly id: string } => {
  const [project = "", id = ""] = ref.split("/");
  return { project, id };
};

/** The longest page title any content may carry (the `seo.title` cap). */
export const TITLE_MAX = 70;

/** A service page title when it sets no `seo.title` (spec 0006, AC-16). */
export const serviceFallbackTitle = (name: string, base: string): string =>
  `${name} in ${base}, working worldwide`;

/** The six flagship body sections, as exact H2 headings, in order. */
export const SECTIONS = [
  { heading: "Problem", key: "problem" },
  { heading: "Constraints", key: "constraints" },
  { heading: "Decision and tradeoffs", key: "decision" },
  { heading: "What I built", key: "built" },
  { heading: "Results", key: "results" },
  { heading: "How AI was used", key: "ai" },
] as const;

export type SectionKey = (typeof SECTIONS)[number]["key"];

export const IMAGE_EXTENSIONS: readonly string[] = ["png", "jpg", "jpeg", "webp"];

/** A diagram may also be an SVG. */
export const DIAGRAM_EXTENSIONS: readonly string[] = [...IMAGE_EXTENSIONS, "svg"];

export const STACK_GROUPS = [
  "frontend",
  "backend",
  "data",
  "infrastructure",
  "ai",
  "tooling",
] as const;

/** Where each collection's files live, relative to `content/`. */
export const COLLECTION_FILES = {
  projects: { directory: "projects", extension: "mdx" },
  lenses: { directory: "lenses", extension: "yaml" },
  categories: { directory: "categories", extension: "yaml" },
  stack: { directory: "stack", extension: "yaml" },
  skills: { directory: "skills", extension: "yaml" },
  sectors: { directory: "sectors", extension: "yaml" },
  services: { directory: "services", extension: "yaml" },
  testimonials: { directory: "testimonials", extension: "yaml" },
} as const;

export const PROFILE_FILE = "profile.yaml";
export const ABOUT_FILE = "about.mdx";
export const IMAGES_DIRECTORY = "images";
/** The one file allowed in `content/cv/`: the CV PDF you supply (spec 0004, AC-10). */
export const CV_FILE = "cv/cv.pdf";

/** Compares names and titles the same way everywhere (library order, name order). */
export const collator = new Intl.Collator("en", { sensitivity: "base" });
