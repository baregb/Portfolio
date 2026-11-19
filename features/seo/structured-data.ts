// Structured data (schema.org JSON-LD) for search engines (feature 13). Pure:
// builders take resolved content and the canonical site address and return
// plain objects; `serializeJsonLd` makes the text safe inside a `<script>`.

import type { Flagship } from "../content/types.ts";
import { cardPath } from "./pages.ts";

type JsonLd = Readonly<Record<string, unknown>>;

/** The profile fields structured data reads. */
export type PersonSource = {
  readonly name: string;
  readonly roleLine: string;
  readonly headline: string;
  readonly links?: readonly { readonly url: string }[];
};

const CONTEXT = "https://schema.org";

const absolute = (siteUrl: string, path: string) => (path === "/" ? siteUrl : `${siteUrl}${path}`);
const personId = (siteUrl: string) => `${siteUrl}/#person`;

const person = (profile: PersonSource, siteUrl: string): JsonLd => ({
  "@type": "Person",
  "@id": personId(siteUrl),
  name: profile.name,
  jobTitle: profile.roleLine,
  description: profile.headline,
  url: siteUrl,
  ...(profile.links?.length ? { sameAs: profile.links.map(({ url }) => url) } : {}),
});

/** Home: the site and the person it belongs to. */
export const homeStructuredData = (profile: PersonSource, siteUrl: string): JsonLd => ({
  "@context": CONTEXT,
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      name: profile.name,
      url: siteUrl,
      author: { "@id": personId(siteUrl) },
    },
    person(profile, siteUrl),
  ],
});

/** About: a profile page whose subject is the person. */
export const aboutStructuredData = (profile: PersonSource, siteUrl: string): JsonLd => ({
  "@context": CONTEXT,
  "@type": "ProfilePage",
  url: absolute(siteUrl, "/about"),
  mainEntity: person(profile, siteUrl),
});

/** A case study: an article by the person, illustrated by its social card. */
export const caseStudyStructuredData = (
  project: Pick<Flagship, "slug" | "title" | "seoDescription">,
  profile: Pick<PersonSource, "name">,
  siteUrl: string,
): JsonLd => {
  const path = `/work/${project.slug}`;
  return {
    "@context": CONTEXT,
    "@type": "Article",
    headline: project.title,
    description: project.seoDescription,
    url: absolute(siteUrl, path),
    mainEntityOfPage: absolute(siteUrl, path),
    image: absolute(siteUrl, cardPath(path)),
    author: { "@type": "Person", "@id": personId(siteUrl), name: profile.name, url: siteUrl },
  };
};

/**
 * JSON for a `<script type="application/ld+json">`. Escapes `<` so content
 * containing `</script>` cannot close the tag early.
 */
export const serializeJsonLd = (data: JsonLd): string =>
  JSON.stringify(data).replaceAll("<", "\\u003c");

/** Absolute address of a route, for the sitemap. */
export const absoluteUrl = absolute;
