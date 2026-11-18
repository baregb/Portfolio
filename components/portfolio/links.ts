import type { Profile, Project } from "@/features/content";

// Where each project and profile link points (spec 0004, "API surface").
// Pure, and type only imports from the content layer, so client components
// can use them without pulling the read layer into the browser.

export type ExternalLink = { readonly label: string; readonly href: string };

export type LinkKind = Profile["links"][number]["kind"];

/** How each profile link kind is labelled, everywhere (footer, contact, request). */
export const LINK_LABELS: Readonly<Record<LinkKind, string>> = {
  github: "GitHub",
  linkedin: "LinkedIn",
  website: "Website",
};

export const profileLinks = (profile: Pick<Profile, "links">): readonly ExternalLink[] =>
  profile.links.map(({ kind, url }) => ({ label: LINK_LABELS[kind], href: url }));

/** A public project's links: "Live site", "Repository", then each extra link. On request projects have none. */
export const projectLinks = (project: Project): readonly ExternalLink[] => {
  if (project.visibility !== "public" || !project.links) return [];
  const { live, repo, other = [] } = project.links;
  return [
    ...(live ? [{ label: "Live site", href: live }] : []),
    ...(repo ? [{ label: "Repository", href: repo }] : []),
    ...other.map(({ label, url }) => ({ label, href: url })),
  ];
};

/** The case study page, or `null` for a card, which has none. */
export const projectHref = (project: Pick<Project, "depth" | "slug">): string | null =>
  project.depth === "flagship" ? `/work/${project.slug}` : null;

/** Where a project lives on the site: its case study, or its card in the library. */
export const projectAnchor = (project: Pick<Project, "depth" | "slug">): string =>
  projectHref(project) ?? `/work#project-${project.slug}`;

/** The request details page, or `null` for a public project. */
export const requestHref = (project: Pick<Project, "visibility" | "slug">): string | null =>
  project.visibility === "onRequest" ? `/request/${project.slug}` : null;

/** `https://www.linkedin.com/in/someone/` → `linkedin.com/in/someone`. */
export const displayAddress = (url: string): string =>
  url
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/+$/, "");
