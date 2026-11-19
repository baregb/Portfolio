import { describe, expect, it } from "vitest";
import { icoFromPng, iconElement, initialsOf } from "./icon";

describe("initialsOf", () => {
  it.each([
    ["Omogbolahan Ajibare", "OA"],
    ["  ada   lovelace ", "AL"],
    ["Grace Brewster Hopper", "GH"],
    ["Cher", "C"],
    ["", ""],
  ])("%j gives %j", (name, initials) => {
    expect(initialsOf(name)).toBe(initials);
  });
});

describe("iconElement", () => {
  const colour = (token: string) => `var(${token})`;

  it("draws the initials on the green block at the requested size", () => {
    const element = iconElement("OA", 180, colour);
    expect(element.props.children).toBe("OA");
    expect(element.props.style).toMatchObject({
      width: 180,
      height: 180,
      backgroundColor: "var(block)",
      color: "var(block-ink)",
      fontFamily: "Bricolage Grotesque",
    });
  });
});

describe("icoFromPng", () => {
  const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 1, 2, 3]);

  it("writes an ICO header and one entry pointing at the PNG", () => {
    const ico = icoFromPng(png, 32);
    const view = new DataView(ico.buffer);
    expect(view.getUint16(0, true)).toBe(0);
    expect(view.getUint16(2, true)).toBe(1);
    expect(view.getUint16(4, true)).toBe(1);
    expect(ico[6]).toBe(32);
    expect(ico[7]).toBe(32);
    expect(view.getUint32(14, true)).toBe(png.length);
    expect(view.getUint32(18, true)).toBe(22);
    expect([...ico.slice(22)]).toEqual([...png]);
  });

  it("stores 256 pixels and up as 0, as the format requires", () => {
    const ico = icoFromPng(png, 256);
    expect(ico[6]).toBe(0);
    expect(ico[7]).toBe(0);
  });
});
