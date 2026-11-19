import { describe, expect, it } from "vitest";
import type { Submission } from "../db/schema";
import { buildEmail } from "./notify";
import { PROJECTS } from "./test-harness";

// Spec 0005, AC-6: the notification's subject and body.

const base: Submission = {
  id: "6f1c7d1e-2c1a-4b5e-9f3a-1d2c3b4a5e6f",
  kind: "contact",
  name: "Ada Lovelace",
  email: "ada@example.com",
  topic: "project",
  message: "I have a project for you.",
  projectSlug: null,
  createdAt: "2026-11-19T12:00:00.000Z",
  notifiedAt: null,
  notifyAttempts: 0,
};

describe("buildEmail", () => {
  it("writes a contact email with the topic label and every field", () => {
    const { subject, text } = buildEmail(base, PROJECTS, "https://example.test", "production");
    expect(subject).toBe("Portfolio: A freelance project from Ada Lovelace");
    expect(text).toContain("Name: Ada Lovelace");
    expect(text).toContain("Email: ada@example.com");
    expect(text).toContain("Topic: A freelance project");
    expect(text).toContain("I have a project for you.");
    expect(text).toContain("Submitted: 2026-11-19T12:00:00.000Z (UTC)");
    expect(text).toContain(`Submission id: ${base.id}`);
  });

  it("writes a request email with the project title and its address", () => {
    const row: Submission = {
      ...base,
      kind: "request",
      topic: null,
      projectSlug: "private-card",
      message: "Hiring for a data role.",
    };
    const { subject, text } = buildEmail(row, PROJECTS, "https://example.test", "production");
    expect(subject).toBe("Portfolio: details request for Private card from Ada Lovelace");
    expect(text).toContain("Project: Private card");
    expect(text).toContain("Case study: https://example.test/work#project-private-card");
    expect(text).toContain("Hiring for a data role.");
  });

  it("still sends when the project has since left the list", () => {
    const row: Submission = { ...base, kind: "request", topic: null, projectSlug: "gone" };
    const { subject, text } = buildEmail(row, PROJECTS, "https://example.test", "production");
    expect(subject).toContain("details request for gone");
    expect(text).toContain("(no longer listed)");
  });

  it("prefixes preview subjects", () => {
    expect(buildEmail(base, PROJECTS, "https://x.test", "preview").subject).toMatch(
      /^\[preview\] /,
    );
  });
});
