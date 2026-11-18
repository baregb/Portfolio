import { cx } from "@/components/ui/cx";
import type { Profile } from "@/features/content";
import { Picture } from "./picture";

const DEFAULT_FOCUS = "50% 25%";

const VARIANTS = {
  // About 112px on phones, 192px from `md` (AC-2).
  square: { frame: "size-28 md:size-48", sizes: "(min-width: 768px) 192px, 112px" },
  // The about page portrait, large where the face reads.
  portrait: {
    frame: "aspect-[2/3] w-full max-w-xs md:w-72 lg:w-80",
    sizes: "(min-width: 1024px) 320px, (min-width: 768px) 288px, 320px",
  },
} as const;

/**
 * The profile photo (spec 0004, AC-2): square corners and a hairline border,
 * a square crop centred on `photo.focus` in heroes, a 2:3 portrait on about.
 */
export function ProfilePhoto({
  photo,
  variant,
  priority = false,
}: {
  readonly photo: Profile["photo"];
  readonly variant: keyof typeof VARIANTS;
  readonly priority?: boolean;
}) {
  const { frame, sizes } = VARIANTS[variant];
  return (
    <div className={cx("shrink-0 overflow-hidden border border-line bg-surface", frame)}>
      <Picture
        image={photo}
        sizes={sizes}
        fit="cover"
        focus={photo.focus ?? DEFAULT_FOCUS}
        priority={priority}
      />
    </div>
  );
}
