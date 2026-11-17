import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      // Same alias as tsconfig.json: the collections `pnpm content` generates.
      "content-collections": fileURLToPath(
        new URL("./.content-collections/generated", import.meta.url),
      ),
    },
  },
});
