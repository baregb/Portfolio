import {
  allAbouts,
  allCategories,
  allLenses,
  allProfiles,
  allProjects,
  allSectors,
  allSkills,
  allStacks,
} from "content-collections";
import { parseContentDrafts } from "./env.ts";
import { createContentReader } from "./read.ts";

// The only module pages import content from (spec 0002). Binds the read layer
// to the collections `pnpm content` generated and to `CONTENT_DRAFTS`, read
// once at build. Content is compiled at build only; the Worker never imports
// this module.

const drafts = parseContentDrafts(process.env.CONTENT_DRAFTS);
if (!drafts.ok) throw new Error(drafts.error);

const reader = createContentReader(
  {
    projects: allProjects,
    lenses: allLenses,
    categories: allCategories,
    stack: allStacks,
    skills: allSkills,
    sectors: allSectors,
    profiles: allProfiles,
    abouts: allAbouts,
  },
  drafts.includeDrafts,
);

export const {
  getProfile,
  getAbout,
  getProjects,
  getProject,
  getFlagships,
  getFlagshipNeighbours,
  getFeatured,
  getLenses,
  getLens,
  getCategories,
  getStackEntries,
  getSectors,
  getSkillGroups,
} = reader;

export { SECTIONS, type SectionKey } from "./rules.ts";
export type {
  About,
  Category,
  Flagship,
  Lens,
  LensRef,
  OnRequestCard,
  OnRequestFlagship,
  Profile,
  Project,
  ProjectRef,
  PublicCard,
  PublicFlagship,
  Section,
  Sections,
  Sector,
  Seo,
  Skill,
  SkillGroup,
  StackEntry,
} from "./types.ts";
