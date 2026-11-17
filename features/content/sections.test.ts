import { describe, expect, it } from "vitest";
import { SECTIONS } from "./rules.ts";
import { bodyTextError, splitSections } from "./sections.ts";

// AC-1, AC-3: the six fixed sections, split on real H2 heading nodes.

const body = (headings: readonly string[] = SECTIONS.map((s) => s.heading)) =>
  headings.map((heading) => `## ${heading}\n\nText for ${heading}.`).join("\n\n");

const errorOf = (markdown: string) => {
  const result = splitSections(markdown);
  return result.ok ? undefined : result.error;
};

describe("splitSections", () => {
  it("splits a complete body into six sections by key, headings removed", () => {
    const result = splitSections(body());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(Object.keys(result.sections)).toEqual(SECTIONS.map((s) => s.key));
    expect(result.sections.problem).toBe("Text for Problem.");
    expect(result.sections.ai).toBe("Text for How AI was used.");
  });

  it("keeps H3 and deeper inside a section", () => {
    const markdown = body().replace("Text for Constraints.", "### Budget\n\nSmall.");
    const result = splitSections(markdown);
    expect(result.ok && result.sections.constraints).toBe("### Budget\n\nSmall.");
  });

  it("ignores ## inside a code fence", () => {
    const markdown = body().replace(
      "Text for What I built.",
      "```md\n## Problem\n## Not a heading\n```",
    );
    const result = splitSections(markdown);
    expect(result.ok).toBe(true);
    expect(result.ok && result.sections.built).toContain("## Not a heading");
  });

  it("treats a setext H2 as a heading", () => {
    const markdown = body().replace("## Problem", "Problem\n-------");
    expect(splitSections(markdown).ok).toBe(true);
  });

  it("matches headings after trimming", () => {
    expect(splitSections(body().replace("## Results", "##   Results   ")).ok).toBe(true);
  });

  it("rejects an empty body", () => {
    expect(errorOf("")).toMatch(/body is empty/);
  });

  it("rejects a body with no H2", () => {
    expect(errorOf("Just some text.")).toMatch(/no sections/);
  });

  it("rejects text before the first H2", () => {
    expect(errorOf(`Intro line.\n\n${body()}`)).toMatch(/text before the first section/);
  });

  it("rejects a missing section, naming it", () => {
    const headings = SECTIONS.map((s) => s.heading).filter((h) => h !== "Constraints");
    expect(errorOf(body(headings))).toMatch(/missing section "## Constraints"/);
  });

  it("rejects a duplicated section, naming it", () => {
    const headings = [...SECTIONS.map((s) => s.heading), "Results"];
    expect(errorOf(body(headings))).toMatch(/duplicated section "## Results"/);
  });

  it("rejects sections out of order", () => {
    const [first, second, ...rest] = SECTIONS.map((s) => s.heading);
    expect(errorOf(body([second ?? "", first ?? "", ...rest]))).toMatch(/out of order/);
  });

  it("rejects an unknown H2, naming it", () => {
    const headings = [...SECTIONS.map((s) => s.heading), "Extras"];
    expect(errorOf(body(headings))).toMatch(/unknown section "## Extras"/);
  });

  it("rejects an empty section, naming it", () => {
    const markdown = body().replace("Text for Decision and tradeoffs.", "");
    expect(errorOf(markdown)).toMatch(/empty section "## Decision and tradeoffs"/);
  });
});

describe("bodyTextError (AC-2, AC-4)", () => {
  it("allows an empty or whitespace only body", () => {
    expect(bodyTextError({ depth: "card", visibility: "public" }, "  \n ")).toBeUndefined();
  });

  it("rejects body text on a card of either visibility", () => {
    expect(bodyTextError({ depth: "card", visibility: "public" }, "Hi")).toMatch(/card/);
    expect(bodyTextError({ depth: "card", visibility: "onRequest" }, "Hi")).toMatch(/card/);
  });

  it("rejects body text on an on request flagship", () => {
    expect(bodyTextError({ depth: "flagship", visibility: "onRequest" }, "Hi")).toMatch(
      /on request project must have no body text/,
    );
  });
});
