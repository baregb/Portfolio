import type { Metadata } from "next";
import { AboutPage, aboutMetadata } from "@/features/about/about-page";

export const metadata: Metadata = aboutMetadata();

export default function About() {
  return <AboutPage />;
}
