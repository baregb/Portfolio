import type { Metadata } from "next";
import { CARD_SIZE, cardPath, fullTitle, type SitePage } from "./pages.ts";

// A page's full metadata (feature 13): title, description, canonical
// address, and the social card for Open Graph (LinkedIn, messaging apps) and
// X. Next merges metadata shallowly, so each page sets the whole `openGraph`
// and `twitter` objects. Paths are relative; the root layout's
// `metadataBase` makes them absolute.

const cardImage = (page: SitePage) => ({
  url: cardPath(page.path),
  ...CARD_SIZE,
  alt: `${page.card.label}: ${page.card.heading}`,
});

export const pageMetadata = (page: SitePage, siteName: string): Metadata => {
  const title = fullTitle(page, siteName);
  const image = cardImage(page);
  return {
    title: page.absoluteTitle ? { absolute: page.title } : page.title,
    description: page.description,
    alternates: { canonical: page.path },
    openGraph: {
      type: page.kind === "case-study" ? "article" : "website",
      url: page.path,
      siteName,
      title,
      description: page.description,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: page.description,
      images: [image],
    },
  };
};

/**
 * The root layout's fallback for pages with no card of their own (request
 * details, the styleguide; both never indexed): the home card and the site
 * name only, so the page's own title and address still show in a preview.
 */
export const fallbackSocialMetadata = (home: SitePage, siteName: string): Metadata => {
  const image = cardImage(home);
  return {
    openGraph: { type: "website", siteName, images: [image] },
    twitter: { card: "summary_large_image", images: [image] },
  };
};
