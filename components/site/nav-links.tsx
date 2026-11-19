"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/components/ui/cx";
import type { NavItem } from "./nav";

const isCurrent = (pathname: string, href: string): boolean =>
  href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

/** The nav links, marking the current page for sight and for screen readers. */
export function NavLinks({
  items,
  layout,
  onNavigate,
}: {
  readonly items: readonly NavItem[];
  /** `overlay`: the full screen menu, large bold centred links that rise in one after another. */
  readonly layout: "row" | "column" | "overlay";
  readonly onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <ul
      className={cx(
        "flex",
        layout === "row" && "items-center gap-0.5",
        layout === "column" && "flex-col gap-1",
        layout === "overlay" && "flex-col items-center text-center",
      )}
    >
      {items.map(({ href, label }, index) => {
        const current = isCurrent(pathname, href);
        if (layout === "overlay") {
          return (
            <li
              key={href}
              // Each link rises in a beat after the one above it when the menu opens.
              style={{ transitionDelay: `calc(${index} * 60ms + 80ms)` }}
              className="relative py-5 transition-[opacity,translate] duration-(--duration-slow) ease-(--ease-out) motion-reduce:transition-none md:py-5 starting:translate-y-6 starting:opacity-0"
            >
              {/* A short, faint line between links, none above the first. */}
              {index > 0 ? (
                <span
                  aria-hidden="true"
                  className="absolute top-0 left-1/2 h-px w-20 -translate-x-1/2 bg-fg/8"
                />
              ) : null}
              <Link
                href={href}
                onClick={onNavigate}
                aria-current={current ? "page" : undefined}
                className={cx(
                  "block px-2 font-display text-[clamp(3rem,12vw,4.5rem)] leading-[0.95] font-extrabold tracking-[-0.045em]",
                  "transition-colors duration-(--duration-fast)",
                  current ? "text-accent" : "text-fg hover:text-accent",
                )}
              >
                {label}
              </Link>
            </li>
          );
        }
        return (
          <li key={href}>
            <Link
              href={href}
              onClick={onNavigate}
              aria-current={current ? "page" : undefined}
              className={cx(
                "inline-flex min-h-10 items-center rounded-full px-3.5 text-[0.9375rem]",
                "transition-colors duration-(--duration-fast)",
                layout === "column" && "min-h-11 w-full text-base",
                current ? "bg-accent-soft text-fg" : "text-muted hover:text-fg",
              )}
            >
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
