// The social card step (feature 13, spec 0001). Runs after `pnpm content`
// and before `next build`, on Node directly (type stripping). It is the file
// system edge: it empties `public/og/`, then renders one 1200 by 630 PNG per
// indexed page with satori and resvg, from the same page list that gives each
// page its metadata. It also writes the site icons (feature 15) into
// `public/`. Anything it cannot render fails the step, naming it.

import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Resvg } from "@resvg/resvg-js";
import satori from "satori";
import {
  allAbouts,
  allCategories,
  allLenses,
  allProfiles,
  allProjects,
  allSectors,
  allServices,
  allSkills,
  allStacks,
  allTestimonials,
} from "../.content-collections/generated/index.js";
import { parseContentDrafts } from "../features/content/env.ts";
import { createContentReader } from "../features/content/read.ts";
import { parseThemeTokens } from "../features/design/tokens.ts";
import { cardColours, cardElement } from "../features/seo/card.ts";
import { ICON_FILES, icoFromPng, iconElement, initialsOf } from "../features/seo/icon.ts";
import { CARD_DIR, CARD_SIZE, cardFileName, sitePages } from "../features/seo/pages.ts";
import { readSiteUrl } from "../features/seo/site-url.ts";

const fail = (message: string): never => {
  console.error(`Social card step failed: ${message}`);
  process.exit(1);
};

const drafts = parseContentDrafts(process.env.CONTENT_DRAFTS);
if (!drafts.ok) fail(drafts.error);
const includeDrafts = drafts.ok && drafts.includeDrafts;

// The card footer shows the host, so the step needs the same canonical
// address the build does (`pnpm cards` loads `.env.local` when present).
const siteUrl = readSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
if (!siteUrl.ok) fail(siteUrl.error);
const host = siteUrl.ok ? new URL(siteUrl.url).host : fail("unreachable");

const root = join(import.meta.dirname, "..");
const output = join(root, "public", CARD_DIR);

const tokens = parseThemeTokens(readFileSync(join(root, "app", "globals.css"), "utf8"));
if (!tokens.ok) fail(tokens.error);
const colours = tokens.ok ? cardColours(tokens.tokens.light) : fail("unreachable");
if (!colours.ok) fail(colours.error);
const colour = colours.ok ? colours.colour : fail("unreachable");

// Satori reads WOFF (not WOFF2). The same faces the site self hosts.
const font = (pkg: string, file: string) => {
  const path = join(root, "node_modules", "@fontsource", pkg, "files", file);
  try {
    return readFileSync(path);
  } catch {
    return fail(`font file not found: ${path}`);
  }
};
const fonts = [
  { name: "Bricolage Grotesque", pkg: "bricolage-grotesque", weight: 700 },
  { name: "Bricolage Grotesque", pkg: "bricolage-grotesque", weight: 800 },
  { name: "Geist", pkg: "geist-sans", weight: 400 },
  { name: "Geist", pkg: "geist-sans", weight: 500 },
  { name: "Geist Mono", pkg: "geist-mono", weight: 500 },
].map(({ name, pkg, weight }) => ({
  name,
  weight: weight as 400 | 500 | 700 | 800,
  style: "normal" as const,
  data: font(pkg, `${pkg}-latin-${weight}-normal.woff`),
}));

const reader = createContentReader(
  {
    projects: allProjects,
    lenses: allLenses,
    categories: allCategories,
    stack: allStacks,
    skills: allSkills,
    sectors: allSectors,
    services: allServices,
    testimonials: allTestimonials,
    profiles: allProfiles,
    abouts: allAbouts,
  },
  includeDrafts,
);
const profile = reader.getProfile();
const pages = sitePages({
  profile,
  about: reader.getAbout(),
  lenses: reader.getLenses(),
  flagships: reader.getFlagships(),
  services: reader.getServices(),
});

// A removed page must not leave its old card behind.
rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });

for (const page of pages) {
  const file = cardFileName(page.path);
  try {
    const element = cardElement(
      { ...page.card, description: page.description },
      { name: profile.name, host },
      colour,
    );
    // Satori accepts plain `{ type, props }` objects in place of React elements.
    const svg = await satori(element as unknown as Parameters<typeof satori>[0], {
      ...CARD_SIZE,
      fonts,
    });
    const png = new Resvg(svg, { fitTo: { mode: "width", value: CARD_SIZE.width } })
      .render()
      .asPng();
    writeFileSync(join(output, file), png);
  } catch (error) {
    fail(`${file} (${page.path}): ${error instanceof Error ? error.message : String(error)}`);
  }
}

console.log(`Social cards: ${pages.length} written to public/${CARD_DIR}/.`);

// The site icons: one mark, rendered at each size so small ones stay crisp.
const renderIcon = async (size: number): Promise<Uint8Array> => {
  const element = iconElement(initialsOf(profile.name), size, colour);
  const svg = await satori(element as unknown as Parameters<typeof satori>[0], {
    width: size,
    height: size,
    fonts,
  });
  return new Resvg(svg, { fitTo: { mode: "width", value: size } }).render().asPng();
};

for (const [kind, { file, size }] of Object.entries(ICON_FILES)) {
  try {
    const png = await renderIcon(size);
    writeFileSync(join(root, "public", file), kind === "favicon" ? icoFromPng(png, size) : png);
  } catch (error) {
    fail(`${file}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

console.log(`Site icons: ${Object.keys(ICON_FILES).length} written to public/.`);
