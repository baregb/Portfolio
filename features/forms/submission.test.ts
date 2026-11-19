import { describe, expect, it } from "vitest";
import { FAILURE_MESSAGES, outcomeOf, readTurnstileSiteKey } from "./submission";

describe("outcomeOf (AC-4, AC-10)", () => {
  it.each([
    [201, { ok: true }, "success"],
    [429, { error: "rate_limited" }, "rate_limited"],
    [403, { error: "turnstile_failed" }, "turnstile_failed"],
    [403, { error: "bad_origin" }, "generic"],
    [413, { error: "payload_too_large" }, "generic"],
    [415, null, "generic"],
    [422, { error: "invalid_input" }, "generic"],
    [503, { error: "unavailable" }, "generic"],
    [500, "not json", "generic"],
  ])("maps %i %j to %s", (status, body, outcome) => {
    expect(outcomeOf(status, body)).toBe(outcome);
  });

  it("has the exact copy AC-10 sets", () => {
    expect(FAILURE_MESSAGES).toEqual({
      rate_limited: "Too many tries. Wait a minute, then send it again.",
      turnstile_failed: "Could not confirm you are human. Try the check again.",
      network: "Could not send. Check your connection and try again.",
      generic: "Something went wrong on my side. Try again, or reach me on LinkedIn.",
    });
  });
});

describe("readTurnstileSiteKey (AC-12)", () => {
  it("accepts a key", () => {
    expect(readTurnstileSiteKey(" 1x00000000000000000000AA ")).toEqual({
      ok: true,
      value: "1x00000000000000000000AA",
    });
  });

  it.each([undefined, "", "   "])("names the variable when the key is %j", (value) => {
    const result = readTurnstileSiteKey(value);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("NEXT_PUBLIC_TURNSTILE_SITE_KEY");
  });
});
