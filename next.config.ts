import type { NextConfig } from "next";

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

export default nextConfig;
