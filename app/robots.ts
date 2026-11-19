import type { MetadataRoute } from "next";
import { getSiteIndexable, getSiteUrl } from "@/features/seo";

// Feature 13: the canonical site is open to crawlers and points at the
// sitemap; a preview (`workers.dev`) or local build turns every crawler away.
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  if (!getSiteIndexable()) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/request/", "/styleguide"] },
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}
