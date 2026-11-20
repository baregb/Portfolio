import { TOPICS, type Topic } from "./schema.ts";

// Spec 0006, AC-14: what "Start a project" hands the contact form. Pure, so
// it is tested without a browser; the form reads `location.search` once after
// mount and applies the result only to empty fields.

export type EnquiryPrefill = { readonly topic?: Topic; readonly message?: string };

/** Published services the form may name, slug to name, built at build time. */
export type ServiceNames = Readonly<Record<string, string>>;

const isTopic = (value: string | null): value is Topic =>
  value !== null && (TOPICS as readonly string[]).includes(value);

/** `?topic=project&service=web-apps` → the topic, and a message naming the service. Unknown values are ignored. */
export const parseEnquiryQuery = (search: string, services: ServiceNames): EnquiryPrefill => {
  const params = new URLSearchParams(search);
  const topic = params.get("topic");
  const service = params.get("service");
  const name = service !== null && Object.hasOwn(services, service) ? services[service] : undefined;
  return {
    ...(isTopic(topic) ? { topic } : {}),
    ...(name ? { message: `About: ${name}.\n\n` } : {}),
  };
};
