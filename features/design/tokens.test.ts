import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { contrastRatio, formatRatio } from "./contrast.ts";
import { CONTRAST_PAIRS, parseThemeTokens, type Theme } from "./tokens.ts";

const root = join(import.meta.dirname, "..", "..");
const css = readFileSync(join(root, "app", "globals.css"), "utf8");

describe("parseThemeTokens", () => {
  it("reads light values from @theme static and dark overrides from html.dark", () => {
    const result = parseThemeTokens(`
      @theme static { --color-*: initial; --color-bg: #fff; --color-fg: #000; --radius-x: 2px; }
      html.dark { --color-bg: #000; }
    `);
    expect(result).toEqual({
      ok: true,
      tokens: {
        light: { bg: "#fff", fg: "#000" },
        dark: { bg: "#000", fg: "#000" },
      },
    });
  });

  it("names the missing block", () => {
    expect(parseThemeTokens("html.dark { --color-bg: #000; }")).toEqual({
      ok: false,
      error: "no `@theme static { ... }` block found",
    });
    expect(parseThemeTokens("@theme static { --color-bg: #fff; }")).toEqual({
      ok: false,
      error: "no `html.dark { ... }` block found",
    });
  });
});

// AC-5: every listed pair meets AA in both themes, read from the real CSS.
describe("app/globals.css tokens", () => {
  const parsed = parseThemeTokens(css);
  if (!parsed.ok) throw new Error(parsed.error);
  const themes: readonly Theme[] = ["light", "dark"];

  it.each(themes.flatMap((theme) => CONTRAST_PAIRS.map((pair) => ({ theme, ...pair }))))(
    "$theme: $fg on $bg is at least $min:1 ($use)",
    ({ theme, fg, bg, min }) => {
      const tokens = parsed.tokens[theme];
      expect(tokens[fg], `--color-${fg} is not defined`).toBeDefined();
      expect(tokens[bg], `--color-${bg} is not defined`).toBeDefined();
      const result = contrastRatio(tokens[fg] ?? "", tokens[bg] ?? "");
      if (!result.ok) throw new Error(result.error);
      expect(
        result.ratio,
        `${theme}: --color-${fg} on --color-${bg} is ${formatRatio(result.ratio)}`,
      ).toBeGreaterThanOrEqual(min);
    },
  );
});

// AC-2: components and routes use tokens, never literal colours.
describe("no literal colours outside the token file", () => {
  const LITERAL = /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb)\(/i;
  const listFiles = (dir: string): readonly string[] =>
    (existsSync(dir) ? readdirSync(dir) : []).flatMap((name) => {
      const path = join(dir, name);
      return statSync(path).isDirectory() ? listFiles(path) : [path];
    });
  // Spec 0004, AC-14: feature components are scanned too, since pages live there.
  const files = [
    ...["components", "app"]
      .flatMap((dir) => listFiles(join(root, dir)))
      .filter((path) => /\.(tsx?|css)$/.test(path)),
    ...listFiles(join(root, "features")).filter((path) => path.endsWith(".tsx")),
  ].filter((path) => relative(root, path) !== join("app", "globals.css"));

  it.each(files.map((path) => relative(root, path)))("%s has no literal colour", (path) => {
    const lines = readFileSync(join(root, path), "utf8").split("\n");
    const hits = lines
      .map((line, index) => ({ line, number: index + 1 }))
      .filter(({ line }) => LITERAL.test(line) && !/^\s*(\/\/|\*)/.test(line));
    expect(hits.map(({ number, line }) => `${path}:${number}: ${line.trim()}`)).toEqual([]);
  });
});

// AC-1: docs/design.md mirrors the colour tokens, so a direction change that
// edits app/globals.css fails here until the design doc is updated too.
describe("docs/design.md colour table", () => {
  const parsed = parseThemeTokens(css);
  if (!parsed.ok) throw new Error(parsed.error);
  const doc = readFileSync(join(root, "docs", "design.md"), "utf8");
  const rows = Object.fromEntries(
    [...doc.matchAll(/^\| `--color-([\w-]+)` \| `([^`]+)` \| `([^`]+)` \|/gm)].map(
      ([, name, light, dark]) => [name, { light, dark }],
    ),
  );
  const names = Object.keys(parsed.tokens.light).filter(
    (name) => !["transparent", "current"].includes(name),
  );

  it("lists exactly the tokens in app/globals.css", () => {
    expect(Object.keys(rows).sort()).toEqual([...names].sort());
  });

  it.each(names)("--color-%s matches in both themes", (name) => {
    expect(rows[name]).toEqual({
      light: parsed.tokens.light[name],
      dark: parsed.tokens.dark[name],
    });
  });
});
