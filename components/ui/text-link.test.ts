import { createElement, type ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TextLink } from "./text-link";

// The inline link: internal links stay in the tab, external ones open a new
// tab and say so to screen readers (WCAG 3.2.5 advice, spec 0003).

const render = (props: { href: string; external?: boolean }, label = "LinkedIn") =>
  // The label goes in as children (the third argument); the cast only tells
  // TypeScript the props are complete once it arrives.
  renderToStaticMarkup(
    createElement(TextLink, props as ComponentProps<typeof TextLink>, label),
  ).replace(/ class="[^"]*"/g, "");

/** Text a screen reader reads for the link: every text node, aria-hidden parts left out. */
const accessibleName = (html: string) =>
  html
    .replace(/<svg[^>]*aria-hidden="true"[^>]*>.*?<\/svg>/g, "")
    .replace(/<[^>]+>/g, "")
    .trim();

describe("TextLink, external", () => {
  it("opens in a new tab without giving the new page a handle on this one", () => {
    const html = render({ href: "https://www.linkedin.com/in/example", external: true });
    expect(html).toMatch(/^<a href="https:\/\/www\.linkedin\.com\/in\/example"/);
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it("tells screen readers it opens in a new tab", () => {
    const html = render({ href: "https://example.com", external: true });
    expect(accessibleName(html)).toBe("LinkedIn (opens in a new tab)");
  });

  it("hides the arrow icon from screen readers", () => {
    const html = render({ href: "https://example.com", external: true });
    expect(html).toMatch(/<svg[^>]*aria-hidden="true"/);
  });
});

describe("TextLink, internal", () => {
  it("stays in the same tab with no new tab note", () => {
    const html = render({ href: "/work" }, "Work");
    expect(html).toBe('<a href="/work">Work</a>');
  });
});
