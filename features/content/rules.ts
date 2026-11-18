// Shared constants for the content model (spec 0002). Imported by the schemas,
// the section splitter, and the check script, so this file and everything the
// check imports use `.ts` extension imports and erasable syntax only: Node
// runs `scripts/check-content.ts` directly with type stripping.

/** A slug is the filename without its extension, in kebab case. */
export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** `profile` names the profile image folder, so no project may use it. */
export const RESERVED_PROJECT_SLUGS: readonly string[] = ["profile"];

/** The profile photo lives in `content/images/profile/`. */
export const PROFILE_IMAGE_FOLDER = "profile";

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
} as const;

export const PROFILE_FILE = "profile.yaml";
export const ABOUT_FILE = "about.mdx";
export const IMAGES_DIRECTORY = "images";
/** The one file allowed in `content/cv/`: the CV PDF you supply (spec 0004, AC-10). */
export const CV_FILE = "cv/cv.pdf";

/** Compares names and titles the same way everywhere (library order, name order). */
export const collator = new Intl.Collator("en", { sensitivity: "base" });
