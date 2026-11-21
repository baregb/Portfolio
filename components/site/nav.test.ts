import { describe, expect, it } from "vitest";
import { isServicesPath, navItemsFor } from "./nav.ts";

// Spec 0006, AC-5b and AC-12: Services joins the nav only once a service is
// published, and the menu speaks to clients on every services page.

describe("navItemsFor", () => {
  it("reads Work, Services, About, Contact when a service is published (AC-12)", () => {
    expect(navItemsFor(true)).toEqual([
      { href: "/work", label: "Work" },
      { href: "/services", label: "Services" },
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
    ]);
  });

  it("leaves Services out while every service is a draft (AC-5b)", () => {
    expect(navItemsFor(false).map((item) => item.label)).toEqual(["Work", "About", "Contact"]);
  });

  it("never lists the styleguide or a lens", () => {
    const hrefs = [...navItemsFor(true), ...navItemsFor(false)].map((item) => item.href);
    expect(hrefs).not.toContain("/styleguide");
    expect(hrefs.some((href) => href.startsWith("/for/"))).toBe(false);
  });
});

describe("isServicesPath (AC-12)", () => {
  it.each(["/services", "/services/", "/services/web-performance-seo"])(
    "treats %j as a services page",
    (pathname) => {
      expect(isServicesPath(pathname)).toBe(true);
    },
  );

  it.each(["/", "/work", "/contact", "/servicesx", "/services-old", "/work/services"])(
    "treats %j as a role page",
    (pathname) => {
      expect(isServicesPath(pathname)).toBe(false);
    },
  );
});
