import { describe, expect, it } from "vitest";
import { parseContentDrafts } from "./env.ts";

// AC-7: unset or "false" excludes drafts, "true" includes them, anything else fails.

describe("parseContentDrafts", () => {
  it.each([
    [undefined, false],
    ["", false],
    ["false", false],
    ["true", true],
  ])("reads %j as includeDrafts=%s", (value, includeDrafts) => {
    expect(parseContentDrafts(value)).toEqual({ ok: true, includeDrafts });
  });

  it.each(["1", "yes", "TRUE", " true"])("rejects %j, naming the variable", (value) => {
    const result = parseContentDrafts(value);
    expect(result.ok).toBe(false);
    expect(!result.ok && result.error).toMatch(/^CONTENT_DRAFTS must be/);
  });
});
