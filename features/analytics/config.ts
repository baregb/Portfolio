// Analytics settings (spec 0001: Umami Cloud, cookieless, so no cookie
// banner). Pure: validates `NEXT_PUBLIC_UMAMI_WEBSITE_ID`. Unset means
// analytics is off (local, CI, and preview builds); a set but malformed id
// is a typo and fails the build, naming the variable.

export type WebsiteIdResult =
  | { readonly ok: true; readonly websiteId: string | null }
  | { readonly ok: false; readonly error: string };

const NAME = "NEXT_PUBLIC_UMAMI_WEBSITE_ID";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const readUmamiWebsiteId = (value: string | undefined): WebsiteIdResult => {
  const raw = value?.trim();
  if (!raw) return { ok: true, websiteId: null };
  if (!UUID.test(raw)) {
    return { ok: false, error: `${NAME} must be the Umami website id (a UUID): "${raw}".` };
  }
  return { ok: true, websiteId: raw.toLowerCase() };
};

/** The Umami Cloud tracker. `public/_headers` allows it and its collector hosts. */
export const UMAMI_SCRIPT_SRC = "https://cloud.umami.is/script.js";
export const UMAMI_SCRIPT_ID = "umami-script";

/** The custom events the scope asks for; page views are recorded on their own. */
export const ANALYTICS_EVENTS = {
  cvDownload: "cv-download",
  lensVisit: "lens-visit",
  caseStudyRead: "case-study-read",
  // Spec 0006, AC-17.
  serviceVisit: "service-visit",
  projectEnquiry: "project-enquiry",
  faqOpen: "faq-open",
} as const;

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

const KNOWN_EVENTS: ReadonlySet<string> = new Set(Object.values(ANALYTICS_EVENTS));

/** A `data-analytics-event` value, if it names a known event; anything else is ignored. */
export const knownEvent = (name: string | null | undefined): AnalyticsEvent | null =>
  name && KNOWN_EVENTS.has(name) ? (name as AnalyticsEvent) : null;
export type EventData = Readonly<Record<string, string>>;

const DATA_PREFIX = "data-analytics-";
/** Attributes that name the event or the FAQ question, never sent as data. */
const NOT_DATA: ReadonlySet<string> = new Set(["event", "faq"]);

/**
 * Spec 0006, AC-17: the event data a clicked element carries, from its
 * `data-analytics-<key>` attributes (`data-analytics-service` → `service`).
 * `undefined` when there is none, so plain events stay plain.
 */
export const clickEventData = (
  attributes: Iterable<{ readonly name: string; readonly value: string }>,
): EventData | undefined => {
  const entries = [...attributes]
    .filter(({ name }) => name.startsWith(DATA_PREFIX))
    .map(({ name, value }) => [name.slice(DATA_PREFIX.length), value] as const)
    .filter(([key]) => key !== "" && !NOT_DATA.has(key));
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
};

/** The longest question text a `faq-open` event carries. */
export const FAQ_QUESTION_MAX = 100;

/** Spec 0006, AC-17: what `faq-open` sends. */
export const faqEventData = (page: string, question: string): EventData => ({
  page,
  question: question.slice(0, FAQ_QUESTION_MAX),
});
