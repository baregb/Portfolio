// The social card layout (feature 13, spec 0001: satori at build). Pure: takes
// one page's card text and the light theme colour tokens, returns the element
// tree satori renders at 1200 by 630. It follows docs/design.md: a blueprint
// grid, a square hairline box with a mono label and a heavy Bricolage
// headline, and the deep green block carrying the name.

import type { TokenMap } from "../design/tokens.ts";
import { CARD_SIZE, type SitePage } from "./pages.ts";

/** A satori element: a plain `{ type, props }` object, no React needed. */
export type CardElement = {
  readonly type: string;
  readonly props: {
    readonly style?: Readonly<Record<string, string | number>>;
    readonly children?: string | CardElement | readonly CardElement[];
  };
};

export type CardText = SitePage["card"] & { readonly description: string };
/** Who the card belongs to, and the host it links to (e.g. `example.com`). */
export type CardFooter = { readonly name: string; readonly host: string };

/** The token names the card reads, so a missing one fails the build by name. */
export const CARD_TOKENS = [
  "bg",
  "surface",
  "fg",
  "muted",
  "line",
  "grid",
  "accent",
  "block",
  "block-ink",
  "block-muted",
] as const;

/** Cuts text at a word boundary so it fits, ending with an ellipsis. */
export const truncate = (text: string, max: number): string => {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > max / 2 ? cut.slice(0, space) : cut).replace(/[\s,.;:·-]+$/, "")}…`;
};

/** Shorter headlines get bigger type; long ones step down so they stay on three lines. */
export const headingSize = (heading: string): number =>
  heading.length <= 22 ? 96 : heading.length <= 40 ? 80 : heading.length <= 64 ? 64 : 56;

const BAND_HEIGHT = 112;
const INSET = 48;

const el = (
  type: string,
  style: Readonly<Record<string, string | number>>,
  children?: CardElement["props"]["children"],
): CardElement => ({ type, props: { style, ...(children === undefined ? {} : { children }) } });

export const cardElement = (
  text: CardText,
  footer: CardFooter,
  colour: (token: (typeof CARD_TOKENS)[number]) => string,
): CardElement => {
  const heading = truncate(text.heading, 90);
  return el(
    "div",
    {
      width: CARD_SIZE.width,
      height: CARD_SIZE.height,
      display: "flex",
      flexDirection: "column",
      backgroundColor: colour("bg"),
      backgroundImage: `linear-gradient(to right, ${colour("grid")} 1px, transparent 1px), linear-gradient(to bottom, ${colour("grid")} 1px, transparent 1px)`,
      backgroundSize: "24px 24px",
      fontFamily: "Geist",
    },
    [
      // Satori misreads three value shorthands and adds padding on top of a
      // set width or height, so sides are explicit and flex does the sizing.
      el(
        "div",
        {
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          flexGrow: 1,
          minHeight: 0,
          marginTop: INSET,
          marginLeft: INSET,
          marginRight: INSET,
          backgroundColor: colour("surface"),
          border: `1px solid ${colour("line")}`,
          paddingTop: 48,
          paddingBottom: 48,
          paddingLeft: 56,
          paddingRight: 56,
        },
        [
          el("div", { display: "flex", alignItems: "center", gap: 16 }, [
            el("div", { width: 14, height: 14, backgroundColor: colour("accent") }),
            el(
              "div",
              {
                fontFamily: "Geist Mono",
                fontWeight: 500,
                fontSize: 24,
                letterSpacing: 3,
                textTransform: "uppercase",
                color: colour("accent"),
              },
              truncate(text.label, 60),
            ),
          ]),
          el("div", { display: "flex", flexDirection: "column", gap: 24 }, [
            el(
              "div",
              {
                fontFamily: "Bricolage Grotesque",
                fontWeight: 800,
                fontSize: headingSize(heading),
                lineHeight: 0.95,
                letterSpacing: -2,
                color: colour("fg"),
                maxWidth: 1000,
              },
              heading,
            ),
            el(
              "div",
              { fontSize: 28, lineHeight: 1.35, color: colour("muted"), maxWidth: 960 },
              truncate(text.description, 150),
            ),
          ]),
        ],
      ),
      el(
        "div",
        {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: BAND_HEIGHT,
          flexShrink: 0,
          paddingLeft: INSET + 56,
          paddingRight: INSET + 56,
          backgroundColor: colour("block"),
        },
        [
          el(
            "div",
            {
              fontFamily: "Bricolage Grotesque",
              fontWeight: 700,
              fontSize: 36,
              letterSpacing: -0.5,
              color: colour("block-ink"),
            },
            footer.name,
          ),
          el(
            "div",
            {
              fontFamily: "Geist Mono",
              fontSize: 24,
              fontWeight: 500,
              color: colour("block-muted"),
            },
            footer.host,
          ),
        ],
      ),
    ],
  );
};

/** A colour lookup over the theme tokens that fails, naming the token, if one is missing. */
export const cardColours = (
  tokens: TokenMap,
):
  | { readonly ok: true; readonly colour: (token: (typeof CARD_TOKENS)[number]) => string }
  | { readonly ok: false; readonly error: string } => {
  const missing = CARD_TOKENS.filter((token) => !tokens[token]);
  if (missing.length > 0) {
    return {
      ok: false,
      error: `colour tokens missing from app/globals.css: ${missing.join(", ")}`,
    };
  }
  return { ok: true, colour: (token) => tokens[token] as string };
};
