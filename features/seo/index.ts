import type { Metadata } from "next";
import { getAbout, getFlagships, getLenses, getProfile } from "@/features/content";
import { fallbackSocialMetadata, pageMetadata } from "./metadata";
import { sitePages, type SitePage } from "./pages";
import { DEV_SITE_URL, isIndexable, readSiteUrl } from "./site-url";

// Binds the SEO helpers to the built content and `NEXT_PUBLIC_SITE_URL`,
// read once at build. A production build without the variable already failed
// in `next.config.ts`; locally it falls back to the dev server address.

const resolveSiteUrl = (): string => {
  const raw = process.env.NEXT_PUBLIC_SITE_URL;
  const result = readSiteUrl(raw);
  if (result.ok) return result.url;
  if (raw !== undefined || process.env.NODE_ENV === "production") throw new Error(result.error);
  return DEV_SITE_URL;
};

const siteUrl = resolveSiteUrl();
const profile = getProfile();
const pages = sitePages({
  profile,
  about: getAbout(),
  lenses: getLenses(),
  flagships: getFlagships(),
});

export const getSiteUrl = () => siteUrl;
export const getSiteIndexable = () => isIndexable(siteUrl);
export const getSitePages = (): readonly SitePage[] => pages;

/** Social card defaults for the root layout (pages with no card of their own). */
export const defaultSocialMetadata = (): Metadata => {
  const home = pages.find(({ kind }) => kind === "home");
  return home ? fallbackSocialMetadata(home, profile.name) : {};
};

/** The metadata for an indexed route, or nothing for a path no page owns. */
export const seoMetadata = (path: string): Metadata => {
  const page = pages.find((candidate) => candidate.path === path);
  return page ? pageMetadata(page, profile.name) : {};
};

export {
  aboutStructuredData,
  absoluteUrl,
  caseStudyStructuredData,
  homeStructuredData,
} from "./structured-data";
export { JsonLd } from "./json-ld";
