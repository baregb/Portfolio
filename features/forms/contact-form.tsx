"use client";

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

export function ContactForm({
  linkedinUrl,
  headingLevel,
  demo,
}: {
  readonly linkedinUrl?: string;
  readonly headingLevel?: "h2" | "h3";
  /** `/styleguide` only. */
  readonly demo?: FormDemo;
}) {
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
    />
  );
}
