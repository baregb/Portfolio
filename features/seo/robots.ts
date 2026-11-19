import type { MetadataRoute } from "next";
import { isIndexable } from "./site-url.ts";

// robots.txt (feature 13, revised at launch). Crawlers may fetch every page,
// so they can read each page's `noindex`: a `Disallow` would hide that meta
// tag, and a linked address could still show up in results as a bare entry.
// Pages kept out of search (request details, the styleguide, and every page
// of a preview or local build) say so with `noindex` instead. Only the
// canonical site points at the sitemap.

export const robotsRules = (siteUrl: string): MetadataRoute.Robots =>
  isIndexable(siteUrl)
    ? { rules: { userAgent: "*", allow: "/" }, sitemap: `${siteUrl}/sitemap.xml` }
    : { rules: { userAgent: "*", allow: "/" } };

/** The root layout's robots metadata: `noindex` for a build that must never be indexed. */
export const siteRobotsMetadata = (siteUrl: string): { index: boolean; follow: boolean } | null =>
  isIndexable(siteUrl) ? null : { index: false, follow: false };
