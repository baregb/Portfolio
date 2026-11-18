import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  EMPTY_MANIFEST,
  MANIFEST_PATH,
  formatFileSize,
  type AssetManifest,
  type ImageAsset,
} from "./assets";

// Reads the asset step's manifest once, at build (spec 0004, AC-12). Read with
// `fs`, never a static JSON import, so `tsc`, Vitest, and lint work before the
// asset step has run; without the file the manifest is empty. Server only.

const isManifest = (value: unknown): value is AssetManifest =>
  typeof value === "object" &&
  value !== null &&
  "images" in value &&
  typeof value.images === "object" &&
  "cv" in value;

const readManifest = (): AssetManifest => {
  const file = join(process.cwd(), MANIFEST_PATH);
  if (!existsSync(file)) return EMPTY_MANIFEST;
  const parsed: unknown = JSON.parse(readFileSync(file, "utf8"));
  if (!isManifest(parsed)) throw new Error(`${MANIFEST_PATH} is malformed; run pnpm assets`);
  return parsed;
};

const manifest = readManifest();

/** The CV download, or `null` when there is no file (drafts mode only). */
export type CvAsset = { readonly href: string; readonly sizeLabel: string } | null;

export const getCvAsset = (): CvAsset =>
  manifest.cv ? { href: manifest.cv.href, sizeLabel: formatFileSize(manifest.cv.bytes) } : null;

export const getImageAsset = (src: string): ImageAsset | undefined => manifest.images[src];
