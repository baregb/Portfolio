// Cross file content check (spec 0002). Runs after `content-collections build`
// as the second half of `pnpm content`, on Node directly (type stripping).
// It is the file system edge: it reads the generated collections and the file
// list, runs `checkContent` in both draft modes, prints what it found, and
// exits 1 on any error so the pre-commit hook, CI, and the build all stop.

import { existsSync, readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";
import {
  allAbouts,
  allCategories,
  allLenses,
  allProfiles,
  allProjects,
  allSectors,
  allSkills,
  allStacks,
} from "../.content-collections/generated/index.js";
import { checkContent, type ContentIssue } from "../features/content/check.ts";
import { parseContentDrafts } from "../features/content/env.ts";

// Fail loudly on a mistyped CONTENT_DRAFTS before anything else, so every
// `pnpm content` (commit, typecheck, test, CI, build) enforces it (AC-7).
const drafts = parseContentDrafts(process.env.CONTENT_DRAFTS);
if (!drafts.ok) {
  console.error(drafts.error);
  process.exit(1);
}

const root = join(import.meta.dirname, "..", "content");

// Every file under `content/`, skipping dotfiles and dot folders.
const listFiles = (directory: string): string[] =>
  readdirSync(directory, { withFileTypes: true })
    .filter((entry) => !entry.name.startsWith("."))
    .flatMap((entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory() ? listFiles(path) : [relative(root, path).split(sep).join("/")];
    });

const snapshot = {
  projects: allProjects,
  lenses: allLenses,
  categories: allCategories,
  stack: allStacks,
  skills: allSkills,
  sectors: allSectors,
  profiles: allProfiles,
  abouts: allAbouts,
  files: existsSync(root) ? listFiles(root) : [],
};

const key = (found: ContentIssue) =>
  `${found.file}\u0000${found.field ?? ""}\u0000${found.message}`;
const unique = (issues: readonly ContentIssue[]) => [
  ...new Map(issues.map((found) => [key(found), found])).values(),
];

const results = [true, false].map((includeDrafts) => checkContent(snapshot, { includeDrafts }));
const errors = unique(results.flatMap((result) => (result.ok ? [] : result.errors)));
const warnings = unique(results.flatMap((result) => result.warnings));

for (const warning of warnings) {
  const message = warning.field ? `${warning.field}: ${warning.message}` : warning.message;
  console.warn(JSON.stringify({ level: "warn", message, file: warning.file }));
}

if (errors.length > 0) {
  console.error(
    `Content check failed with ${errors.length} error${errors.length === 1 ? "" : "s"}:`,
  );
  for (const error of errors) {
    console.error(`- ${error.file}${error.field ? ` (${error.field})` : ""}: ${error.message}`);
  }
  process.exit(1);
}

console.log(
  `Content check passed: ${allProjects.length} projects, ${allLenses.length} lenses, both draft modes.`,
);
