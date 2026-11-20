import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProfile, getService, getServices } from "@/features/content";
import { getSiteUrl, JsonLd, seoMetadata, serviceStructuredData } from "@/features/seo";
import { ServicePage } from "@/features/services/service-page";

// Spec 0006, AC-11: one static page per published service; any other slug is a 404.
export const dynamicParams = false;

// A static export needs at least one param. With no published service (AC-5b)
// the build makes one placeholder page that is a 404; `_` is never a valid slug.
const PLACEHOLDER = "_";

export const generateStaticParams = () => {
  const slugs = getServices().map(({ slug }) => ({ service: slug }));
  return slugs.length > 0 ? slugs : [{ service: PLACEHOLDER }];
};

export async function generateMetadata({
  params,
}: PageProps<"/services/[service]">): Promise<Metadata> {
  return seoMetadata(`/services/${(await params).service}`);
}

export default async function Service({ params }: PageProps<"/services/[service]">) {
  const service = getService((await params).service);
  if (!service) notFound();
  return (
    <>
      <JsonLd data={serviceStructuredData(service, getProfile(), getSiteUrl())} />
      <ServicePage service={service} />
    </>
  );
}
