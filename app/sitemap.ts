import type { MetadataRoute } from "next";
import { absoluteUrl, getSitePages, getSiteUrl } from "@/features/seo";

// Feature 13: every indexed page, from the same list that gives each page its
// metadata and social card. Request details and the styleguide are never
// indexed, so they are not in the list.
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return getSitePages().map(({ path }) => ({ url: absoluteUrl(getSiteUrl(), path) }));
}
