// The site icon (feature 15): the owner's initials in heavy Bricolage on the
// deep green block, so a browser tab or home screen shows the same mark as
// the social card's name band. Pure: the element tree for satori, plus the
// few bytes that wrap a PNG as a `.ico` file. The card script renders it.

import type { CARD_TOKENS, CardElement } from "./card.ts";

/** What the build writes into `public/`, and the size of each square PNG. */
export const ICON_FILES = {
  favicon: { file: "favicon.ico", size: 32 },
  icon: { file: "icon.png", size: 512 },
  apple: { file: "apple-icon.png", size: 180 },
} as const;

/** `Omogbolahan Ajibare` → `OA`: the first letter of the first and last words. */
export const initialsOf = (name: string): string => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = words[0]?.[0] ?? "";
  const last = words.length > 1 ? (words.at(-1)?.[0] ?? "") : "";
  return `${first}${last}`.toUpperCase();
};

export const iconElement = (
  initials: string,
  size: number,
  colour: (token: (typeof CARD_TOKENS)[number]) => string,
): CardElement => ({
  type: "div",
  props: {
    style: {
      width: size,
      height: size,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colour("block"),
      color: colour("block-ink"),
      fontFamily: "Bricolage Grotesque",
      fontWeight: 800,
      // Two letters fill about two thirds of the square; tight tracking keeps
      // them one mark at 16 pixels.
      fontSize: Math.round(size * 0.5),
      letterSpacing: -Math.round(size * 0.03),
      lineHeight: 1,
    },
    children: initials,
  },
});

/**
 * Wraps one square PNG as a `.ico` file. Every current browser reads a PNG
 * stored inside an ICO, so `/favicon.ico` needs no separate bitmap encoder.
 * Layout: a 6 byte header, one 16 byte directory entry, then the PNG.
 */
export const icoFromPng = (png: Uint8Array, size: number): Uint8Array => {
  const HEADER = 6;
  const ENTRY = 16;
  const ico = new Uint8Array(HEADER + ENTRY + png.length);
  const view = new DataView(ico.buffer);
  view.setUint16(0, 0, true); // reserved
  view.setUint16(2, 1, true); // type: icon
  view.setUint16(4, 1, true); // one image
  view.setUint8(6, size >= 256 ? 0 : size); // width (0 means 256)
  view.setUint8(7, size >= 256 ? 0 : size); // height
  view.setUint8(8, 0); // no palette
  view.setUint8(9, 0); // reserved
  view.setUint16(10, 1, true); // colour planes
  view.setUint16(12, 32, true); // bits per pixel
  view.setUint32(14, png.length, true); // image size
  view.setUint32(18, HEADER + ENTRY, true); // image offset
  ico.set(png, HEADER + ENTRY);
  return ico;
};
