import { describe, expect, it } from "vitest";
import { isIndexable, readSiteUrl } from "./site-url";

describe("readSiteUrl", () => {
  it("accepts an https origin and drops a trailing slash", () => {
    expect(readSiteUrl("https://example.com/")).toEqual({ ok: true, url: "https://example.com" });
    expect(readSiteUrl("  https://example.com ")).toEqual({ ok: true, url: "https://example.com" });
  });

  it("accepts plain http only for local addresses", () => {
    expect(readSiteUrl("http://localhost:8787")).toEqual({
      ok: true,
      url: "http://localhost:8787",
    });
    expect(readSiteUrl("http://127.0.0.1:3000").ok).toBe(true);
    const insecure = readSiteUrl("http://example.com");
    expect(insecure.ok).toBe(false);
    expect(!insecure.ok && insecure.error).toMatch(/must use https/);
  });

  it.each([undefined, "", "   "])("names the variable when it is unset (%j)", (value) => {
    const result = readSiteUrl(value);
    expect(result.ok).toBe(false);
    expect(!result.ok && result.error).toMatch(/^NEXT_PUBLIC_SITE_URL is not set/);
  });

  it.each(["example.com", "not a url", "ftp://example.com"])("rejects %j", (value) => {
    const result = readSiteUrl(value);
    expect(result.ok).toBe(false);
    expect(!result.ok && result.error).toContain("NEXT_PUBLIC_SITE_URL");
  });

  it.each(["https://example.com/portfolio", "https://example.com/?a=1", "https://example.com/#x"])(
    "rejects anything but a bare origin (%j)",
    (value) => {
      const result = readSiteUrl(value);
      expect(!result.ok && result.error).toMatch(/bare origin/);
    },
  );
});

describe("isIndexable", () => {
  it("lets search engines index the canonical domain", () => {
    expect(isIndexable("https://example.com")).toBe(true);
  });

  it.each([
    "http://localhost:8787",
    "http://127.0.0.1:3000",
    "https://portfolio-preview.me.workers.dev",
  ])("keeps %s out of search", (url) => {
    expect(isIndexable(url)).toBe(false);
  });
});
