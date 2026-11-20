// Spec 0006, AC-14: where "Start a project" goes. Pure, so tests and the
// contact form's query parser agree on the parameter names.

export const ENQUIRY_TOPIC = "project";

/** `/contact?topic=project`, plus `&service=<slug>` from a service page. */
export const enquiryHref = (service?: string): string =>
  `/contact?topic=${ENQUIRY_TOPIC}${service ? `&service=${encodeURIComponent(service)}` : ""}`;
