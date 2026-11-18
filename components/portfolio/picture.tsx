import { cx } from "@/components/ui/cx";
import {
  VARIANT_FORMATS,
  svgPath,
  variantPath,
  type ImageAsset,
  type VariantFormat,
} from "@/features/media/assets";
import { getImageAsset } from "@/features/media/manifest";

type PictureProps = {
  readonly image: { readonly src: string; readonly alt: string };
  /** The `sizes` attribute: how wide the image shows at each breakpoint. */
  readonly sizes: string;
  /** Above the fold (hero photo, case study cover): load eagerly with high priority. */
  readonly priority?: boolean;
  /** `cover` fills its frame (crop); `contain` shows the whole image at its own proportions. */
  readonly fit: "cover" | "contain";
  /** Where a `cover` crop centres, as CSS `object-position`. */
  readonly focus?: string;
  readonly className?: string;
};

const MIME: Readonly<Record<VariantFormat, string>> = { avif: "image/avif", webp: "image/webp" };

const srcSet = (src: string, asset: ImageAsset, format: VariantFormat): string =>
  asset.widths.map((width) => `/${variantPath(src, width, format)} ${width}w`).join(", ");

/**
 * An image from the asset step (spec 0004, AC-12): AVIF and WebP sources at
 * every generated width, real `width` and `height` so nothing shifts, and lazy
 * loading unless it is a priority image. A missing image fails the production
 * build; elsewhere (tests, a dev server before `pnpm assets`) it renders nothing.
 */
export function Picture({ image, sizes, priority = false, fit, focus, className }: PictureProps) {
  const asset = getImageAsset(image.src);
  if (!asset) {
    if (process.env.NEXT_PHASE === "phase-production-build") {
      throw new Error(`Picture: content/images/${image.src} is not in the asset manifest`);
    }
    return null;
  }

  const imgClasses = cx(
    "block w-full",
    fit === "cover" ? "h-full object-cover" : "h-auto",
    className,
  );
  const loading = priority ? "eager" : "lazy";
  const fetchPriority = priority ? "high" : undefined;

  if (asset.format === "svg") {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- images are pre sized by the asset step (spec 0004), not next/image
      <img
        src={`/${svgPath(image.src)}`}
        alt={image.alt}
        width={asset.width}
        height={asset.height}
        loading={loading}
        fetchPriority={fetchPriority}
        decoding="async"
        className={imgClasses}
      />
    );
  }

  const largest = asset.widths.at(-1) ?? asset.width;
  return (
    <picture>
      {VARIANT_FORMATS.map((format) => (
        <source
          key={format}
          type={MIME[format]}
          srcSet={srcSet(image.src, asset, format)}
          sizes={sizes}
        />
      ))}
      <img
        src={`/${variantPath(image.src, largest, "webp")}`}
        alt={image.alt}
        width={asset.width}
        height={asset.height}
        loading={loading}
        fetchPriority={fetchPriority}
        decoding="async"
        className={imgClasses}
        style={focus && fit === "cover" ? { objectPosition: focus } : undefined}
      />
    </picture>
  );
}
