import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

// Spec 0005: the markup both forms render in each state, read as a screen
// reader would meet it (labels, ARIA, live regions). Interaction (submit,
// retry, focus moves) runs in the browser under `/check verify`; this suite
// has no DOM, so it pins the rendered contract of every state instead.

// Vitest does not resolve the `@/` alias these files import, so point each
// alias id at the real module. Nothing is faked: the true components render.
vi.mock("@/components/ui/button", () => import("../../components/ui/button"));
vi.mock("@/components/ui/button-group", () => import("../../components/ui/button-group"));
vi.mock("@/components/ui/card", () => import("../../components/ui/card"));
vi.mock("@/components/ui/icon", () => import("../../components/ui/icon"));
vi.mock("@/components/ui/text-field", () => import("../../components/ui/text-field"));
vi.mock("@/components/ui/text-link", () => import("../../components/ui/text-link"));

import { ContactForm } from "./contact-form";
import { FormFrame, type FormDemo } from "./form-frame";
import { RequestForm } from "./request-form";
import { requestFields } from "./schema";

const LINKEDIN = "https://www.linkedin.com/in/example";
const RETENTION =
  "I keep messages for 12 months, then delete them. Your details are used only to reply.";
const NO_JS = "This form needs JavaScript. You can still reach me through the links above.";

/** Rendered HTML without class attributes, so no assertion depends on styling. */
const render = (element: ReturnType<typeof createElement>) =>
  renderToStaticMarkup(element).replace(/ class="[^"]*"/g, "");

const contact = (demo?: FormDemo) =>
  render(createElement(ContactForm, { linkedinUrl: LINKEDIN, demo }));
const request = () =>
  render(createElement(RequestForm, { projectSlug: "membership", linkedinUrl: LINKEDIN }));

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** The control a visible label points at, found by the label's text. */
const controlFor = (html: string, labelText: string) => {
  const id = html.match(new RegExp(`<label for="([^"]+)">${escape(labelText)}<`))?.[1];
  if (!id) throw new Error(`no label "${labelText}"`);
  const tag = html.match(new RegExp(`<(?:input|select|textarea)[^>]*\\sid="${id}"[^>]*>`))?.[0];
  if (!tag) throw new Error(`no control for "${labelText}"`);
  return { id, tag };
};
const attr = (tag: string, name: string) =>
  tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1] ?? null;
const textOf = (html: string, id: string) =>
  html.match(new RegExp(`<[a-z0-9]+ id="${id}">([^<]*)<`))?.[1] ?? null;
const visibleLabels = (html: string) =>
  [...html.matchAll(/<label for="[^"]+">([^<]+)</g)].map((match) => match[1]);
const liveRegion = /<p role="status">([^<]*)<\/p>/;

describe("contact form fields (AC-1)", () => {
  it("shows Name, Email, Topic, and Message in that order, each with a visible label", () => {
    const html = contact();
    expect(visibleLabels(html)).toEqual([
      "Name",
      "Email",
      "Topic",
      "Message",
      "Leave this field empty",
    ]);
  });

  it("marks every visible field required, for browsers and for screen readers", () => {
    const html = contact();
    for (const label of ["Name", "Email", "Topic", "Message"]) {
      expect(attr(controlFor(html, label).tag, "required")).toBe("");
    }
    expect(html.match(/<span>\(required\)<\/span>/g)).toHaveLength(4);
  });

  it("offers the three topics with nothing chosen at first", () => {
    const html = contact();
    const options = [...html.matchAll(/<option value="([^"]*)"( selected="")?>([^<]+)</g)].map(
      ([, value, selected, label]) => ({ value, selected: Boolean(selected), label }),
    );
    expect(options).toEqual([
      { value: "", selected: true, label: "Choose one" },
      { value: "role", selected: false, label: "A role" },
      { value: "project", selected: false, label: "A freelance project" },
      { value: "other", selected: false, label: "Something else" },
    ]);
  });

  it("uses an email input with autocomplete for name and email", () => {
    const html = contact();
    expect(attr(controlFor(html, "Email").tag, "type")).toBe("email");
    expect(attr(controlFor(html, "Email").tag, "autoComplete")).toBe("email");
    expect(attr(controlFor(html, "Name").tag, "autoComplete")).toBe("name");
  });

  it("names the form by its heading and ends with a Send message submit button", () => {
    const html = contact();
    const headingId = html.match(/<h2 id="([^"]+)">Send a message<\/h2>/)?.[1];
    expect(headingId).toBeTruthy();
    expect(html).toContain(`<form aria-labelledby="${headingId}" noValidate="">`);
    expect(html).toContain('<button type="submit">Send message</button>');
  });
});

describe("request form fields (AC-2)", () => {
  it("shows Name, Email, and the reason, with a Request details button", () => {
    const html = request();
    expect(visibleLabels(html)).toEqual([
      "Name",
      "Email",
      "Why do you want the details?",
      "Leave this field empty",
    ]);
    expect(html).toContain("Request the details</h2>");
    expect(html).toContain('<button type="submit">Request details</button>');
  });

  it("ties the reason hint to its field so it is read with it", () => {
    const html = request();
    const reason = controlFor(html, "Why do you want the details?");
    const hintId = attr(reason.tag, "aria-describedby");
    expect(hintId).toBe(`${reason.id}-hint`);
    expect(textOf(html, hintId ?? "")).toBe(
      "For example the role you are hiring for, or what you want to check.",
    );
  });

  it("never lets the visitor pick the project", () => {
    const html = request();
    expect(html).not.toContain("<select");
    expect(html).not.toMatch(/name="projectSlug"/);
  });
});

describe("field errors (AC-3)", () => {
  it("leaves validation to the form's own checks, not the browser's bubbles", () => {
    expect(contact()).toContain('noValidate=""');
  });

  it("marks each invalid field and ties it to its error message", () => {
    const html = contact("errors");
    const expected: Record<string, string> = {
      Name: "Enter your name.",
      Email: "Enter your email.",
      Topic: "Choose what it is about.",
      Message: "Write at least 10 characters.",
    };
    for (const [label, message] of Object.entries(expected)) {
      const { id, tag } = controlFor(html, label);
      expect(attr(tag, "aria-invalid")).toBe("true");
      expect(attr(tag, "aria-describedby")).toBe(`${id}-error`);
      expect(textOf(html, `${id}-error`)).toBe(message);
    }
  });

  it("shows no error state before anything is submitted", () => {
    const html = contact();
    expect(html).not.toContain("aria-invalid");
    expect(html).not.toContain('role="alert"');
  });
});

describe("pending and sent (AC-4)", () => {
  it("marks the button busy while sending", () => {
    const button = contact("pending").match(/<button[^>]*>/)?.[0] ?? "";
    expect(attr(button, "aria-busy")).toBe("true");
    expect(attr(button, "aria-disabled")).toBe("true");
  });

  it("replaces the form with the confirmation panel once sent", () => {
    const html = contact("sent");
    expect(html).not.toContain("<form");
    expect(html).toContain('<h2 tabindex="-1">Message sent</h2>');
    expect(html).toContain("<p>Thanks, Jane. I will reply to jane@company.com.</p>");
  });

  it("uses the request heading on the request form's confirmation", () => {
    const html = render(
      createElement(FormFrame, {
        heading: "Request the details",
        submitLabel: "Request details",
        sentHeading: "Request sent",
        endpoint: "/api/request",
        fields: [],
        schema: requestFields,
        demo: "sent",
      }),
    );
    expect(html).toContain('<h2 tabindex="-1">Request sent</h2>');
  });

  it("keeps one polite live region in the same place in every state, so it stays mounted", () => {
    for (const state of [undefined, "errors", "pending", "failed", "sent"] as const) {
      expect(contact(state)).toMatch(new RegExp(`^${liveRegion.source}`));
    }
    expect(request()).toMatch(new RegExp(`^${liveRegion.source}`));
  });

  it("leaves the live region empty until a real send succeeds", () => {
    expect(contact().match(liveRegion)?.[1]).toBe("");
    // The styleguide's sent demo must not announce on page load.
    expect(contact("sent").match(liveRegion)?.[1]).toBe("");
  });
});

describe("honeypot (AC-5)", () => {
  it("renders the website trap hidden from people, screen readers, and the Tab order", () => {
    const html = contact();
    const trap = html.match(/<div aria-hidden="true"><label for="([^"]+)">Leave this field empty/);
    expect(trap).not.toBeNull();
    const input = html.match(new RegExp(`<input id="${trap?.[1]}"[^>]*>`))?.[0] ?? "";
    expect(attr(input, "name")).toBe("website");
    expect(attr(input, "tabindex")).toBe("-1");
    expect(attr(input, "autoComplete")).toBe("off");
  });
});

describe("privacy line (AC-8)", () => {
  it("sits under the submit button on both forms", () => {
    for (const html of [contact(), request()]) {
      const button = html.indexOf('<button type="submit"');
      expect(button).toBeGreaterThan(-1);
      expect(html.indexOf(RETENTION)).toBeGreaterThan(button);
    }
  });
});

describe("failure message (AC-10)", () => {
  it("shows the generic failure in an alert with the LinkedIn link, opening in a new tab", () => {
    const alert = contact("failed").match(/<p role="alert">(.*?)<\/p>/)?.[1] ?? "";
    expect(alert).toMatch(/^Something went wrong on my side\. Try again, or reach me on <a /);
    expect(alert).toContain(`href="${LINKEDIN}"`);
    expect(alert).toContain('target="_blank"');
    expect(alert).toContain("LinkedIn");
    expect(alert).toContain("(opens in a new tab)");
    expect(alert).toMatch(/<\/a>\.$/);
  });

  it("drops the LinkedIn part when the profile has no LinkedIn link", () => {
    const alert = render(createElement(ContactForm, { demo: "failed" })).match(
      /<p role="alert">(.*?)<\/p>/,
    )?.[1];
    expect(alert).toBe("Something went wrong on my side. Try again.");
  });

  it("keeps the form and its fields on screen beside the failure", () => {
    const html = contact("failed");
    expect(html).toContain("<form");
    expect(visibleLabels(html)).toContain("Message");
  });
});

describe("without JavaScript (AC-11)", () => {
  it("renders the fallback line after the form on both forms", () => {
    for (const html of [contact(), request()]) {
      expect(html.indexOf(NO_JS)).toBeGreaterThan(html.indexOf("</form>"));
    }
  });

  it("drops the fallback line once the message is sent", () => {
    expect(contact("sent")).not.toContain(NO_JS);
  });
});
