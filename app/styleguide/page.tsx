import type { Metadata } from "next";
import { Styleguide } from "@/features/design/styleguide/styleguide";

// AC-13: hidden from search and the nav, left out of the sitemap.
export const metadata: Metadata = {
  // The root layout's title template adds " · <name>".
  title: "Styleguide",
  robots: { index: false, follow: false },
};

export default function StyleguidePage() {
  return <Styleguide />;
}
