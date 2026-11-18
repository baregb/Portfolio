import Link from "next/link";
import { cx } from "@/components/ui/cx";
import { getProfile } from "@/features/content";
import { MobileMenu } from "./mobile-menu";
import { navItems, type NavItem } from "./nav";
import { NavLinks } from "./nav-links";
import { ThemeSwitcher } from "./theme-switcher";

type SiteHeaderProps = {
  readonly items?: readonly NavItem[];
  /** `static` only for showing the header inside the styleguide. */
  readonly position?: "sticky" | "static";
};

/** The floating frosted pill bar (D): name, nav, and theme switcher. */
export function SiteHeader({ items = navItems, position = "sticky" }: SiteHeaderProps) {
  const { name } = getProfile();
  const hasNav = items.length > 0;
  return (
    <header
      className={cx(
        "z-40 px-3 sm:px-4",
        position === "sticky" && "sticky top-[max(0.75rem,env(safe-area-inset-top))] mt-3",
      )}
    >
      <div className="relative mx-auto flex max-w-page items-center justify-between gap-3 rounded-full border border-line frosted py-1.5 pr-1.5 pl-5 shadow-soft">
        <Link
          href="/"
          className="font-display text-lg font-extrabold tracking-[-0.03em] whitespace-nowrap sm:text-xl"
        >
          {name}
        </Link>
        {hasNav ? (
          <nav aria-label="Main" className="hidden md:block">
            <NavLinks items={items} layout="row" />
          </nav>
        ) : null}
        <div className="flex items-center gap-1">
          {/* With a nav on small screens, the switcher moves into the menu panel. */}
          <div className={hasNav ? "hidden md:block" : undefined}>
            <ThemeSwitcher />
          </div>
          {hasNav ? <MobileMenu items={items} /> : null}
        </div>
      </div>
    </header>
  );
}
