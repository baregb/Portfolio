import { describe, expect, it } from "vitest";
import { fallbackSocialMetadata, pageMetadata } from "./metadata";
import type { SitePage } from "./pages";

const caseStudy: SitePage = {
  kind: "case-study",
  path: "/work/ledger-engine",
  title: "Ledger engine",
  absoluteTitle: false,
  description: "A double entry ledger.",
  card: { label: "Case study · Finance", heading: "Ledger engine" },
};

const home: SitePage = {
  kind: "home",
  path: "/",
  title: "Ada Lovelace · Builder",
  absoluteTitle: true,
  description: "I build things.",
  card: { label: "Portfolio", heading: "Builder" },
};

describe("pageMetadata", () => {
  it("sets the title, description, canonical address, and a full social card", () => {
    expect(pageMetadata(caseStudy, "Ada Lovelace")).toEqual({
      title: "Ledger engine",
      description: "A double entry ledger.",
      alternates: { canonical: "/work/ledger-engine" },
      openGraph: {
        type: "article",
        url: "/work/ledger-engine",
        siteName: "Ada Lovelace",
        title: "Ledger engine · Ada Lovelace",
        description: "A double entry ledger.",
        images: [
          {
            url: "/og/work-ledger-engine.png",
            width: 1200,
            height: 630,
            alt: "Case study · Finance: Ledger engine",
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: "Ledger engine · Ada Lovelace",
        description: "A double entry ledger.",
        images: [
          {
            url: "/og/work-ledger-engine.png",
            width: 1200,
            height: 630,
            alt: "Case study · Finance: Ledger engine",
          },
        ],
      },
    });
  });

  it("keeps an absolute title absolute and calls other pages websites", () => {
    const metadata = pageMetadata(home, "Ada Lovelace");
    expect(metadata.title).toEqual({ absolute: "Ada Lovelace · Builder" });
    expect(metadata.openGraph).toMatchObject({ type: "website", title: "Ada Lovelace · Builder" });
  });
});

describe("fallbackSocialMetadata", () => {
  it("carries only the home card and site name, never a title or address", () => {
    const { openGraph, twitter } = fallbackSocialMetadata(home, "Ada Lovelace");
    expect(openGraph).toEqual({
      type: "website",
      siteName: "Ada Lovelace",
      images: [expect.objectContaining({ url: "/og/home.png" })],
    });
    expect(twitter).toEqual({
      card: "summary_large_image",
      images: [expect.objectContaining({ url: "/og/home.png" })],
    });
  });
});
