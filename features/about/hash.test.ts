import { describe, expect, it } from "vitest";
import { hashTargetIds } from "./hash.ts";

// HashTarget on /about (spec 0004, AC-9).

describe("hashTargetIds", () => {
  it("is empty with no hash", () => {
    expect(hashTargetIds("")).toEqual([]);
    expect(hashTargetIds("#")).toEqual([]);
  });

  it("returns a plain id once", () => {
    expect(hashTargetIds("#skill-data-migration")).toEqual(["skill-data-migration"]);
  });

  it("tries the raw fragment, then the decoded one", () => {
    expect(hashTargetIds("#skill-caf%C3%A9")).toEqual(["skill-caf%C3%A9", "skill-café"]);
  });

  // Regression: `/about#skill-%` threw "URI malformed" from the effect and
  // replaced the whole page with the error screen.
  it.each(["#%", "#skill-%", "#skill-%E0%A4%A", "#%zz"])(
    "does not throw for the malformed hash %s",
    (hash) => {
      expect(() => hashTargetIds(hash)).not.toThrow();
      expect(hashTargetIds(hash)).toEqual([hash.slice(1)]);
    },
  );
});
