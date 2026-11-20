import { describe, expect, it } from "vitest";
import {
  baseSnapshot,
  onRequestFlagship,
  profile,
  publicCard,
  publicFlagship,
  testimonial,
} from "../content/fixtures.ts";
import {
  collectImages,
  cvFileName,
  cvHref,
  formatFileSize,
  svgHasSize,
  variantPath,
  variantWidths,
} from "./assets.ts";

describe("variantWidths (AC-12)", () => {
  it.each([
    [2400, [640, 960, 1280, 1920]],
    [1920, [640, 960, 1280, 1920]],
    [1600, [640, 960, 1280]],
    [1067, [640, 960]],
    [640, [640]],
    [600, [600]],
    [120, [120]],
  ])("a %ipx source makes %j", (source, expected) => {
    expect(variantWidths(source)).toEqual(expected);
  });
});

describe("variantPath (AC-12)", () => {
  it("keeps the folder and swaps the extension for width and format", () => {
    expect(variantPath("profile/photo.jpg", 640, "avif")).toBe("img/profile/photo-640.avif");
    expect(variantPath("atlas-shop/shots/home.page.png", 960, "webp")).toBe(
      "img/atlas-shop/shots/home.page-960.webp",
    );
  });
});

describe("cvFileName and cvHref (AC-10)", () => {
  it("slugs the profile name", () => {
    expect(cvFileName("Omogbolahan Ajibare")).toBe("omogbolahan-ajibare-cv.pdf");
    expect(cvHref("Omogbolahan Ajibare")).toBe("/cv/omogbolahan-ajibare-cv.pdf");
  });

  it("drops accents and punctuation", () => {
    expect(cvFileName("  Zoë  O'Brien-Smith ")).toBe("zoe-o-brien-smith-cv.pdf");
  });

  it("still names a file when nothing is left", () => {
    expect(cvFileName("!!!")).toBe("cv-cv.pdf");
  });
});

describe("formatFileSize (AC-10)", () => {
  it.each([
    [119793, "120 KB"],
    [1499, "1 KB"],
    [12, "1 KB"],
    [2_400_000, "2400 KB"],
  ])("%i bytes is %s", (bytes, label) => {
    expect(formatFileSize(bytes)).toBe(label);
  });
});

describe("collectImages (AC-12)", () => {
  it("collects the profile photo and every image public projects reference, once each", () => {
    const shared = publicFlagship("atlas-shop", {
      screenshots: [{ src: "atlas-shop/one.png", alt: "One" }],
      diagram: { src: "atlas-shop/flow.svg", alt: "Flow", description: "How it flows" },
    });
    const card = publicCard("harbor-tools", {
      cover: { src: "harbor-tools/cover.png", alt: "Cover" },
    });
    const images = collectImages(
      {
        projects: [shared, card, onRequestFlagship("quiet-ledger")],
        profiles: [profile()],
        testimonials: [],
      },
      true,
    );
    expect(images).toEqual([
      "profile/me.jpg",
      "atlas-shop/cover.png",
      "atlas-shop/one.png",
      "atlas-shop/flow.svg",
      "harbor-tools/cover.png",
    ]);
  });

  it("leaves out a draft's images unless drafts are included", () => {
    const draft = publicCard("harbor-tools", {
      status: "draft",
      cover: { src: "harbor-tools/cover.png", alt: "Cover" },
    });
    const data = { projects: [draft], profiles: baseSnapshot().profiles, testimonials: [] };
    expect(collectImages(data, false)).toEqual(["profile/me.jpg"]);
    expect(collectImages(data, true)).toEqual(["profile/me.jpg", "harbor-tools/cover.png"]);
  });

  it("adds client logos and testimonial photos, leaving out quotes tied to a draft (spec 0006)", () => {
    const draft = publicCard("harbor-tools", { status: "draft" });
    const data = {
      projects: [draft],
      profiles: [
        profile({
          clients: [{ name: "Atlas", logo: "clients/atlas.svg", permission: "2026-01-01" }],
        }),
      ],
      testimonials: [
        testimonial("ana", { photo: { src: "testimonials/ana.jpg", alt: "" } }),
        testimonial("bo", {
          project: "harbor-tools",
          photo: { src: "testimonials/bo.jpg", alt: "" },
        }),
      ],
    };
    expect(collectImages(data, false)).toEqual([
      "profile/me.jpg",
      "clients/atlas.svg",
      "testimonials/ana.jpg",
    ]);
    expect(collectImages(data, true)).toContain("testimonials/bo.jpg");
  });
});

describe("svgHasSize (AC-12)", () => {
  it.each([
    ['<svg viewBox="0 0 10 10"></svg>', true],
    ['<svg width="10" height="20"></svg>', true],
    ['<?xml version="1.0"?>\n<svg xmlns="x"\n  viewBox="0 0 4 3">', true],
    ['<svg width="10"></svg>', false],
    ["<svg></svg>", false],
    ['<svg><rect width="1" height="1" /></svg>', false],
  ])("%s → %s", (svg, expected) => {
    expect(svgHasSize(svg)).toBe(expected);
  });
});
