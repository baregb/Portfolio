/** @type {import("prettier").Config} */
const config = {
  printWidth: 100,
  plugins: ["prettier-plugin-tailwindcss"],
  // Tailwind v4: the plugin reads the theme from the stylesheet.
  tailwindStylesheet: "./app/globals.css",
  // Keep JSONC (wrangler.jsonc) readable by strict JSON with comments parsers.
  overrides: [{ files: "*.jsonc", options: { trailingComma: "none" } }],
};

export default config;
