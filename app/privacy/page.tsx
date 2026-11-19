import type { Metadata } from "next";
import { PrivacyPage } from "@/features/privacy/privacy-page";
import { seoMetadata } from "@/features/seo";

export const metadata: Metadata = seoMetadata("/privacy");

export default function Privacy() {
  return <PrivacyPage />;
}
