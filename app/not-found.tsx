import type { Metadata } from "next";
import { NotFoundPage } from "@/features/not-found/not-found-page";

// Feature 15: the page Cloudflare serves for any unknown address
// (`not_found_handling: "404-page"`). Next adds `noindex` to it on its own.
export const metadata: Metadata = {
  title: "Page not found",
  description: "There is no page at this address.",
};

export default function NotFound() {
  return <NotFoundPage />;
}
