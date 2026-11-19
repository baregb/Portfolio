// Every indexed page (feature 13), in one list that the page metadata, the
// sitemap, and the social card script all read, so a page cannot have a
// card the sitemap misses or a sitemap entry with no card. Pure: takes the
// resolved content, returns the pages. Imports stay relative with `.ts`
// extensions so the card script can run this on Node directly.

import { contactDescription } from "../contact/copy.ts";
import type { About, Flagship, Lens, Profile } from "../content/types.ts";
import { LIBRARY_LEAD } from "../library/copy.ts";

export type PageKind = "home" | "about" | "work" | "contact" | "lens" | "case-study";

export type SitePage = {
  readonly kind: PageKind;
  /** The route, `/` or `/segment/...`, never a trailing slash. */
  readonly path: string;
  /** The `<title>` text; the layout template adds " · <name>" unless absolute. */
  readonly title: string;
  readonly absoluteTitle: boolean;
  readonly description: string;
  /** What the social card shows: a mono label above a big heading. */
  readonly card: { readonly label: string; readonly heading: string };
};

export type SeoSource = {
  readonly profile: Pick<Profile, "name" | "roleLine" | "headline">;
  readonly about: About;
  readonly lenses: readonly Lens[];
  readonly flagships: readonly Flagship[];
};

/** Home's absolute title: the name and role, with no template suffix. */
const homeTitle = (profile: SeoSource["profile"]) => `${profile.name} · ${profile.roleLine}`;

export const sitePages = ({
  profile,
  about,
  lenses,
  flagships,
}: SeoSource): readonly SitePage[] => [
  {
    kind: "home",
    path: "/",
    title: homeTitle(profile),
    absoluteTitle: true,
    description: profile.headline,
    card: { label: "Portfolio", heading: profile.roleLine },
  },
  {
    kind: "about",
    path: "/about",
    title: about.seo?.title ?? "About",
    absoluteTitle: false,
    description: about.seo?.description ?? profile.headline,
    card: { label: "About", heading: `About ${profile.name}` },
  },
  {
    kind: "work",
    path: "/work",
    title: "Work",
    absoluteTitle: false,
    description: LIBRARY_LEAD,
    card: { label: "Work", heading: "Projects and case studies" },
  },
  {
    kind: "contact",
    path: "/contact",
    title: "Contact",
    absoluteTitle: false,
    description: contactDescription(profile.name),
    card: { label: "Contact", heading: "Get in touch" },
  },
  ...lenses.map((lens): SitePage => ({
    kind: "lens",
    path: `/for/${lens.slug}`,
    title: lens.seoTitle,
    absoluteTitle: false,
    description: lens.seoDescription,
    card: { label: "Role lens", heading: lens.name },
  })),
  ...flagships.map((project): SitePage => ({
    kind: "case-study",
    path: `/work/${project.slug}`,
    title: project.seoTitle,
    absoluteTitle: false,
    description: project.seoDescription,
    card: { label: `Case study · ${project.primaryCategory.name}`, heading: project.title },
  })),
];

/** The full title as a browser tab or link preview shows it. */
export const fullTitle = (page: SitePage, name: string): string =>
  page.absoluteTitle ? page.title : `${page.title} · ${name}`;

/** The card's file name under `public/og/`: `/` is `home`, `/work/a` is `work-a`. */
export const cardFileName = (path: string): string =>
  `${path === "/" ? "home" : path.slice(1).replaceAll("/", "-")}.png`;

export const CARD_DIR = "og";
export const CARD_SIZE = { width: 1200, height: 630 } as const;

/** The card's public path, e.g. `/og/work-ledger-engine.png`. */
export const cardPath = (path: string): string => `/${CARD_DIR}/${cardFileName(path)}`;
