// Reads the colour tokens out of app/globals.css (spec 0003, AC-2, AC-5).
// Pure: takes the CSS text, returns the light and dark values by token name.
// Light values come from the `@theme static` block, dark values from the
// `html.dark` block. A dark block may omit a token; it then keeps its light value.

export type Theme = "light" | "dark";
export type TokenMap = Readonly<Record<string, string>>;
export type ThemeTokens = Readonly<Record<Theme, TokenMap>>;

export type ParseResult =
  | { readonly ok: true; readonly tokens: ThemeTokens }
  | { readonly ok: false; readonly error: string };

/** The body of the first `{ ... }` block opened right after `selector`. */
const blockAfter = (css: string, selector: string): string | null => {
  const start = css.indexOf(`${selector} {`);
  if (start === -1) return null;
  const open = css.indexOf("{", start);
  const close = [...css.slice(open)].reduce<{ depth: number; at: number }>(
    (state, char, index) => {
      if (state.at !== -1) return state;
      const depth = char === "{" ? state.depth + 1 : char === "}" ? state.depth - 1 : state.depth;
      return { depth, at: depth === 0 ? index : -1 };
    },
    { depth: 0, at: -1 },
  ).at;
  return close === -1 ? null : css.slice(open + 1, open + close);
};

const colourTokens = (block: string): TokenMap =>
  Object.fromEntries(
    [...block.matchAll(/--color-([\w-]+):\s*([^;]+);/g)]
      .filter(([, name]) => name !== "*")
      .map(([, name, value]) => [name, value.trim()]),
  );

export const parseThemeTokens = (css: string): ParseResult => {
  const light = blockAfter(css, "@theme static");
  if (light === null) return { ok: false, error: "no `@theme static { ... }` block found" };
  const dark = blockAfter(css, "html.dark");
  if (dark === null) return { ok: false, error: "no `html.dark { ... }` block found" };
  const lightTokens = colourTokens(light);
  return {
    ok: true,
    tokens: { light: lightTokens, dark: { ...lightTokens, ...colourTokens(dark) } },
  };
};

/**
 * Every text or meaningful boundary pair that must meet AA in both themes.
 * `min` is 4.5 for normal text, 3 for large text and UI boundaries.
 */
export const CONTRAST_PAIRS: readonly {
  readonly fg: string;
  readonly bg: string;
  readonly min: 3 | 4.5;
  readonly use: string;
}[] = [
  { fg: "fg", bg: "bg", min: 4.5, use: "body text" },
  { fg: "fg", bg: "surface", min: 4.5, use: "text in boxes" },
  { fg: "muted", bg: "bg", min: 4.5, use: "secondary text" },
  { fg: "muted", bg: "surface", min: 4.5, use: "secondary text in boxes" },
  { fg: "accent", bg: "bg", min: 4.5, use: "links and key numbers" },
  { fg: "accent", bg: "surface", min: 4.5, use: "links in boxes" },
  { fg: "danger", bg: "bg", min: 4.5, use: "error text" },
  { fg: "danger", bg: "surface", min: 4.5, use: "error text in boxes" },
  { fg: "accent-ink", bg: "accent", min: 4.5, use: "primary button label" },
  { fg: "accent", bg: "accent-soft", min: 3, use: "highlighted hero phrase (large)" },
  { fg: "fg", bg: "accent-soft", min: 4.5, use: "success toast and selected nav" },
  { fg: "muted", bg: "accent-soft", min: 4.5, use: "secondary text on selected" },
  { fg: "fg", bg: "danger-soft", min: 4.5, use: "error toast" },
  { fg: "block-ink", bg: "block", min: 4.5, use: "text on the green block" },
  { fg: "block-muted", bg: "block", min: 4.5, use: "secondary text on the green block" },
  { fg: "line-strong", bg: "bg", min: 3, use: "input borders" },
  { fg: "line-strong", bg: "surface", min: 3, use: "input borders in boxes" },
  { fg: "accent", bg: "surface", min: 3, use: "focus ring" },
];
