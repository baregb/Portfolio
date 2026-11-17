// WCAG 2.2 contrast maths (spec 0003, AC-5). Pure functions only, shared by
// the token test and the /styleguide swatches so both report the same ratio.

export type ContrastResult =
  { readonly ok: true; readonly ratio: number } | { readonly ok: false; readonly error: string };

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

const channel = (value: number): number => {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

const toRgb = (hex: string): readonly [number, number, number] | null => {
  if (!HEX.test(hex)) return null;
  const body = hex.slice(1);
  const full =
    body.length === 3
      ? body
          .split("")
          .map((c) => c + c)
          .join("")
      : body;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as unknown as readonly [
    number,
    number,
    number,
  ];
};

const luminance = ([r, g, b]: readonly [number, number, number]): number =>
  0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);

/** The WCAG contrast ratio of two opaque hex colours, from 1 to 21. */
export const contrastRatio = (foreground: string, background: string): ContrastResult => {
  const fg = toRgb(foreground);
  const bg = toRgb(background);
  if (!fg) return { ok: false, error: `not an opaque hex colour: ${foreground}` };
  if (!bg) return { ok: false, error: `not an opaque hex colour: ${background}` };
  const [light, dark] = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
  return { ok: true, ratio: (light + 0.05) / (dark + 0.05) };
};

/** Rounds a ratio down to two decimals, so 4.499 never displays as a pass. */
export const formatRatio = (ratio: number): string =>
  `${(Math.floor(ratio * 100) / 100).toFixed(2)}:1`;
