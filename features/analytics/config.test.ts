import { describe, expect, it } from "vitest";
import {
  ANALYTICS_EVENTS,
  clickEventData,
  faqEventData,
  knownEvent,
  readUmamiWebsiteId,
} from "./config";

describe("readUmamiWebsiteId", () => {
  it.each([undefined, "", "  "])("turns analytics off when unset (%j)", (value) => {
    expect(readUmamiWebsiteId(value)).toEqual({ ok: true, websiteId: null });
  });

  it("accepts a website id and normalises it", () => {
    expect(readUmamiWebsiteId(" 94DB1CB1-74F4-4A40-AD6C-962362670409 ")).toEqual({
      ok: true,
      websiteId: "94db1cb1-74f4-4a40-ad6c-962362670409",
    });
  });

  it.each(["abc", "94db1cb1-74f4-4a40-ad6c", "<script>"])(
    "fails on a malformed id (%j)",
    (value) => {
      const result = readUmamiWebsiteId(value);
      expect(result.ok).toBe(false);
      expect(!result.ok && result.error).toMatch(/^NEXT_PUBLIC_UMAMI_WEBSITE_ID must be/);
    },
  );
});

describe("knownEvent", () => {
  it("passes through the events the scope asks for", () => {
    expect(Object.values(ANALYTICS_EVENTS).map(knownEvent)).toEqual([
      "cv-download",
      "lens-visit",
      "case-study-read",
      "service-visit",
      "project-enquiry",
      "faq-open",
    ]);
  });

  it.each([null, undefined, "", "CV-Download", "page-view"])("ignores %j", (name) => {
    expect(knownEvent(name)).toBeNull();
  });
});

describe("event data (spec 0006, AC-17)", () => {
  const attr = (name: string, value: string) => ({ name, value });

  it("sends a click's data-analytics-* attributes, without the event name", () => {
    expect(
      clickEventData([
        attr("href", "/contact"),
        attr("data-analytics-event", "project-enquiry"),
        attr("data-analytics-service", "web-apps"),
      ]),
    ).toEqual({ service: "web-apps" });
  });

  it("sends nothing for a plain event", () => {
    expect(clickEventData([attr("data-analytics-event", "cv-download")])).toBeUndefined();
  });

  it("cuts a FAQ question to 100 characters", () => {
    expect(faqEventData("/services/web-apps", "Q".repeat(120))).toEqual({
      page: "/services/web-apps",
      question: "Q".repeat(100),
    });
  });
});
