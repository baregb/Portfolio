import type { Metadata } from "next";
import { ContactPage } from "@/features/contact/contact-page";
import { seoMetadata } from "@/features/seo";

export const metadata: Metadata = seoMetadata("/contact");

export default function Contact() {
  return <ContactPage />;
}
