import type { Project } from "@/features/content";
import { formatPeriod } from "./format";
import { projectHref, projectLinks, requestHref, type ExternalLink } from "./links";

// The slim view model a project card renders (spec 0004, AC-7). Built on the
// server, so cards never carry whole projects (with compiled MDX) into the
// browser, and the library filters work on plain slugs.

export type LibraryBadge = "case-study" | "on-request";

export type LibraryItem = {
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
  readonly category: string;
  readonly clientLabel: string;
  readonly period: string;
  readonly headlineResult?: { readonly value: string; readonly label: string };
  /** Up to four stack names, in file order. */
  readonly stack: readonly string[];
  readonly badge: LibraryBadge | null;
  /** The case study, for a flagship. */
  readonly href: string | null;
  /** The request details page, for an on request project. */
  readonly requestHref: string | null;
  /** Live site and repository, for a public card only. */
  readonly links: readonly ExternalLink[];
  readonly categorySlugs: readonly string[];
  readonly lensSlugs: readonly string[];
  /** Stack plus AI tools, which the Stack filter matches. */
  readonly stackSlugs: readonly string[];
};

const STACK_ON_CARD = 4;

const badgeOf = (project: Project): LibraryBadge | null => {
  if (project.visibility === "onRequest") return "on-request";
  return project.depth === "flagship" ? "case-study" : null;
};

export const toLibraryItem = (project: Project): LibraryItem => {
  const result = project.headlineResult;
  return {
    slug: project.slug,
    title: project.title,
    summary: project.summary,
    category: project.primaryCategory.name,
    clientLabel: project.clientLabel,
    period: formatPeriod(project.period),
    ...(result ? { headlineResult: { value: result.value, label: result.label } } : {}),
    stack: project.stack.slice(0, STACK_ON_CARD).map((entry) => entry.name),
    badge: badgeOf(project),
    href: projectHref(project),
    requestHref: requestHref(project),
    links: project.depth === "card" ? projectLinks(project) : [],
    categorySlugs: project.categories.map((category) => category.slug),
    lensSlugs: project.lenses.map((lens) => lens.slug),
    stackSlugs: [...project.stack, ...project.aiTools].map((entry) => entry.slug),
  };
};
