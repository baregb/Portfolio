import { describe, expect, it } from "vitest";
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
});
