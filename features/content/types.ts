import type {
  About as GeneratedAbout,
  Category as GeneratedCategory,
  Lens as GeneratedLens,
  Profile as GeneratedProfile,
  Project as GeneratedProject,
  Sector as GeneratedSector,
  Skill as GeneratedSkill,
  Stack as GeneratedStack,
} from "content-collections";
import type { SectionKey, STACK_GROUPS } from "./rules.ts";

// Raw documents, exactly as `pnpm content` generates them.

export type RawProject = GeneratedProject;
export type RawPublicFlagship = Extract<RawProject, { visibility: "public"; depth: "flagship" }>;
export type RawPublicCard = Extract<RawProject, { visibility: "public"; depth: "card" }>;
export type RawOnRequestFlagship = Extract<
  RawProject,
  { visibility: "onRequest"; depth: "flagship" }
>;
export type RawOnRequestCard = Extract<RawProject, { visibility: "onRequest"; depth: "card" }>;
export type RawLens = GeneratedLens;
export type RawCategory = GeneratedCategory;
export type RawStack = GeneratedStack;
export type RawSkill = GeneratedSkill;
export type RawSector = GeneratedSector;
export type RawProfile = GeneratedProfile;
export type RawAbout = GeneratedAbout;

/** Every generated collection, the input to the checker and the read layer. */
export type ContentData = {
  readonly projects: readonly RawProject[];
  readonly lenses: readonly RawLens[];
  readonly categories: readonly RawCategory[];
  readonly stack: readonly RawStack[];
  readonly skills: readonly RawSkill[];
  readonly sectors: readonly RawSector[];
  readonly profiles: readonly RawProfile[];
  readonly abouts: readonly RawAbout[];
};

// Resolved values, what pages read.

export type StackGroup = (typeof STACK_GROUPS)[number];
export type Sector = { readonly slug: string; readonly name: string };
export type Category = {
  readonly slug: string;
  readonly name: string;
  readonly description: string;
};
export type StackEntry = {
  readonly slug: string;
  readonly name: string;
  readonly group?: StackGroup;
};
export type Skill = {
  readonly slug: string;
  readonly name: string;
  readonly group: string;
  readonly description: string;
};
export type LensRef = { readonly slug: string; readonly name: string };
export type ProjectRef = { readonly slug: string; readonly title: string };
export type Section = { readonly code: string; readonly markdown: string };
export type Sections = Readonly<Record<SectionKey, Section>>;
export type Seo = { readonly title?: string; readonly description?: string };

type Resolved<T extends RawProject> = Omit<
  T,
  "_meta" | "sector" | "categories" | "stack" | "skills" | "aiTools"
> & {
  readonly slug: string;
  readonly sector: Sector;
  readonly categories: readonly Category[];
  /** The first category. */
  readonly primaryCategory: Category;
  readonly stack: readonly StackEntry[];
  readonly skills: readonly Skill[];
  readonly aiTools: readonly StackEntry[];
  /** The lenses that list this project, in `profile.lensOrder`. */
  readonly lenses: readonly LensRef[];
  /** `client.name ?? client.descriptor`. */
  readonly clientLabel: string;
  /** `results[0]`, the one proof point on cards and home. */
  readonly headlineResult: T["results"][number] | undefined;
  readonly seoTitle: string;
  readonly seoDescription: string;
};

export type PublicFlagship = Resolved<RawPublicFlagship>;
export type PublicCard = Resolved<RawPublicCard>;
export type OnRequestFlagship = Resolved<RawOnRequestFlagship>;
export type OnRequestCard = Resolved<RawOnRequestCard>;
export type Project = PublicFlagship | PublicCard | OnRequestFlagship | OnRequestCard;
export type Flagship = PublicFlagship | OnRequestFlagship;

export type Lens = {
  readonly slug: string;
  readonly name: string;
  readonly headline: string;
  /** A phrase of `headline` the hero highlights (spec 0004, AC-15). */
  readonly headlineHighlight?: string;
  readonly intro: string;
  readonly projects: readonly Project[];
  readonly skills: readonly Skill[];
  readonly seoTitle: string;
  readonly seoDescription: string;
};

export type Profile = Omit<RawProfile, "_meta">;
export type About = { readonly seo?: Seo; readonly body: Section };

export type SkillGroup = {
  readonly group: string;
  readonly skills: readonly { readonly skill: Skill; readonly projects: readonly Project[] }[];
};
