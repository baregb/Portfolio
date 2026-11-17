// Theme setting rules (spec 0003, AC-4). The setting is what the visitor
// picked; the resolved theme is what the page shows. `system` follows the OS.

export type ThemeSetting = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "theme";
export const THEME_SETTINGS: readonly ThemeSetting[] = ["system", "light", "dark"];

/** Anything other than a known setting (absent, garbage) means `system`. */
export const parseThemeSetting = (value: string | null | undefined): ThemeSetting =>
  value === "light" || value === "dark" ? value : "system";

export const resolveTheme = (setting: ThemeSetting, prefersDark: boolean): ResolvedTheme =>
  setting === "system" ? (prefersDark ? "dark" : "light") : setting;

/**
 * Runs inline in <head> before first paint, so no page flashes the wrong
 * theme. It repeats `parseThemeSetting` and `resolveTheme` in plain ES5
 * because it cannot import; `theme.test.ts` runs this exact string to keep
 * the two in step. Storage can throw (private mode, blocked site data).
 */
export const THEME_SCRIPT = `(function(){var s=null;try{s=localStorage.getItem("${THEME_STORAGE_KEY}")}catch(e){}var m=s==="light"||s==="dark"?s:"system";var d=m==="dark"||(m==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);var r=document.documentElement;r.classList.toggle("dark",d);r.style.colorScheme=d?"dark":"light";r.setAttribute("data-theme-setting",m)})()`;
