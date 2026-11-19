import type { Metadata } from "next";
import { getProfile } from "@/features/content";
import { HomePage } from "@/features/home/home-page";
import { getSiteUrl, homeStructuredData, JsonLd, seoMetadata } from "@/features/seo";

export const metadata: Metadata = seoMetadata("/");

export default function Home() {
  return (
    <>
      <JsonLd data={homeStructuredData(getProfile(), getSiteUrl())} />
      <HomePage />
    </>
  );
}
