// Spec 0005, value sourcing: the Worker cannot read the content files, so
// `pnpm content` writes the on request projects to
// `.generated/request-projects.json` and the Worker imports it. It names the
// project in the request email and rejects a made up or public slug (AC-5).
// Pure; relative imports only, since the Worker imports the type.

export type RequestProject = { readonly title: string; readonly path: string };
export type RequestProjectMap = Readonly<Record<string, RequestProject>>;

type ProjectLike = {
  readonly _meta: { readonly path: string };
  readonly title: string;
  readonly status: "draft" | "published";
  readonly depth: "flagship" | "card";
  readonly visibility: "public" | "onRequest";
};

/** Every on request project with its title and where it lives on the site. */
export const requestProjectMap = (
  projects: readonly ProjectLike[],
  includeDrafts: boolean,
): RequestProjectMap =>
  Object.fromEntries(
    projects
      .filter((project) => project.visibility === "onRequest")
      .filter((project) => includeDrafts || project.status === "published")
      .map((project) => {
        const slug = project._meta.path;
        const path = project.depth === "flagship" ? `/work/${slug}` : `/work#project-${slug}`;
        return [slug, { title: project.title, path }];
      }),
  );
