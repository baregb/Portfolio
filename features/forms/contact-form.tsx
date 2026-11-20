"use client";

import { useMemo, useSyncExternalStore } from "react";
import { parseEnquiryQuery, type EnquiryPrefill, type ServiceNames } from "./enquiry-query";
import { FormFrame, type FieldDef, type FormDemo } from "./form-frame";
import { contactFields, TOPIC_LABELS, TOPICS } from "./schema";

// Spec 0005, AC-1: name, email, topic (nothing chosen at first), message.
const FIELDS: readonly FieldDef[] = [
  { name: "name", label: "Name", control: "input", autoComplete: "name" },
  { name: "email", label: "Email", control: "input", type: "email", autoComplete: "email" },
  {
    name: "topic",
    label: "Topic",
    control: "select",
    options: [
      { value: "", label: "Choose one" },
      ...TOPICS.map((topic) => ({ value: topic, label: TOPIC_LABELS[topic] })),
    ],
  },
  { name: "message", label: "Message", control: "textarea", rows: 7 },
];

const noSubscribe = () => () => {};
const browserSearch = () => window.location.search;
const serverSearch = () => "";
const NO_SERVICES: ServiceNames = {};

export function ContactForm({
  linkedinUrl,
  headingLevel,
  demo,
  services = NO_SERVICES,
}: {
  readonly linkedinUrl?: string;
  readonly headingLevel?: "h2" | "h3";
  /** `/styleguide` only. */
  readonly demo?: FormDemo;
  /** Published services by slug, so `?service=` can name one (spec 0006, AC-14). */
  readonly services?: ServiceNames;
}) {
  // The page is static, so the query only exists in the browser: empty while
  // rendering on the server and hydrating, then the real one (never
  // `useSearchParams`, which would client render the whole page).
  const search = useSyncExternalStore(noSubscribe, browserSearch, serverSearch);
  const prefill = useMemo<EnquiryPrefill | undefined>(
    () => (search ? parseEnquiryQuery(search, services) : undefined),
    [search, services],
  );
  return (
    <FormFrame
      heading="Send a message"
      submitLabel="Send message"
      sentHeading="Message sent"
      endpoint="/api/contact"
      fields={FIELDS}
      schema={contactFields}
      linkedinUrl={linkedinUrl}
      headingLevel={headingLevel}
      demo={demo}
      prefill={prefill}
    />
  );
}
