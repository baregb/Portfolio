import { describe, expect, it } from "vitest";
import { parseThemeSetting, resolveTheme, THEME_SCRIPT } from "./theme.ts";

describe("parseThemeSetting", () => {
  it("keeps light and dark", () => {
    expect(parseThemeSetting("light")).toBe("light");
    expect(parseThemeSetting("dark")).toBe("dark");
  });

  it("treats system, absent, and unknown values as system", () => {
    expect(parseThemeSetting("system")).toBe("system");
    expect(parseThemeSetting(null)).toBe("system");
    expect(parseThemeSetting(undefined)).toBe("system");
    expect(parseThemeSetting("DARK")).toBe("system");
  });
});

describe("resolveTheme", () => {
  it("follows the OS only for system", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
  });
});

// Runs the real inline script against a fake document, storage, and OS.
const runScript = (stored: string | null | "throws", prefersDark: boolean) => {
  const classes = new Set<string>();
  const attributes = new Map<string, string>();
  const root = {
    classList: {
      toggle: (name: string, on: boolean) => (on ? classes.add(name) : classes.delete(name)),
    },
    style: { colorScheme: "" },
    setAttribute: (name: string, value: string) => attributes.set(name, value),
  };
  const storage = {
    getItem: () => {
      if (stored === "throws") throw new Error("blocked");
      return stored;
    },
  };
  const win = { matchMedia: () => ({ matches: prefersDark }) };
  new Function("localStorage", "window", "document", THEME_SCRIPT)(storage, win, {
    documentElement: root,
  });
  return {
    dark: classes.has("dark"),
    colorScheme: root.style.colorScheme,
    setting: attributes.get("data-theme-setting"),
  };
};

describe("THEME_SCRIPT", () => {
  it("resolves an absent setting from the OS", () => {
    expect(runScript(null, true)).toEqual({ dark: true, colorScheme: "dark", setting: "system" });
    expect(runScript(null, false)).toEqual({
      dark: false,
      colorScheme: "light",
      setting: "system",
    });
  });

  it("lets a saved choice beat the OS", () => {
    expect(runScript("light", true)).toEqual({
      dark: false,
      colorScheme: "light",
      setting: "light",
    });
    expect(runScript("dark", false)).toEqual({ dark: true, colorScheme: "dark", setting: "dark" });
  });

  it("falls back to system when storage throws or holds garbage", () => {
    expect(runScript("throws", true).setting).toBe("system");
    expect(runScript("banana", false)).toEqual({
      dark: false,
      colorScheme: "light",
      setting: "system",
    });
  });
});
