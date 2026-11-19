import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseThemeTokens } from "../design/tokens";
import {
  CARD_TOKENS,
  cardColours,
  cardElement,
  headingSize,
  truncate,
  type CardElement,
} from "./card";

describe("truncate", () => {
  it("leaves short text alone and collapses whitespace", () => {
    expect(truncate("  A  short\nline ", 40)).toBe("A short line");
  });

  it("cuts long text at a word boundary with an ellipsis, within the limit", () => {
    const text = "Moving a charity's member, attendance, and progress records into a new app";
    const cut = truncate(text, 40);
    expect(cut.length).toBeLessThanOrEqual(40);
    expect(cut.endsWith("…")).toBe(true);
    expect(text.startsWith(cut.slice(0, -1))).toBe(true);
    expect(cut).not.toMatch(/[\s,]…$/);
  });
});

describe("headingSize", () => {
  it("steps the type down as the headline grows", () => {
    const sizes = [10, 30, 50, 80].map((length) => headingSize("x".repeat(length)));
    expect(sizes).toEqual([96, 80, 64, 56]);
  });
});

describe("cardColours", () => {
  it("reads every card colour from the real light theme in app/globals.css", () => {
    const css = readFileSync(join(import.meta.dirname, "..", "..", "app", "globals.css"), "utf8");
    const tokens = parseThemeTokens(css);
    expect(tokens.ok).toBe(true);
    const colours = tokens.ok ? cardColours(tokens.tokens.light) : null;
    expect(colours?.ok).toBe(true);
    if (colours?.ok) {
      for (const token of CARD_TOKENS) expect(colours.colour(token), token).not.toBe("");
    }
  });

  it("fails naming the tokens that are missing", () => {
    const result = cardColours({ bg: "#fff", fg: "#000" });
    expect(result.ok).toBe(false);
    expect(!result.ok && result.error).toMatch(/surface, muted, line/);
  });
});

describe("cardElement", () => {
  const texts = (node: CardElement): readonly string[] => {
    const { children } = node.props;
    if (typeof children === "string") return [children];
    if (!children) return [];
    return (Array.isArray(children) ? children : [children]).flatMap((child: CardElement) =>
      texts(child),
    );
  };

  it("shows the label, heading, description, name, and host at 1200 by 630", () => {
    const card = cardElement(
      { label: "Role lens", heading: "AI assisted builder", description: "I ship faster." },
      { name: "Ada Lovelace", host: "example.com" },
      () => "#123456",
    );
    expect(card.props.style).toMatchObject({ width: 1200, height: 630 });
    expect(texts(card)).toEqual([
      "Role lens",
      "AI assisted builder",
      "I ship faster.",
      "Ada Lovelace",
      "example.com",
    ]);
  });
});
