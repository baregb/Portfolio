"use client";

import { FormFrame, type FieldDef } from "./form-frame";
import { requestFields } from "./schema";

// Spec 0005, AC-2: name, email, and a required reason. The project comes from
// the page, never from the visitor.
const FIELDS: readonly FieldDef[] = [
  { name: "name", label: "Name", control: "input", autoComplete: "name" },
  { name: "email", label: "Email", control: "input", type: "email", autoComplete: "email" },
  {
    name: "reason",
    label: "Why do you want the details?",
    control: "textarea",
    rows: 5,
    hint: "For example the role you are hiring for, or what you want to check.",
  },
];

export function RequestForm({
  projectSlug,
  linkedinUrl,
}: {
  readonly projectSlug: string;
  readonly linkedinUrl?: string;
}) {
  return (
    <FormFrame
      heading="Request the details"
      submitLabel="Request details"
      sentHeading="Request sent"
      endpoint="/api/request"
      fields={FIELDS}
      schema={requestFields}
      extra={{ projectSlug }}
      linkedinUrl={linkedinUrl}
    />
  );
}
