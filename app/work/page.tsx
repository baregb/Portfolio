import type { Metadata } from "next";
import { LIBRARY_LEAD, LibraryPage } from "@/features/library/library-page";

export const metadata: Metadata = { title: "Work", description: LIBRARY_LEAD };

export default function Work() {
  return <LibraryPage />;
}
