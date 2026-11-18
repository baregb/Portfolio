import type { Metadata } from "next";
import { ContactPage, contactMetadata } from "@/features/contact/contact-page";

export const metadata: Metadata = contactMetadata();

export default function Contact() {
  return <ContactPage />;
}
