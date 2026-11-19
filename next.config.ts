import type { NextConfig } from "next";
import { PHASE_PRODUCTION_BUILD } from "next/constants";
import { readUmamiWebsiteId } from "./features/analytics/config";
import { readTurnstileSiteKey } from "./features/forms/submission";
import { readSiteUrl } from "./features/seo/site-url";

// Spec 0001: every route is generated at build time and exported as plain
// files to `out/`. Cloudflare Static Assets serves them; only `/api/*` runs
// code (the Hono Worker in `worker/`). Nothing here may need a server.
const nextConfig: NextConfig = {
  output: "export",
  images: {
    // Images are pre sized at build time by our own script, never at runtime.
    unoptimized: true,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

// A production build fails, naming the variable, without the Turnstile site
// key the forms need (spec 0005, AC-12) or the canonical site address the
// metadata, sitemap, and cards need (feature 13), or with a malformed Umami
// website id. Analytics is optional: without an id, pages load no tracker.
export default function config(phase: string): NextConfig {
  if (phase === PHASE_PRODUCTION_BUILD) {
    const checks = [
      readTurnstileSiteKey(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY),
      readSiteUrl(process.env.NEXT_PUBLIC_SITE_URL),
      readUmamiWebsiteId(process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID),
    ];
    const errors = checks.flatMap((check) => (check.ok ? [] : [check.error]));
    if (errors.length > 0) throw new Error(errors.join("\n"));
  }
  return nextConfig;
}
