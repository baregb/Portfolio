// Spec 0001 and 0005: lock the email binding to your inbox at deploy time.
// `wrangler.jsonc` carries a placeholder `destination_address`; this writes
// `wrangler.deploy.jsonc` (git ignored, beside it so relative paths still
// work) with `NOTIFY_TO` in its place. Fails loudly when `NOTIFY_TO` is missing.

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const PLACEHOLDER = "notify-to@example.invalid";
const root = join(import.meta.dirname, "..");

const notifyTo = process.env.NOTIFY_TO?.trim();
if (!notifyTo) {
  console.error("deploy-config: NOTIFY_TO is missing. Set it in the Workers Builds variables.");
  process.exit(1);
}
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(notifyTo) || notifyTo === PLACEHOLDER) {
  console.error("deploy-config: NOTIFY_TO is not a real email address.");
  process.exit(1);
}

const source = readFileSync(join(root, "wrangler.jsonc"), "utf8");
const count = source.split(`"${PLACEHOLDER}"`).length - 1;
if (count === 0) {
  console.error(`deploy-config: wrangler.jsonc has no "${PLACEHOLDER}" destination_address.`);
  process.exit(1);
}

writeFileSync(
  join(root, "wrangler.deploy.jsonc"),
  source.replaceAll(`"${PLACEHOLDER}"`, JSON.stringify(notifyTo)),
);
console.log(`deploy-config: wrote wrangler.deploy.jsonc (${count} email bindings locked).`);
