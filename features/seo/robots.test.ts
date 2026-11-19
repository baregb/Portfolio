import { describe, expect, it } from "vitest";
import { robotsRules, siteRobotsMetadata } from "./robots";

describe("robotsRules", () => {
  it("opens the canonical site to crawlers and points at its sitemap", () => {
    expect(robotsRules("https://example.com")).toEqual({
      rules: { userAgent: "*", allow: "/" },
      sitemap: "https://example.com/sitemap.xml",
    });
  });

  it("never disallows a path, so crawlers can read each page's noindex", () => {
    for (const url of ["https://example.com", "https://portfolio-preview.a.workers.dev"]) {
      expect(JSON.stringify(robotsRules(url))).not.toContain("disallow");
    }
  });

  it.each(["http://localhost:3000", "https://portfolio-preview.a.workers.dev"])(
    "gives %s no sitemap",
    (url) => {
      expect(robotsRules(url)).not.toHaveProperty("sitemap");
    },
  );
});

describe("siteRobotsMetadata", () => {
  it("adds nothing on the canonical site", () => {
    expect(siteRobotsMetadata("https://example.com")).toBeNull();
  });

  it.each(["http://localhost:3000", "http://127.0.0.1:8787", "https://p.a.workers.dev"])(
    "marks every page of %s noindex",
    (url) => {
      expect(siteRobotsMetadata(url)).toEqual({ index: false, follow: false });
    },
  );
});
