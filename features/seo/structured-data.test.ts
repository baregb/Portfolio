import { describe, expect, it } from "vitest";
import {
  aboutStructuredData,
  absoluteUrl,
  caseStudyStructuredData,
  homeStructuredData,
  serializeJsonLd,
  serviceStructuredData,
} from "./structured-data";

const SITE = "https://example.com";
const profile = {
  name: "Ada Lovelace",
  roleLine: "Builder",
  headline: "I build things.",
  links: [
    { kind: "github", url: "https://github.com/ada" },
    { kind: "linkedin", url: "https://www.linkedin.com/in/ada" },
  ],
} as const;

describe("structured data", () => {
  it("home describes the site and the person, linked by id, with profile links", () => {
    const data = homeStructuredData(profile, SITE);
    expect(data["@context"]).toBe("https://schema.org");
    expect(data["@graph"]).toEqual([
      {
        "@type": "WebSite",
        "@id": "https://example.com/#website",
        name: "Ada Lovelace",
        url: SITE,
        author: { "@id": "https://example.com/#person" },
      },
      {
        "@type": "Person",
        "@id": "https://example.com/#person",
        name: "Ada Lovelace",
        jobTitle: "Builder",
        description: "I build things.",
        url: SITE,
        sameAs: ["https://github.com/ada", "https://www.linkedin.com/in/ada"],
      },
    ]);
  });

  it("leaves sameAs out when there are no links", () => {
    const data = aboutStructuredData({ ...profile, links: [] }, SITE);
    expect(data).toMatchObject({ "@type": "ProfilePage", url: "https://example.com/about" });
    expect(data.mainEntity).not.toHaveProperty("sameAs");
  });

  it("a case study is an article by the person, illustrated by its card", () => {
    const data = caseStudyStructuredData(
      { slug: "ledger-engine", title: "Ledger engine", seoDescription: "A ledger." },
      profile,
      SITE,
    );
    expect(data).toEqual({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Ledger engine",
      description: "A ledger.",
      url: "https://example.com/work/ledger-engine",
      mainEntityOfPage: "https://example.com/work/ledger-engine",
      image: "https://example.com/og/work-ledger-engine.png",
      author: {
        "@type": "Person",
        "@id": "https://example.com/#person",
        name: "Ada Lovelace",
        url: SITE,
      },
    });
  });

  it("a service is provided by the person, linked by id (spec 0006, AC-16)", () => {
    expect(
      serviceStructuredData(
        { slug: "web-apps", name: "Web apps", seoDescription: "Apps, end to end." },
        profile,
        SITE,
      ),
    ).toEqual({
      "@context": "https://schema.org",
      "@type": "Service",
      name: "Web apps",
      serviceType: "Web apps",
      description: "Apps, end to end.",
      areaServed: "Worldwide",
      url: "https://example.com/services/web-apps",
      provider: {
        "@type": "Person",
        "@id": "https://example.com/#person",
        name: "Ada Lovelace",
        url: SITE,
      },
    });
  });

  it("absolute addresses keep the home page as the bare origin", () => {
    expect(absoluteUrl(SITE, "/")).toBe(SITE);
    expect(absoluteUrl(SITE, "/work")).toBe("https://example.com/work");
  });
});

describe("serializeJsonLd", () => {
  it("escapes < so content cannot close the script tag", () => {
    const text = serializeJsonLd({ headline: "</script><script>alert(1)</script>" });
    expect(text).not.toContain("<");
    expect(JSON.parse(text)).toEqual({ headline: "</script><script>alert(1)</script>" });
  });
});
