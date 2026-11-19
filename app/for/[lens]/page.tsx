import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLens, getLenses } from "@/features/content";
import { LensPage } from "@/features/lenses/lens-page";
import { seoMetadata } from "@/features/seo";

// Spec 0004, AC-3: one static page per role lens; any other slug is a 404.
export const dynamicParams = false;

export const generateStaticParams = () => getLenses().map(({ slug }) => ({ lens: slug }));

export async function generateMetadata({ params }: PageProps<"/for/[lens]">): Promise<Metadata> {
  return seoMetadata(`/for/${(await params).lens}`);
}

export default async function RoleLens({ params }: PageProps<"/for/[lens]">) {
  const lens = getLens((await params).lens);
  if (!lens) notFound();
  return <LensPage lens={lens} />;
}
