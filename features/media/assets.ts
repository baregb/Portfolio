import { projectImages } from "../content/check.ts";
import type { RawProfile, RawProject, RawTestimonial } from "../content/types.ts";

// Pure helpers for the build time asset step (spec 0004, AC-10, AC-12). The
// step itself (`scripts/build-assets.ts`) is the file system edge; it and the
// site both import from here. Node runs this file directly, so imports keep
// their `.ts` extension and syntax stays erasable.

/** The widths the asset step makes, never wider than the source. */
export const VARIANT_WIDTHS: readonly number[] = [640, 960, 1280, 1920];

/** Raster variants are written in these formats, best first. */
export const VARIANT_FORMATS = ["avif", "webp"] as const;
export type VariantFormat = (typeof VARIANT_FORMATS)[number];

/** Where generated files land, relative to `public/`. */
export const IMAGE_OUTPUT = "img";
export const CV_OUTPUT = "cv";

/** The manifest the asset step writes; git ignored and never published. */
export const MANIFEST_PATH = ".generated/assets.json";

export type ImageAsset = {
  readonly width: number;
  readonly height: number;
  readonly widths: readonly number[];
  readonly format: "raster" | "svg";
};

export type AssetManifest = {
  readonly images: Readonly<Record<string, ImageAsset>>;
  readonly cv: { readonly href: string; readonly bytes: number } | null;
};

export const EMPTY_MANIFEST: AssetManifest = { images: {}, cv: null };

/** The standard widths that fit the source, or just the source width when it is under the smallest. */
export const variantWidths = (sourceWidth: number): readonly number[] => {
  const fitting = VARIANT_WIDTHS.filter((width) => width <= sourceWidth);
  return fitting.length > 0 ? fitting : [sourceWidth];
};

const withoutExtension = (src: string): string => src.replace(/\.[^./]+$/, "");

/** `profile/photo.jpg`, 640, avif → `img/profile/photo-640.avif` (relative to `public/`). */
export const variantPath = (src: string, width: number, format: VariantFormat): string =>
  `${IMAGE_OUTPUT}/${withoutExtension(src)}-${width}.${format}`;

/** An SVG is copied as it is: `diagrams/flow.svg` → `img/diagrams/flow.svg`. */
export const svgPath = (src: string): string => `${IMAGE_OUTPUT}/${src}`;

export const isSvg = (src: string): boolean => src.toLowerCase().endsWith(".svg");

/** `Omogbolahan Ajibare` → `omogbolahan-ajibare-cv.pdf`. */
export const cvFileName = (name: string): string => {
  const slug = name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${slug || "cv"}-cv.pdf`;
};

export const cvHref = (name: string): string => `/${CV_OUTPUT}/${cvFileName(name)}`;

/** 119793 → `120 KB`; never below 1 KB. */
export const formatFileSize = (bytes: number): string =>
  `${Math.max(1, Math.round(bytes / 1000))} KB`;

/**
 * Every image the included content references (profile photo, client logos,
 * covers, screenshots, diagrams, testimonial photos), once each, in a stable
 * order. Drafts count only when they are included, and so do quotes tied to
 * them; on request projects never carry images.
 */
export const collectImages = (
  data: {
    readonly projects: readonly RawProject[];
    readonly profiles: readonly RawProfile[];
    readonly testimonials: readonly RawTestimonial[];
  },
  includeDrafts: boolean,
): readonly string[] => {
  const projects = data.projects.filter(
    (project) => includeDrafts || project.status === "published",
  );
  const included = new Set(projects.map((project) => project._meta.path));
  const sources = [
    ...data.profiles.flatMap((profile) => [
      profile.photo.src,
      ...profile.clients.map((client) => client.logo),
    ]),
    ...projects.flatMap((project) => projectImages(project).map((image) => image.src)),
    ...data.testimonials
      .filter((quote) => quote.project === undefined || included.has(quote.project))
      .flatMap((quote) => (quote.photo ? [quote.photo.src] : [])),
  ];
  return [...new Set(sources)];
};

/** True when an SVG's root element states a size or a viewBox, so its proportions are known. */
export const svgHasSize = (svg: string): boolean => {
  const root = /<svg\b[^>]*>/i.exec(svg)?.[0] ?? "";
  return /\bviewBox\s*=/.test(root) || (/\bwidth\s*=/.test(root) && /\bheight\s*=/.test(root));
};
