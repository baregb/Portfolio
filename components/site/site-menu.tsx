"use client";

import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, type FocusEvent } from "react";
import { cx } from "@/components/ui/cx";
import type { NavItem } from "./nav";
import { NavLinks } from "./nav-links";
import { ThemeSwitcher } from "./theme-switcher";

/**
 * The menu drawer at every size: a native popover that slides in from the
 * right with the nav and the theme switcher. The browser handles opening,
 * Escape, a click outside, and returning focus, so it works with JavaScript
 * off too; script only closes it after a client side navigation.
 */
export function SiteMenu({ items }: { readonly items: readonly NavItem[] }) {
  const panelId = useId();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const panel = panelRef.current;
    if (panel?.matches(":popover-open")) panel.hidePopover();
  }, [pathname]);

  // A popover does not trap focus. Close it when Tab leaves, so focus never
  // lands on a link hidden behind the drawer (WCAG 2.4.11).
  const closeOnFocusLeave = (event: FocusEvent<HTMLDivElement>) => {
    const next = event.relatedTarget;
    // The menu button toggles the drawer itself; closing here would let its click reopen it.
    if (next instanceof Element && next.getAttribute("popovertarget") === panelId) return;
    if (next instanceof Node && !event.currentTarget.contains(next)) {
      event.currentTarget.hidePopover();
    }
  };

  return (
    <>
      <button
        type="button"
        popoverTarget={panelId}
        className="inline-flex size-11 items-center justify-center rounded-full text-fg transition-colors duration-(--duration-fast) hover:bg-accent-soft"
      >
        <Menu aria-hidden="true" className="size-5" />
        <span className="sr-only">Menu</span>
      </button>
      <div
        ref={panelRef}
        id={panelId}
        popover="auto"
        role="dialog"
        aria-labelledby={titleId}
        onBlur={closeOnFocusLeave}
        className={cx(
          // Pin to the right edge, full height, over the popover defaults.
          "fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-none w-[min(22rem,calc(100vw-3rem))]",
          "overflow-y-auto border-0 border-s border-line bg-surface p-0 text-fg shadow-soft",
          "backdrop:bg-fg/40",
          // Slide in and out; reduced motion shows and hides it at once.
          "translate-x-full transition-[translate,display,overlay] transition-discrete duration-(--duration-base) ease-out",
          "open:translate-x-0 motion-reduce:transition-none starting:open:translate-x-full",
        )}
      >
        <div className="grid min-h-full grid-rows-[auto_1fr_auto] gap-8 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 id={titleId} className="label text-muted">
              Menu
            </h2>
            <button
              type="button"
              popoverTarget={panelId}
              popoverTargetAction="hide"
              className="-me-1.5 inline-flex size-11 items-center justify-center rounded-full text-muted transition-colors duration-(--duration-fast) hover:bg-accent-soft hover:text-fg"
            >
              <X aria-hidden="true" className="size-5" />
              <span className="sr-only">Close menu</span>
            </button>
          </div>
          <nav aria-label="Main">
            {/* Also close on a link to the page already open, where the path does not change. */}
            <NavLinks
              items={items}
              layout="column"
              onNavigate={() => panelRef.current?.hidePopover()}
            />
          </nav>
          <div className="flex items-center justify-between gap-3 border-t border-line pt-5">
            <span className="label text-muted">Theme</span>
            <ThemeSwitcher />
          </div>
        </div>
      </div>
    </>
  );
}
