// The asset step (spec 0004, AC-10, AC-12). Runs after `pnpm content` and
// before `next build`, on Node directly (type stripping). It is the file
// system edge: it empties `public/img/` and `public/cv/`, writes AVIF and
// WebP variants of every image the included content references, copies SVG
// diagrams and the CV, and records sizes in `.generated/assets.json`. Any
// image it cannot process fails the step, naming the file.

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import sharp from "sharp";
import {
  allProfiles,
  allProjects,
  allTestimonials,
} from "../.content-collections/generated/index.js";
import { CV_FILE } from "../features/content/rules.ts";
import { parseContentDrafts } from "../features/content/env.ts";
import {
  CV_OUTPUT,
  IMAGE_OUTPUT,
  MANIFEST_PATH,
  VARIANT_FORMATS,
  collectImages,
  cvFileName,
  cvHref,
  formatFileSize,
  isSvg,
  svgHasSize,
  svgPath,
  variantPath,
  variantWidths,
  type AssetManifest,
  type ImageAsset,
} from "../features/media/assets.ts";

const fail = (message: string): never => {
  console.error(`Asset step failed: ${message}`);
  process.exit(1);
};

const drafts = parseContentDrafts(process.env.CONTENT_DRAFTS);
if (!drafts.ok) fail(drafts.error);
const includeDrafts = drafts.ok && drafts.includeDrafts;

const root = join(import.meta.dirname, "..");
const contentImages = join(root, "content", "images");
const publicDir = join(root, "public");

const ensureDir = (file: string) => mkdirSync(dirname(file), { recursive: true });

// A removed image, or one whose project became on request, must never ship.
for (const output of [IMAGE_OUTPUT, CV_OUTPUT]) {
  rmSync(join(publicDir, output), { recursive: true, force: true });
}

const QUALITY = { avif: { quality: 55, effort: 4 }, webp: { quality: 78 } } as const;

async function buildSvg(src: string, input: string): Promise<ImageAsset> {
  if (!svgHasSize(readFileSync(input, "utf8"))) {
    return fail(`content/images/${src}: an SVG needs width and height, or a viewBox`);
  }
  const { width, height } = await sharp(input).metadata();
  if (!width || !height) return fail(`content/images/${src}: could not read the SVG size`);
  const output = join(publicDir, svgPath(src));
  ensureDir(output);
  copyFileSync(input, output);
  return { width, height, widths: [width], format: "svg" };
}

async function buildRaster(src: string, input: string): Promise<ImageAsset> {
  const metadata = await sharp(input).metadata();
  // `autoOrient` is the size once EXIF rotation is applied, as browsers show it.
  const width = metadata.autoOrient?.width ?? metadata.width;
  const height = metadata.autoOrient?.height ?? metadata.height;
  if (!width || !height) return fail(`content/images/${src}: could not read the image size`);
  const widths = variantWidths(width);
  await Promise.all(
    widths.flatMap((target) =>
      VARIANT_FORMATS.map(async (format) => {
        const output = join(publicDir, variantPath(src, target, format));
        ensureDir(output);
        const pipeline = sharp(input).autoOrient().resize({ width: target });
        await (
          format === "avif" ? pipeline.avif(QUALITY.avif) : pipeline.webp(QUALITY.webp)
        ).toFile(output);
      }),
    ),
  );
  return { width, height, widths, format: "raster" };
}

async function buildImage(src: string): Promise<readonly [string, ImageAsset]> {
  const input = join(contentImages, src);
  if (!existsSync(input)) return fail(`content/images/${src} is referenced but missing`);
  try {
    return [src, await (isSvg(src) ? buildSvg(src, input) : buildRaster(src, input))];
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return fail(`content/images/${src} could not be processed (${reason})`);
  }
}

function buildCv(): AssetManifest["cv"] {
  const profile = allProfiles[0];
  if (!profile) return fail("content/profile.yaml did not build; run pnpm content");
  const input = join(root, "content", CV_FILE);
  if (!existsSync(input)) {
    if (!includeDrafts) {
      return fail(
        `content/${CV_FILE} is missing. Add your CV there before a production build (drafts mode shows "CV coming soon" instead).`,
      );
    }
    console.warn(
      JSON.stringify({
        level: "warn",
        message: "CV missing; drafts mode",
        file: `content/${CV_FILE}`,
      }),
    );
    return null;
  }
  const output = join(publicDir, CV_OUTPUT, cvFileName(profile.name));
  ensureDir(output);
  copyFileSync(input, output);
  return { href: cvHref(profile.name), bytes: statSync(input).size };
}

const sources = collectImages(
  { projects: allProjects, profiles: allProfiles, testimonials: allTestimonials },
  includeDrafts,
);
const images = Object.fromEntries(await Promise.all(sources.map(buildImage)));
const cv = buildCv();
const manifest: AssetManifest = { images, cv };

const manifestFile = join(root, MANIFEST_PATH);
ensureDir(manifestFile);
writeFileSync(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);

const files = Object.values(images).reduce(
  (total, image) => total + (image.format === "svg" ? 1 : image.widths.length * 2),
  0,
);
console.log(
  `Assets built: ${sources.length} images (${files} files), CV ${cv ? `${cv.href} (${formatFileSize(cv.bytes)})` : "none"}${includeDrafts ? ", drafts included" : ""}.`,
);
