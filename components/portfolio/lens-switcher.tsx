import Link from "next/link";
import { cx } from "@/components/ui/cx";

export type LensOption = { readonly slug: string; readonly name: string };

/**
 * Switches between "Everything" (home) and each role lens (spec 0004, AC-3).
 * Plain links, so it works by keyboard and without JavaScript; it wraps on
 * phones instead of scrolling sideways.
 */
export function LensSwitcher({
  lenses,
  current,
  labelledBy,
}: {
  readonly lenses: readonly LensOption[];
  /** The current lens slug; `null` is Everything. */
  readonly current: string | null;
  readonly labelledBy: string;
}) {
  const options = [
    { href: "/", name: "Everything", active: current === null },
    ...lenses.map((lens) => ({
      href: `/for/${lens.slug}`,
      name: lens.name,
      active: lens.slug === current,
    })),
  ];
  return (
    <nav aria-labelledby={labelledBy}>
      <ul className="flex flex-wrap gap-2">
        {options.map(({ href, name, active }) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={cx(
                "inline-flex min-h-11 items-center rounded-full border px-4 text-[0.9375rem] font-medium",
                "transition-colors duration-(--duration-fast)",
                active
                  ? "border-accent bg-accent text-accent-ink"
                  : "border-line bg-surface text-fg hover:border-line-strong hover:bg-accent-soft",
              )}
            >
              {name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
