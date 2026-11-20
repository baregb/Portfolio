import { defineCollection, defineConfig, type Meta } from "@content-collections/core";
import { compileMDX } from "@content-collections/mdx";
import {
  aboutSchema,
  categorySchema,
  lensSchema,
  profileSchema,
  projectSchema,
  sectorSchema,
  serviceSchema,
  skillSchema,
  stackSchema,
  testimonialSchema,
  withReadableIssues,
} from "./features/content/schema.ts";
import { SECTIONS, type SectionKey } from "./features/content/rules.ts";
import { bodyTextError, splitSections } from "./features/content/sections.ts";

// Content model (spec 0002). Per file schemas and the flagship section split
// run here; cross file rules run in `scripts/check-content.ts` right after.
// `pnpm content` runs both.

type CompiledSection = { readonly code: string; readonly markdown: string };

const location = (directory: string, meta: Meta) => `content/${directory}/${meta.filePath}`;

// Transform errors reach the CLI without the file name, so put it in the message.
const fail = (file: string, message: string): never => {
  throw new Error(`${file}: ${message}`);
};

const projects = defineCollection({
  name: "projects",
  directory: "content/projects",
  include: "*.mdx",
  schema: withReadableIssues(projectSchema),
  transform: async (document, context) => {
    const file = location("projects", document._meta);
    if (document.visibility === "public" && document.depth === "flagship") {
      const { content, ...fields } = document;
      const split = splitSections(content);
      if (!split.ok) return fail(file, split.error);
      const compiled = await Promise.all(
        SECTIONS.map(async ({ key }) => {
          const markdown = split.sections[key];
          // Each section compiles from its own copy of the document; the cache
          // key includes `content`, so sections never collide.
          const code = await compileMDX(context, { _meta: document._meta, content: markdown });
          return [key, { code, markdown }] as const;
        }),
      );
      const sections = Object.fromEntries(compiled) as Record<SectionKey, CompiledSection>;
      return { ...fields, sections };
    }
    const { content, ...fields } = document;
    const bodyError = bodyTextError(document, content);
    return bodyError ? fail(file, bodyError) : fields;
  },
});

const about = defineCollection({
  name: "about",
  directory: "content",
  include: "about.mdx",
  schema: withReadableIssues(aboutSchema),
  transform: async (document, context) => {
    const { content, ...fields } = document;
    if (content.trim() === "") return fail("content/about.mdx", "body must not be empty");
    const code = await compileMDX(context, document);
    return { ...fields, body: { code, markdown: content } };
  },
});

const yamlCollection = <N extends string, S extends Parameters<typeof withReadableIssues>[0]>(
  name: N,
  schema: S,
) => ({
  name,
  directory: `content/${name}`,
  include: "*.yaml",
  parser: "yaml" as const,
  schema: withReadableIssues(schema),
});

const lenses = defineCollection({ ...yamlCollection("lenses", lensSchema), typeName: "Lens" });
const categories = defineCollection(yamlCollection("categories", categorySchema));
const stack = defineCollection(yamlCollection("stack", stackSchema));
const skills = defineCollection(yamlCollection("skills", skillSchema));
const sectors = defineCollection(yamlCollection("sectors", sectorSchema));
const services = defineCollection(yamlCollection("services", serviceSchema));
const testimonials = defineCollection(yamlCollection("testimonials", testimonialSchema));

const profile = defineCollection({
  name: "profile",
  directory: "content",
  include: "profile.yaml",
  parser: "yaml",
  schema: withReadableIssues(profileSchema),
});

export default defineConfig({
  content: [
    projects,
    about,
    lenses,
    categories,
    stack,
    skills,
    sectors,
    services,
    testimonials,
    profile,
  ],
});
