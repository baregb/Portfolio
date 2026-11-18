import Link from "next/link";
import { cx } from "@/components/ui/cx";
import { getProfile } from "@/features/content";
import { navItems, type NavItem } from "./nav";
import { SiteMenu } from "./site-menu";
import { ThemeSwitcher } from "./theme-switcher";

type SiteHeaderProps = {
  readonly items?: readonly NavItem[];
  /** `static` only for showing the header inside the styleguide. */
  readonly position?: "sticky" | "static";
};

/**
 * The floating frosted pill bar (D): the name and the menu button, at every
 * size. The nav and the theme switcher live in the menu drawer.
 */
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
        {/* With no nav (a styleguide demo), the switcher sits in the bar itself. */}
        {hasNav ? <SiteMenu items={items} /> : <ThemeSwitcher />}
      </div>
    </header>
  );
}
