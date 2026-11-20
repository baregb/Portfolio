import { collator, serviceFallbackTitle, splitRef } from "./rules.ts";
import type {
  About,
  Category,
  ContentData,
  Flagship,
  Lens,
  LensRef,
  Profile,
  Project,
  ProjectRef,
  RawCategory,
  RawProject,
  RawSkill,
  RawStack,
  RawTestimonial,
  Sector,
  Service,
  Skill,
  SkillGroup,
  StackEntry,
  Testimonial,
  TrackRecordItem,
} from "./types.ts";

// The read layer (spec 0002): pure functions over the generated collections
// and the drafts flag. Everything is resolved once, up front, so the read
// functions themselves never throw. `pnpm content` has already enforced every
// rule; a reference that still fails to resolve here is a bug, and throws.

export type ContentReader = {
  readonly getProfile: () => Profile;
  readonly getAbout: () => About;
  readonly getProjects: () => readonly Project[];
  readonly getProject: (slug: string) => Project | undefined;
  readonly getFlagships: () => readonly Flagship[];
  readonly getFlagshipNeighbours: (slug: string) => {
    readonly previous?: ProjectRef;
    readonly next?: ProjectRef;
  };
  readonly getFeatured: () => readonly Flagship[];
  readonly getLenses: () => readonly Lens[];
  readonly getLens: (slug: string) => Lens | undefined;
  readonly getCategories: () => readonly Category[];
  readonly getStackEntries: () => readonly StackEntry[];
  readonly getSectors: () => readonly Sector[];
  readonly getSkillGroups: () => readonly SkillGroup[];
  readonly getServices: () => readonly Service[];
  readonly getService: (slug: string) => Service | undefined;
  /** Quotes tied to one project, in file name order (spec 0006, AC-8). */
  readonly getTestimonialsFor: (projectSlug: string) => readonly Testimonial[];
  readonly getFeaturedTestimonials: () => readonly Testimonial[];
};

type ResolveEach<T> = T extends RawProject
  ? Extract<Project, Pick<T, "visibility" | "depth">>
  : never;

const slugOf = (doc: { readonly _meta: { readonly path: string } }) => doc._meta.path;

const indexBySlug = <T extends { readonly _meta: { readonly path: string } }, R>(
  docs: readonly T[],
  map: (doc: T) => R,
): ReadonlyMap<string, R> => new Map(docs.map((doc) => [slugOf(doc), map(doc)]));

const lookup = <T>(map: ReadonlyMap<string, T>, slug: string, what: string): T => {
  const found = map.get(slug);
  if (found === undefined)
    throw new Error(`content: unresolved ${what} "${slug}"; run pnpm content`);
  return found;
};

const byName = <T extends { readonly name: string }>(a: T, b: T) =>
  collator.compare(a.name, b.name);

const compareText = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

/** Library order: ongoing first, then end month newest first, start month newest first, title, slug. */
export const compareLibraryOrder = (a: Project, b: Project): number =>
  Number(a.period.end !== null) - Number(b.period.end !== null) ||
  compareText(b.period.end ?? "", a.period.end ?? "") ||
  compareText(b.period.start, a.period.start) ||
  collator.compare(a.title, b.title) ||
  compareText(a.slug, b.slug);

const toCategory = (doc: RawCategory): Category => ({
  slug: slugOf(doc),
  name: doc.name,
  description: doc.description,
});
const toStackEntry = (doc: RawStack): StackEntry =>
  doc.group === undefined
    ? { slug: slugOf(doc), name: doc.name }
    : { slug: slugOf(doc), name: doc.name, group: doc.group };
const toSkill = (doc: RawSkill): Skill => ({
  slug: slugOf(doc),
  name: doc.name,
  group: doc.group,
  description: doc.description,
});

const isFlagship = (project: Project): project is Flagship => project.depth === "flagship";

const toTestimonial = (doc: RawTestimonial): Testimonial => ({
  slug: slugOf(doc),
  quote: doc.quote,
  name: doc.name,
  ...(doc.role === undefined ? {} : { role: doc.role }),
  ...(doc.company === undefined ? {} : { company: doc.company }),
  ...(doc.project === undefined ? {} : { project: doc.project }),
  ...(doc.photo === undefined ? {} : { photo: { src: doc.photo.src, alt: doc.photo.alt } }),
});

type ResultFields = {
  readonly id?: string;
  readonly value: string;
  readonly label: string;
  readonly context?: string;
};
const toRef = (project: Project): ProjectRef => ({ slug: project.slug, title: project.title });

export function createContentReader(data: ContentData, includeDrafts: boolean): ContentReader {
  const rawProfile = data.profiles[0];
  const rawAbout = data.abouts[0];
  if (!rawProfile || !rawAbout)
    throw new Error("content: profile or about is missing; run pnpm content");
  const { _meta: _profileMeta, ...profile } = rawProfile;

  const sectors = indexBySlug(data.sectors, (doc): Sector => ({
    slug: slugOf(doc),
    name: doc.name,
  }));
  const categories = indexBySlug(data.categories, toCategory);
  const stack = indexBySlug(data.stack, toStackEntry);
  const skills = indexBySlug(data.skills, toSkill);
  const rawLenses = indexBySlug(data.lenses, (doc) => doc);

  const orderedLenses = profile.lensOrder.map((slug) => lookup(rawLenses, slug, "lens"));
  const lensRefsFor = (slug: string): readonly LensRef[] =>
    orderedLenses
      .filter((lens) => lens.projects.includes(slug))
      .map((lens) => ({ slug: slugOf(lens), name: lens.name }));

  const resolve = <T extends RawProject>(raw: T): ResolveEach<T> => {
    const {
      _meta,
      sector,
      categories: categorySlugs,
      stack: stackSlugs,
      skills: skillSlugs,
      aiTools,
      ...fields
    } = raw;
    const resolvedCategories = categorySlugs.map((slug) => lookup(categories, slug, "category"));
    const seo = "seo" in raw ? raw.seo : undefined;
    const primaryCategory = resolvedCategories[0];
    if (!primaryCategory) throw new Error(`content: project "${_meta.path}" has no category`);
    return {
      ...fields,
      slug: _meta.path,
      sector: lookup(sectors, sector, "sector"),
      categories: resolvedCategories,
      primaryCategory,
      stack: stackSlugs.map((slug) => lookup(stack, slug, "stack entry")),
      skills: skillSlugs.map((slug) => lookup(skills, slug, "skill")),
      aiTools: aiTools.map((slug) => lookup(stack, slug, "stack entry")),
      lenses: lensRefsFor(_meta.path),
      clientLabel: ("name" in raw.client ? raw.client.name : undefined) ?? raw.client.descriptor,
      headlineResult: raw.results[0],
      seoTitle: seo?.title ?? raw.title,
      seoDescription: seo?.description ?? raw.summary,
    } as unknown as ResolveEach<T>;
  };

  const projects: readonly Project[] = data.projects
    .filter((raw) => includeDrafts || raw.status === "published")
    .map((raw) => resolve<RawProject>(raw))
    .toSorted(compareLibraryOrder);
  const projectsBySlug = new Map(projects.map((project) => [project.slug, project]));

  // Ordered slug lists keep only included projects (drafts drop out in production).
  const pickProjects = (slugs: readonly string[]): readonly Project[] =>
    slugs.flatMap((slug) => {
      const project = projectsBySlug.get(slug);
      return project ? [project] : [];
    });

  // Spec 0006, AC-2 and AC-6: a ref to a dropped (draft) project drops too;
  // `pnpm content` has already warned and checked every id.
  const resolveTrackRecord = (refs: readonly string[]): readonly TrackRecordItem[] =>
    refs.flatMap((ref) => {
      const { project: slug, id } = splitRef(ref);
      const project = projectsBySlug.get(slug);
      if (!project) return [];
      const results: readonly ResultFields[] = project.results;
      const result = results.find((candidate) => candidate.id === id);
      if (!result) throw new Error(`content: unresolved result "${ref}"; run pnpm content`);
      return [
        {
          project: {
            title: project.title,
            href: isFlagship(project) ? `/work/${project.slug}` : null,
          },
          result: {
            value: result.value,
            label: result.label,
            ...(result.context === undefined ? {} : { context: result.context }),
          },
        },
      ];
    });

  // Quotes tied to a dropped project drop too; file name order throughout.
  const testimonials: readonly Testimonial[] = data.testimonials
    .filter((doc) => doc.project === undefined || projectsBySlug.has(doc.project))
    .map(toTestimonial)
    .toSorted((a, b) => compareText(a.slug, b.slug));
  const testimonialsBySlug = new Map(testimonials.map((quote) => [quote.slug, quote]));
  const testimonialsFor = (pageProjects: readonly Project[]): readonly Testimonial[] =>
    pageProjects.flatMap((project) =>
      testimonials.filter((quote) => quote.project === project.slug),
    );

  const flagships = pickProjects(profile.flagshipOrder).filter(isFlagship);
  const featured = pickProjects(profile.featured).filter(isFlagship);

  const lenses: readonly Lens[] = orderedLenses.map((lens) => {
    const lensProjects = pickProjects(lens.projects);
    return {
      slug: slugOf(lens),
      name: lens.name,
      headline: lens.headline,
      ...(lens.headlineHighlight === undefined
        ? {}
        : { headlineHighlight: lens.headlineHighlight }),
      intro: lens.intro,
      projects: lensProjects,
      skills: lens.skills.map((slug) => lookup(skills, slug, "skill")),
      trackRecord: resolveTrackRecord(lens.trackRecord),
      faq: lens.faq,
      testimonials: testimonialsFor(lensProjects),
      seoTitle: lens.seo?.title ?? lens.name,
      seoDescription: lens.seo?.description ?? lens.headline,
    };
  });
  const lensesBySlug = new Map(lenses.map((lens) => [lens.slug, lens]));

  // Spec 0006, AC-1 and AC-5: services in `serviceOrder`; a draft, or a
  // service left with no included project, drops out.
  const rawServices = indexBySlug(data.services, (doc) => doc);
  const services: readonly Service[] = profile.serviceOrder.flatMap((slug): Service[] => {
    const raw = lookup(rawServices, slug, "service");
    if (!includeDrafts && raw.status !== "published") return [];
    const serviceProjects = pickProjects(raw.projects);
    if (serviceProjects.length === 0) return [];
    return [
      {
        slug,
        name: raw.name,
        tagline: raw.tagline,
        headline: raw.headline,
        ...(raw.headlineHighlight === undefined
          ? {}
          : { headlineHighlight: raw.headlineHighlight }),
        intro: raw.intro,
        offerings: raw.offerings,
        trackRecord: resolveTrackRecord(raw.trackRecord),
        projects: serviceProjects,
        faq: raw.faq,
        testimonials: testimonialsFor(serviceProjects),
        seoTitle: raw.seo?.title ?? serviceFallbackTitle(raw.name, profile.base),
        seoDescription: raw.seo?.description ?? raw.headline,
      },
    ];
  });
  const servicesBySlug = new Map(services.map((service) => [service.slug, service]));
  const featuredTestimonials = profile.featuredTestimonials.flatMap((slug) => {
    const quote = testimonialsBySlug.get(slug);
    return quote ? [quote] : [];
  });

  // Only entries at least one included project uses, in name order.
  const used = <T extends { readonly slug: string; readonly name: string }>(
    entries: ReadonlyMap<string, T>,
    slugsOf: (project: Project) => readonly string[],
  ): readonly T[] => {
    const usedSlugs = new Set(projects.flatMap(slugsOf));
    return [...entries.values()].filter((entry) => usedSlugs.has(entry.slug)).toSorted(byName);
  };
  const usedCategories = used(categories, (p) => p.categories.map((c) => c.slug));
  const usedStack = used(stack, (p) => [...p.stack, ...p.aiTools].map((s) => s.slug));
  const usedSectors = used(sectors, (p) => [p.sector.slug]);

  const skillGroups: readonly SkillGroup[] = profile.skillGroups
    .map((group) => ({
      group,
      skills: [...skills.values()]
        .filter((skill) => skill.group === group)
        .toSorted(byName)
        .map((skill) => ({
          skill,
          projects: projects.filter((p) => p.skills.some((s) => s.slug === skill.slug)),
        }))
        .filter((entry) => entry.projects.length > 0),
    }))
    .filter((group) => group.skills.length > 0);

  const about: About = rawAbout.seo
    ? { seo: rawAbout.seo, body: rawAbout.body }
    : { body: rawAbout.body };

  return {
    getProfile: () => profile,
    getAbout: () => about,
    getProjects: () => projects,
    getProject: (slug) => projectsBySlug.get(slug),
    getFlagships: () => flagships,
    getFlagshipNeighbours: (slug) => {
      const index = flagships.findIndex((project) => project.slug === slug);
      if (index === -1) return {};
      const previous = flagships[index - 1];
      const next = flagships[index + 1];
      return {
        ...(previous ? { previous: toRef(previous) } : {}),
        ...(next ? { next: toRef(next) } : {}),
      };
    },
    getFeatured: () => featured,
    getLenses: () => lenses,
    getLens: (slug) => lensesBySlug.get(slug),
    getCategories: () => usedCategories,
    getStackEntries: () => usedStack,
    getSectors: () => usedSectors,
    getSkillGroups: () => skillGroups,
    getServices: () => services,
    getService: (slug) => servicesBySlug.get(slug),
    getTestimonialsFor: (projectSlug) =>
      testimonials.filter((quote) => quote.project === projectSlug),
    getFeaturedTestimonials: () => featuredTestimonials,
  };
}
