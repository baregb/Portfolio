"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, type FocusEvent } from "react";
import { Availability } from "@/components/portfolio/availability";
import { CvButton } from "@/components/portfolio/cv-button";
import { ExternalLinks } from "@/components/portfolio/external-links";
import type { ExternalLink } from "@/components/portfolio/links";
import { cx } from "@/components/ui/cx";
import type { Profile } from "@/features/content";
import type { CvAsset } from "@/features/media/manifest";
import type { NavItem } from "./nav";
import { NavLinks } from "./nav-links";
import { ThemeSwitcher } from "./theme-switcher";

/**
 * The menu at every size: a native popover that slides down over the top
 * 70% of the screen on the blueprint grid, with the nav as large bold centred
 * links split by faint lines, and a row with availability, profile links, the
 * CV, and the theme switcher below; the page shows dimmed underneath. The browser handles opening, Escape, and returning focus, so it
 * works with JavaScript off too; script only closes it after a client side
 * navigation or when focus leaves it.
 */
export function SiteMenu({
  name,
  items,
  availability,
  links,
  cv,
}: {
  readonly name: string;
  readonly items: readonly NavItem[];
  readonly availability: Profile["availability"];
  readonly links: readonly ExternalLink[];
  readonly cv: CvAsset;
}) {
  const panelId = useId();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const panel = panelRef.current;
    if (panel?.matches(":popover-open")) panel.hidePopover();
  }, [pathname]);

  const close = () => panelRef.current?.hidePopover();

  // A popover does not trap focus. Close it when Tab leaves, so focus never
  // lands on a link hidden behind the overlay (WCAG 2.4.11).
  const closeOnFocusLeave = (event: FocusEvent<HTMLDivElement>) => {
    const next = event.relatedTarget;
    // The menu button toggles the overlay itself; closing here would let its click reopen it.
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
        data-site-menu=""
        onBlur={closeOnFocusLeave}
        className={cx(
          // A panel across the top, about 70% of the screen tall (taller only
          // when its content needs it), over the popover defaults. The page
          // shows dimmed below it; a tap there closes it.
          "fixed inset-x-0 top-0 bottom-auto m-0 h-auto max-h-dvh w-full max-w-none",
          // The theme background with the faint blueprint grid behind it.
          "overflow-x-hidden overflow-y-auto border-0 border-b border-line bg-bg grid-band p-0 text-fg shadow-soft",
          "backdrop:bg-fg/40",
          // Slide down and fade in; reduced motion shows and hides it at once.
          "-translate-y-full opacity-0 transition-[translate,opacity,display,overlay] transition-discrete duration-(--duration-slow) ease-(--ease-out)",
          "open:translate-y-0 open:opacity-100 motion-reduce:transition-none starting:open:-translate-y-full starting:open:opacity-0",
        )}
      >
        <div className="grid min-h-[70svh] grid-rows-[auto_1fr_auto] px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-6 sm:px-4">
          {/* Mirrors the header bar, so the close button sits where the menu button was. */}
          <div className="mx-auto flex w-full max-w-page items-center justify-between gap-3 border border-transparent py-1.5 pr-1.5 pl-5">
            <h2 id={titleId} className="sr-only">
              Menu
            </h2>
            <Link
              href="/"
              onClick={close}
              className="font-display text-lg font-extrabold tracking-[-0.03em] whitespace-nowrap sm:text-xl"
            >
              {name}
            </Link>
            <button
              type="button"
              popoverTarget={panelId}
              popoverTargetAction="hide"
              className="inline-flex size-11 items-center justify-center rounded-full text-fg transition-colors duration-(--duration-fast) hover:bg-accent-soft"
            >
              <X aria-hidden="true" className="size-5" />
              <span className="sr-only">Close menu</span>
            </button>
          </div>
          <nav aria-label="Main" className="grid place-items-center py-4">
            {/* Also close on a link to the page already open, where the path does not change. */}
            <NavLinks items={items} layout="overlay" onNavigate={close} />
          </nav>
          {/* Availability, profiles, the CV, and the theme: stacked and centred on phones, one row from md. */}
          <div className="mx-auto grid w-full max-w-page gap-4 border-t border-line px-2 pt-5 md:flex md:items-center md:justify-between md:px-5">
            <div className="grid justify-items-center gap-3 md:flex md:items-center md:gap-6">
              <Availability availability={availability} />
              <ExternalLinks links={links} label="Profiles" />
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <CvButton cv={cv} size="sm" />
              <ThemeSwitcher />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
