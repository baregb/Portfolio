import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CaseStudyPage } from "@/features/case-study/case-study-page";
import { getFlagships, getProfile, getProject } from "@/features/content";
import { caseStudyStructuredData, getSiteUrl, JsonLd, seoMetadata } from "@/features/seo";

// Spec 0004, AC-4 to AC-6: one static page per flagship; cards and unknown
// slugs are a 404.
export const dynamicParams = false;

export const generateStaticParams = () => getFlagships().map(({ slug }) => ({ slug }));

const flagship = (slug: string) => {
  const project = getProject(slug);
  return project?.depth === "flagship" ? project : undefined;
};

export async function generateMetadata({ params }: PageProps<"/work/[slug]">): Promise<Metadata> {
  return seoMetadata(`/work/${(await params).slug}`);
}

export default async function CaseStudy({ params }: PageProps<"/work/[slug]">) {
  const project = flagship((await params).slug);
  if (!project) notFound();
  return (
    <>
      <JsonLd data={caseStudyStructuredData(project, getProfile(), getSiteUrl())} />
      <CaseStudyPage project={project} />
    </>
  );
}
