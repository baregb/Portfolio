import type { Metadata } from "next";
import { AboutPage } from "@/features/about/about-page";
import { getProfile } from "@/features/content";
import { aboutStructuredData, getSiteUrl, JsonLd, seoMetadata } from "@/features/seo";

export const metadata: Metadata = seoMetadata("/about");

export default function About() {
  return (
    <>
      <JsonLd data={aboutStructuredData(getProfile(), getSiteUrl())} />
      <AboutPage />
    </>
  );
}
