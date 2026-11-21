import { describe, expect, it } from "vitest";
import { enquiryHref } from "../../components/portfolio/enquiry.ts";
import { parseEnquiryQuery } from "./enquiry-query.ts";

// Spec 0006, AC-14: what a service page's "Start a project" hands the form.

const services = { "web-performance-seo": "Web performance and SEO" };

describe("parseEnquiryQuery", () => {
  it("selects the topic and names the service", () => {
    expect(parseEnquiryQuery("?topic=project&service=web-performance-seo", services)).toEqual({
      topic: "project",
      message: "About: Web performance and SEO.\n\n",
    });
  });

  it("takes the topic alone from /services", () => {
    expect(parseEnquiryQuery("?topic=project", services)).toEqual({ topic: "project" });
  });

  it.each(["?service=nope", "?topic=hire", "?service=toString", "", "?service=constructor"])(
    "ignores unknown values in %j",
    (search) => {
      expect(parseEnquiryQuery(search, services)).toEqual({});
    },
  );

  it("prefills nothing for /contact?topic=hire&service=nope (AC-14)", () => {
    expect(parseEnquiryQuery("?topic=hire&service=nope", services)).toEqual({});
  });

  it.each(["role", "project", "other"])("selects the %s topic", (topic) => {
    expect(parseEnquiryQuery(`?topic=${topic}`, services)).toEqual({ topic });
  });

  it("keeps a known topic when the service is unknown", () => {
    expect(parseEnquiryQuery("?topic=project&service=nope", services)).toEqual({
      topic: "project",
    });
  });

  it("names a known service even without a topic", () => {
    expect(parseEnquiryQuery("?service=web-performance-seo", services)).toEqual({
      message: "About: Web performance and SEO.\n\n",
    });
  });

  it("matches topics exactly, so a different case is ignored", () => {
    expect(parseEnquiryQuery("?topic=Project", services)).toEqual({});
  });

  it("names nothing when no service is published", () => {
    expect(parseEnquiryQuery("?topic=project&service=web-performance-seo", {})).toEqual({
      topic: "project",
    });
  });

  it("reads what enquiryHref writes, so the link and the form agree (AC-14)", () => {
    const search = new URL(enquiryHref("web-performance-seo"), "https://example.com").search;
    expect(parseEnquiryQuery(search, services)).toEqual({
      topic: "project",
      message: "About: Web performance and SEO.\n\n",
    });
  });
});
