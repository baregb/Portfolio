/** @type {import("lint-staged").Configuration} */
const config = {
  "*.{ts,tsx,js,mjs,cjs}": ["eslint --fix", "prettier --write"],
  "*.{json,jsonc,css,yml,yaml}": "prettier --write",
  // Spec 0002: check the whole content set whenever a commit touches it. A
  // function, so lint-staged appends no file names to the command.
  "content/**": () => "pnpm content",
};

export default config;
