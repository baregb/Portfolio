import { describe, expect, it } from "vitest";
import { contrastRatio, formatRatio } from "./contrast.ts";

describe("contrastRatio", () => {
  it("gives 21:1 for black on white", () => {
    const result = contrastRatio("#000000", "#ffffff");
    expect(result.ok && result.ratio).toBeCloseTo(21, 5);
  });

  it("gives 1:1 for a colour on itself, in either order", () => {
    const result = contrastRatio("#1d6b48", "#1d6b48");
    expect(result.ok && result.ratio).toBeCloseTo(1, 5);
  });

  it("is symmetric", () => {
    const a = contrastRatio("#4f5f57", "#f4f7f5");
    const b = contrastRatio("#f4f7f5", "#4f5f57");
    expect(a.ok && b.ok && a.ratio).toBeCloseTo(b.ok ? b.ratio : 0, 10);
  });

  it("expands three digit hex", () => {
    const short = contrastRatio("#fff", "#000");
    expect(short.ok && short.ratio).toBeCloseTo(21, 5);
  });

  it("rejects colours that are not opaque hex", () => {
    expect(contrastRatio("rgb(0 0 0 / 0.5)", "#fff")).toEqual({
      ok: false,
      error: "not an opaque hex colour: rgb(0 0 0 / 0.5)",
    });
    expect(contrastRatio("#fff", "red").ok).toBe(false);
  });
});

describe("formatRatio", () => {
  it("rounds down so a near miss never reads as a pass", () => {
    expect(formatRatio(4.499)).toBe("4.49:1");
    expect(formatRatio(7)).toBe("7.00:1");
  });
});
