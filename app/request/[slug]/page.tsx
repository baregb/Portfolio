import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { projectAnchor } from "@/components/portfolio/links";
import { RequestPage } from "@/features/contact/contact-page";
import { getProject, getProjects } from "@/features/content";

// Spec 0004, AC-11: one static page per on request project (flagship or
// card); public and unknown slugs are a 404. Never indexed.
export const dynamicParams = false;

// A static export needs at least one param. With no on request project, the
// build makes one placeholder page that is a 404; `_` is never a valid slug.
const PLACEHOLDER = "_";

export const generateStaticParams = () => {
  const slugs = getProjects()
    .filter((project) => project.visibility === "onRequest")
    .map(({ slug }) => ({ slug }));
  return slugs.length > 0 ? slugs : [{ slug: PLACEHOLDER }];
};

const onRequest = (slug: string) => {
  const project = getProject(slug);
  return project?.visibility === "onRequest" ? project : undefined;
};

export async function generateMetadata({
  params,
}: PageProps<"/request/[slug]">): Promise<Metadata> {
  const project = onRequest((await params).slug);
  return {
    ...(project
      ? { title: `Request details: ${project.title}`, description: project.summary }
      : {}),
    robots: { index: false, follow: false },
  };
}

export default async function RequestDetails({ params }: PageProps<"/request/[slug]">) {
  const project = onRequest((await params).slug);
  if (!project) notFound();
  return <RequestPage project={project} backHref={projectAnchor(project)} />;
}
