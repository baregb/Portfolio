"use client";

import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react";
import { useEffect, useId, useSyncExternalStore } from "react";
import {
  parseThemeSetting,
  resolveTheme,
  THEME_SETTINGS,
  THEME_STORAGE_KEY,
  type ThemeSetting,
} from "@/features/design/theme";
import { cx } from "@/components/ui/cx";

const DARK_QUERY = "(prefers-color-scheme: dark)";

const OPTIONS: Readonly<
  Record<ThemeSetting, { readonly label: string; readonly icon: LucideIcon }>
> = {
  system: { label: "System", icon: Monitor },
  light: { label: "Light", icon: Sun },
  dark: { label: "Dark", icon: Moon },
};

// The inline head script (THEME_SCRIPT) writes the setting to <html>; this
// component reads it from there, so every switcher on the page agrees.
const subscribe = (onChange: () => void) => {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme-setting"],
  });
  return () => observer.disconnect();
};
const getSnapshot = (): ThemeSetting =>
  parseThemeSetting(document.documentElement.getAttribute("data-theme-setting"));
const getServerSnapshot = (): ThemeSetting | null => null;

const applyTheme = (setting: ThemeSetting) => {
  const theme = resolveTheme(setting, window.matchMedia(DARK_QUERY).matches);
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
  root.setAttribute("data-theme-setting", setting);
};

const saveSetting = (setting: ThemeSetting) => {
  try {
    if (setting === "system") localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, setting);
  } catch {
    // Storage blocked: the choice still applies for this visit (AC-4).
  }
};

/** System, Light, or Dark as a native radio group: arrow keys move, the choice is announced. */
export function ThemeSwitcher({ className }: { readonly className?: string }) {
  const name = useId();
  const setting = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // While on System, follow the OS live.
  useEffect(() => {
    if (setting !== "system") return;
    const query = window.matchMedia(DARK_QUERY);
    const onChange = () => applyTheme("system");
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [setting]);

  return (
    <fieldset
      className={cx(
        "inline-flex shrink-0 gap-0.5 rounded-full border border-line bg-surface p-[3px]",
        className,
      )}
    >
      <legend className="sr-only">Theme</legend>
      {THEME_SETTINGS.map((option) => {
        const { label, icon: Icon } = OPTIONS[option];
        return (
          <label
            key={option}
            title={label}
            // The selected look comes from <html data-theme-setting>, which the
            // head script sets before first paint, so it is right before hydration.
            data-theme-option={option}
            className={cx(
              "relative inline-flex size-9 cursor-pointer items-center justify-center rounded-full",
              "text-muted transition-colors duration-(--duration-fast) hover:text-fg",
              "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent",
            )}
          >
            <input
              type="radio"
              name={name}
              value={option}
              checked={setting === option}
              onChange={() => {
                saveSetting(option);
                applyTheme(option);
              }}
              className="sr-only"
            />
            <Icon aria-hidden="true" className="size-4" strokeWidth={2} />
            <span className="sr-only">{label}</span>
          </label>
        );
      })}
    </fieldset>
  );
}
