import { describe, expect, it } from "vitest";
import {
  contactFields,
  contactPayload,
  fieldErrors,
  isHoneypotFilled,
  RETENTION_DAYS,
  RETENTION_LINE,
  requestFields,
  requestPayload,
  TOPIC_LABELS,
  TOPICS,
} from "./schema";

const validContact = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  topic: "role",
  message: "Hello, I am hiring for a senior role.",
};
const validRequest = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  reason: "Hiring for a data migration role.",
};
const ID = "6f1c7d1e-2c1a-4b5e-9f3a-1d2c3b4a5e6f";

describe("contact fields (AC-1, AC-3)", () => {
  it("accepts a valid contact and trims every value", () => {
    const result = contactFields.parse({
      ...validContact,
      name: "  Ada Lovelace  ",
      email: " ada@example.com ",
    });
    expect(result.name).toBe("Ada Lovelace");
    expect(result.email).toBe("ada@example.com");
  });

  it.each([
    ["name", "", "Enter your name."],
    ["name", "   ", "Enter your name."],
    ["name", "x".repeat(101), "Keep your name under 100 characters."],
    ["name", "Ada\nBcc: spam@example.com", "Use letters, spaces, and punctuation only."],
    ["email", "", "Enter your email."],
    ["email", "not an email", "Enter a valid email, like name@example.com."],
    ["email", "ada@example.com\r\nBcc: x@y.z", "Enter a valid email, like name@example.com."],
    ["email", `${"a".repeat(250)}@x.io`, "Keep your email under 254 characters."],
    ["message", "too short", "Write at least 10 characters."],
    ["message", "x".repeat(4001), "Keep your message under 4,000 characters."],
    ["topic", "", "Choose what it is about."],
    ["topic", "sales", "Choose what it is about."],
  ])("rejects %s %j with %j", (field, value, message) => {
    const result = contactFields.safeParse({ ...validContact, [field]: value });
    expect(result.success).toBe(false);
    if (!result.success) expect(fieldErrors(result.error)[field]).toBe(message);
  });

  it("accepts the bounds exactly", () => {
    const result = contactFields.safeParse({
      ...validContact,
      name: "x".repeat(100),
      message: "x".repeat(4000),
    });
    expect(result.success).toBe(true);
    expect(contactFields.safeParse({ ...validContact, message: "x".repeat(10) }).success).toBe(
      true,
    );
  });

  it("labels every topic", () => {
    expect(TOPICS.map((topic) => TOPIC_LABELS[topic])).toEqual([
      "A role",
      "A freelance project",
      "Something else",
    ]);
  });
});

describe("request fields (AC-2, AC-3)", () => {
  it("accepts a valid request", () => {
    expect(requestFields.safeParse(validRequest).success).toBe(true);
  });

  it.each([
    ["x".repeat(9), "Write at least 10 characters."],
    ["x".repeat(1001), "Keep your reason under 1,000 characters."],
  ])("rejects a reason of %j", (reason, message) => {
    const result = requestFields.safeParse({ ...validRequest, reason });
    expect(result.success).toBe(false);
    if (!result.success) expect(fieldErrors(result.error).reason).toBe(message);
  });
});

describe("payloads (AC-5, AC-9)", () => {
  it("needs an id and a Turnstile token, and drops unknown keys", () => {
    const result = contactPayload.parse({
      ...validContact,
      id: ID,
      turnstileToken: "token",
      extra: "dropped",
    });
    expect(result).not.toHaveProperty("extra");
    expect(contactPayload.safeParse({ ...validContact, turnstileToken: "t" }).success).toBe(false);
    expect(
      contactPayload.safeParse({ ...validContact, id: "nope", turnstileToken: "t" }).success,
    ).toBe(false);
  });

  it("needs a well formed project slug on a request", () => {
    const base = { ...validRequest, id: ID, turnstileToken: "token" };
    expect(requestPayload.safeParse({ ...base, projectSlug: "membership-charity" }).success).toBe(
      true,
    );
    expect(requestPayload.safeParse({ ...base, projectSlug: "../etc" }).success).toBe(false);
    expect(requestPayload.safeParse(base).success).toBe(false);
  });
});

describe("honeypot (AC-5)", () => {
  it.each([
    [{ website: "" }, false],
    [{ website: "   " }, false],
    [{}, false],
    [null, false],
    ["text", false],
    [{ website: "https://spam.example" }, true],
    [{ website: 1 }, true],
    [{ website: ["x"] }, true],
  ])("for %j says %s", (body, filled) => {
    expect(isHoneypotFilled(body)).toBe(filled);
  });
});

describe("retention (AC-8)", () => {
  it("states the same period the job uses", () => {
    expect(RETENTION_DAYS).toBe(365);
    expect(RETENTION_LINE).toContain("12 months");
  });
});
