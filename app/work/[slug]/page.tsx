import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CaseStudyPage } from "@/features/case-study/case-study-page";
import { getFlagships, getProject } from "@/features/content";

// Spec 0004, AC-4 to AC-6: one static page per flagship; cards and unknown
// slugs are a 404.
export const dynamicParams = false;

export const generateStaticParams = () => getFlagships().map(({ slug }) => ({ slug }));

const flagship = (slug: string) => {
  const project = getProject(slug);
  return project?.depth === "flagship" ? project : undefined;
};

export async function generateMetadata({ params }: PageProps<"/work/[slug]">): Promise<Metadata> {
  const project = flagship((await params).slug);
  return project ? { title: project.seoTitle, description: project.seoDescription } : {};
}

export default async function CaseStudy({ params }: PageProps<"/work/[slug]">) {
  const project = flagship((await params).slug);
  if (!project) notFound();
  return <CaseStudyPage project={project} />;
}
