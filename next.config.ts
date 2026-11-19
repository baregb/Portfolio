import type { NextConfig } from "next";
import { PHASE_PRODUCTION_BUILD } from "next/constants";
import { readTurnstileSiteKey } from "./features/forms/submission";

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

// Spec 0005, AC-12: a production build fails, naming the variable, without
// the Turnstile site key the forms need.
export default function config(phase: string): NextConfig {
  if (phase === PHASE_PRODUCTION_BUILD) {
    const siteKey = readTurnstileSiteKey(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
    if (!siteKey.ok) throw new Error(siteKey.error);
  }
  return nextConfig;
}
