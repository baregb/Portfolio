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
  readonly layout: "row" | "column";
  readonly onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <ul className={cx("flex", layout === "row" ? "items-center gap-0.5" : "flex-col gap-1")}>
      {items.map(({ href, label }) => {
        const current = isCurrent(pathname, href);
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
