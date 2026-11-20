import type { Metadata } from "next";
import { getServices } from "@/features/content";
import { seoMetadata } from "@/features/seo";
import { ServicesIndexPage } from "@/features/services/services-index";

// Spec 0006, AC-10 and AC-5b: indexed only once a service is published.
export const metadata: Metadata =
  getServices().length > 0
    ? seoMetadata("/services")
    : { title: "Services", robots: { index: false, follow: false } };

export default function Services() {
  return <ServicesIndexPage />;
}
