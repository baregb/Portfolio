import type { LucideIcon } from "lucide-react";
import { cx } from "./cx";

type IconProps = {
  readonly icon: LucideIcon;
  /** A label makes the icon meaningful; without one it is decorative and hidden. */
  readonly label?: string;
  readonly className?: string;
};

/** The one way to draw a Lucide icon, so size, stroke, and labelling stay consistent. */
export function Icon({ icon: Glyph, label, className }: IconProps) {
  return (
    <Glyph
      className={cx("size-4 shrink-0", className)}
      strokeWidth={2}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
    />
  );
}
