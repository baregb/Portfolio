"use client";

import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import type { NavItem } from "./nav";
import { NavLinks } from "./nav-links";
import { ThemeSwitcher } from "./theme-switcher";

/**
 * Below `md` the nav folds into this button and panel (AC-12): a disclosure,
 * not a modal. Escape closes it and returns focus to the button.
 */
export function MobileMenu({ items }: { readonly items: readonly NavItem[] }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  // Close after navigating.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex size-11 items-center justify-center rounded-full text-fg transition-colors duration-(--duration-fast) hover:bg-accent-soft"
      >
        {open ? (
          <X aria-hidden="true" className="size-5" />
        ) : (
          <Menu aria-hidden="true" className="size-5" />
        )}
        <span className="sr-only">Menu</span>
      </button>
      <div
        id={panelId}
        hidden={!open}
        className="absolute inset-x-0 top-[calc(100%+0.5rem)] grid gap-4 rounded-panel border border-line frosted p-3 shadow-soft"
      >
        <nav aria-label="Main">
          <NavLinks items={items} layout="column" onNavigate={() => setOpen(false)} />
        </nav>
        <div className="flex items-center justify-between gap-3 border-t border-line px-3.5 pt-3">
          <span className="label text-muted">Theme</span>
          <ThemeSwitcher />
        </div>
      </div>
    </div>
  );
}
