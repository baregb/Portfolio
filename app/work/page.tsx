import type { Metadata } from "next";
import { LibraryPage } from "@/features/library/library-page";
import { seoMetadata } from "@/features/seo";

export const metadata: Metadata = seoMetadata("/work");

export default function Work() {
  return <LibraryPage />;
}
