import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(import.meta.dirname, "..");

// Spec 0004, AC-13: the root layout's title template adds " · <name>" to every
// page title, so a page that writes the suffix itself shows the name twice
// ("Styleguide · Omogbolahan Ajibare · Omogbolahan Ajibare").
describe("page titles leave the name suffix to the layout template", () => {
  const SUFFIXED_TITLE = /\btitle:\s*["'`][^"'`]*·/;
  const listFiles = (dir: string): readonly string[] =>
    (existsSync(dir) ? readdirSync(dir) : []).flatMap((name) => {
      const path = join(dir, name);
      return statSync(path).isDirectory() ? listFiles(path) : [path];
    });
  const files = ["app", "features"]
    .flatMap((dir) => listFiles(join(root, dir)))
    .filter((path) => /\.tsx?$/.test(path) && !/\.test\.tsx?$/.test(path));

  it.each(files.map((path) => relative(root, path)))("%s sets no suffixed title", (path) => {
    const lines = readFileSync(join(root, path), "utf8").split("\n");
    const hits = lines
      .map((line, index) => ({ line, number: index + 1 }))
      .filter(({ line }) => SUFFIXED_TITLE.test(line));
    expect(hits.map(({ number, line }) => `${path}:${number}: ${line.trim()}`)).toEqual([]);
  });
});
