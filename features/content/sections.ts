import type { Nodes } from "mdast";
import { fromMarkdown } from "mdast-util-from-markdown";
import { SECTIONS, type SectionKey } from "./rules.ts";

// Splits a public flagship's MDX body into its six fixed sections (spec 0002).
// Splits on depth 2 heading nodes from a real Markdown parse, never a line
// regex, so `##` inside a code block is just code and a setext heading counts.

export type SectionSources = Readonly<Record<SectionKey, string>>;

export type SplitResult =
  | { readonly ok: true; readonly sections: SectionSources }
  | { readonly ok: false; readonly error: string };

const plainText = (node: Nodes): string =>
  "value" in node && typeof node.value === "string"
    ? node.value
    : "children" in node
      ? node.children.map(plainText).join("")
      : "";

const expectedHeadings = SECTIONS.map((section) => section.heading);
const quoted = (headings: readonly string[]) => headings.map((h) => `"## ${h}"`).join(", ");

export function splitSections(markdown: string): SplitResult {
  const tree = fromMarkdown(markdown);
  const headings = tree.children.flatMap((node) =>
    node.type === "heading" && node.depth === 2 && node.position
      ? [
          {
            text: plainText(node).trim(),
            start: node.position.start.offset ?? 0,
            end: node.position.end.offset ?? 0,
          },
        ]
      : [],
  );

  if (markdown.trim() === "") {
    return {
      ok: false,
      error: `body is empty; a public flagship needs these sections: ${quoted(expectedHeadings)}`,
    };
  }
  const first = headings[0];
  if (!first) {
    return {
      ok: false,
      error: `body has no sections; it needs these H2 headings: ${quoted(expectedHeadings)}`,
    };
  }
  if (markdown.slice(0, first.start).trim() !== "") {
    return { ok: false, error: `body has text before the first section ("## ${first.text}")` };
  }

  const unknown = headings.filter((heading) => !expectedHeadings.some((h) => h === heading.text));
  if (unknown.length > 0) {
    return {
      ok: false,
      error: `unknown section ${quoted(unknown.map((h) => h.text))}; the sections are ${quoted(expectedHeadings)}`,
    };
  }
  const found = headings.map((heading) => heading.text);
  const duplicated = expectedHeadings.filter((h) => found.filter((text) => text === h).length > 1);
  if (duplicated.length > 0) {
    return { ok: false, error: `duplicated section ${quoted(duplicated)}` };
  }
  const missing = expectedHeadings.filter((h) => !found.includes(h));
  if (missing.length > 0) {
    return { ok: false, error: `missing section ${quoted(missing)}` };
  }
  if (found.some((text, index) => text !== expectedHeadings[index])) {
    return {
      ok: false,
      error: `sections are out of order; use this order: ${quoted(expectedHeadings)}`,
    };
  }

  const slices = headings.map((heading, index) =>
    markdown.slice(heading.end, headings[index + 1]?.start ?? markdown.length).trim(),
  );
  const empty = expectedHeadings.filter((_, index) => slices[index] === "");
  if (empty.length > 0) {
    return { ok: false, error: `empty section ${quoted(empty)}` };
  }

  const sections = Object.fromEntries(
    SECTIONS.map((section, index) => [section.key, slices[index] ?? ""]),
  ) as Record<SectionKey, string>;
  return { ok: true, sections };
}

/** Cards and on request projects must have an empty body; returns why not, if not. */
export const bodyTextError = (
  project: { readonly depth: "flagship" | "card"; readonly visibility: "public" | "onRequest" },
  content: string,
): string | undefined =>
  content.trim() === ""
    ? undefined
    : project.depth === "card"
      ? "a card must have no body text"
      : "an on request project must have no body text (use brief)";
