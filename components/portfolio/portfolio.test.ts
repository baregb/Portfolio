import { describe, expect, it } from "vitest";
import {
  baseSnapshot,
  onRequestCard,
  onRequestFlagship,
  publicCard,
  publicFlagship,
} from "../../features/content/fixtures.ts";
import type { ContentSnapshot } from "../../features/content/check.ts";
import { createContentReader } from "../../features/content/read.ts";
import type { Project } from "../../features/content/types.ts";
import { enquiryHref } from "./enquiry.ts";
import {
  availabilityLabel,
  countLabel,
  formatPeriod,
  projectAvailabilityLabel,
  serialNumber,
  testimonialRole,
} from "./format.ts";
import { toLibraryItem } from "./library-item.ts";
import {
  displayAddress,
  profileLinks,
  projectAnchor,
  projectHref,
  projectLinks,
  requestHref,
} from "./links.ts";

// Pure helpers shared by the Journey 1 pages (spec 0004, "API surface").

const resolved = (projects: ContentSnapshot["projects"]): readonly Project[] => {
  const base = baseSnapshot();
  return createContentReader(baseSnapshot({ projects, files: base.files }), true).getProjects();
};

const project = (slug: string): Project => {
  const found = createContentReader(baseSnapshot(), true).getProject(slug);
  if (!found) throw new Error(`fixture ${slug} missing`);
  return found;
};

describe("formatPeriod (AC-17)", () => {
  it.each([
    [{ start: "2026-06", end: "2026-09" }, "Jun 2026 to Sep 2026"],
    [{ start: "2025-12", end: "2026-01" }, "Dec 2025 to Jan 2026"],
    [{ start: "2026-09", end: null }, "Sep 2026 to now"],
    [{ start: "2024-03", end: "2024-03" }, "Mar 2024"],
    [{ start: "2020-01", end: "2020-12" }, "Jan 2020 to Dec 2020"],
  ])("%j → %s", (period, expected) => {
    expect(formatPeriod(period)).toBe(expected);
  });
});

describe("availabilityLabel (AC-16)", () => {
  it.each([
    ["open", "Open to new roles"],
    ["selective", "Open to the right role"],
    ["unavailable", "Not looking right now"],
  ] as const)("%s → %s", (status, label) => {
    expect(availabilityLabel(status)).toBe(label);
  });
});

describe("countLabel", () => {
  it("uses the singular for one", () => {
    expect(countLabel(1, "project")).toBe("1 project");
    expect(countLabel(0, "project")).toBe("0 projects");
    expect(countLabel(3, "project")).toBe("3 projects");
  });
});

describe("project links (spec 0004, API surface)", () => {
  it("points a flagship at its case study and a card at nothing", () => {
    expect(projectHref(project("atlas-shop"))).toBe("/work/atlas-shop");
    expect(projectHref(project("quiet-ledger"))).toBe("/work/quiet-ledger");
    expect(projectHref(project("harbor-tools"))).toBeNull();
  });

  it("anchors a card in the library", () => {
    expect(projectAnchor(project("atlas-shop"))).toBe("/work/atlas-shop");
    expect(projectAnchor(project("harbor-tools"))).toBe("/work#project-harbor-tools");
    expect(projectAnchor(project("small-sync"))).toBe("/work#project-small-sync");
  });

  it("gives only on request projects a request page", () => {
    expect(requestHref(project("quiet-ledger"))).toBe("/request/quiet-ledger");
    expect(requestHref(project("small-sync"))).toBe("/request/small-sync");
    expect(requestHref(project("atlas-shop"))).toBeNull();
    expect(requestHref(project("harbor-tools"))).toBeNull();
  });

  it("lists live, repository, then extra links, and none on request", () => {
    const [card] = resolved([
      publicCard("harbor-tools", {
        links: {
          repo: "https://example.com/repo",
          live: "https://example.com",
          other: [{ label: "Talk", url: "https://example.com/talk" }],
        },
      }),
    ]);
    expect(card && projectLinks(card)).toEqual([
      { label: "Live site", href: "https://example.com" },
      { label: "Repository", href: "https://example.com/repo" },
      { label: "Talk", href: "https://example.com/talk" },
    ]);
    expect(projectLinks(project("quiet-ledger"))).toEqual([]);
    expect(projectLinks(project("atlas-shop"))).toEqual([]);
  });

  it("labels profile links by kind and shows a short address", () => {
    expect(
      profileLinks({
        links: [
          { kind: "github", url: "https://github.com/ada" },
          { kind: "linkedin", url: "https://www.linkedin.com/in/ada/" },
          { kind: "website", url: "https://ada.example" },
        ],
      }),
    ).toEqual([
      { label: "GitHub", href: "https://github.com/ada" },
      { label: "LinkedIn", href: "https://www.linkedin.com/in/ada/" },
      { label: "Website", href: "https://ada.example" },
    ]);
    expect(displayAddress("https://www.linkedin.com/in/ada/")).toBe("linkedin.com/in/ada");
    expect(displayAddress("https://github.com/ada")).toBe("github.com/ada");
  });
});

describe("toLibraryItem (AC-7)", () => {
  it("builds a public flagship card that links to its case study", () => {
    expect(toLibraryItem(project("atlas-shop"))).toEqual({
      slug: "atlas-shop",
      title: "Title atlas-shop",
      summary: "Summary atlas-shop",
      category: "Commerce",
      clientLabel: "an invented retailer",
      period: "Jan 2024 to Jun 2024",
      headlineResult: { value: "2x", label: "faster checkout" },
      stack: ["Next.js"],
      badge: "case-study",
      href: "/work/atlas-shop",
      requestHref: null,
      links: [],
      categorySlugs: ["commerce"],
      lensSlugs: ["architect", "developer"],
      stackSlugs: ["nextjs"],
    });
  });

  it("marks on request projects and never carries their links", () => {
    expect(toLibraryItem(project("quiet-ledger"))).toMatchObject({
      badge: "on-request",
      href: "/work/quiet-ledger",
      requestHref: "/request/quiet-ledger",
      links: [],
    });
    expect(toLibraryItem(project("small-sync"))).toMatchObject({
      badge: "on-request",
      href: null,
      requestHref: "/request/small-sync",
    });
  });

  it("gives a public card no badge, its links, and no headline result when it has none", () => {
    const [card] = resolved([
      publicCard("harbor-tools", { links: { live: "https://example.com" } }),
    ]);
    const item = card ? toLibraryItem(card) : undefined;
    expect(item).toMatchObject({
      badge: null,
      href: null,
      links: [{ label: "Live site", href: "https://example.com" }],
    });
    expect(item).not.toHaveProperty("headlineResult");
  });

  it("shows at most four stack names and matches AI tools in the stack filter", () => {
    const [shop] = resolved([
      publicFlagship("atlas-shop", {
        stack: ["nextjs", "postgres", "nextjs", "postgres", "nextjs"],
        aiTools: ["claude"],
      }),
    ]);
    const item = shop ? toLibraryItem(shop) : undefined;
    expect(item?.stack).toHaveLength(4);
    expect(item?.stackSlugs).toContain("claude");
  });

  it("works for every variant", () => {
    const items = resolved([
      publicFlagship("atlas-shop"),
      publicCard("harbor-tools"),
      onRequestFlagship("quiet-ledger"),
      onRequestCard("small-sync"),
    ]).map(toLibraryItem);
    expect(Object.fromEntries(items.map((item) => [item.slug, item.badge]))).toEqual({
      "atlas-shop": "case-study",
      "harbor-tools": null,
      "quiet-ledger": "on-request",
      "small-sync": "on-request",
    });
  });
});

describe("spec 0006 helpers", () => {
  it("labels project availability for clients (AC-13)", () => {
    expect(projectAvailabilityLabel("open")).toBe("Taking on new projects");
    expect(projectAvailabilityLabel("limited")).toBe("Booking a few weeks out");
    expect(projectAvailabilityLabel("closed")).toBe("Not taking projects right now");
  });

  it("builds the enquiry link (AC-14)", () => {
    expect(enquiryHref()).toBe("/contact?topic=project");
    expect(enquiryHref("web-performance-seo")).toBe(
      "/contact?topic=project&service=web-performance-seo",
    );
  });

  it("encodes the service and drops an empty one (AC-14)", () => {
    expect(enquiryHref("a&b c")).toBe("/contact?topic=project&service=a%26b%20c");
    expect(enquiryHref("")).toBe("/contact?topic=project");
  });

  it("numbers lists from 01 (AC-6, AC-10)", () => {
    expect([0, 1, 2, 9].map(serialNumber)).toEqual(["01", "02", "03", "10"]);
  });

  it("joins a quote's role and company (AC-8)", () => {
    expect(testimonialRole({ role: "Founder", company: "Atlas" })).toBe("Founder · Atlas");
    expect(testimonialRole({ company: "Atlas" })).toBe("Atlas");
    expect(testimonialRole({})).toBe("");
  });
});
