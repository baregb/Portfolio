import { defineConfig } from "drizzle-kit";

// Spec 0001 and 0005: drizzle-kit writes plain SQL migrations into
// `drizzle/migrations/`, which Wrangler applies to D1 (`migrations_dir`).
export default defineConfig({
  dialect: "sqlite",
  schema: "./worker/db/schema.ts",
  out: "./drizzle/migrations",
});
