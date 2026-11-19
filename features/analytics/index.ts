import { readUmamiWebsiteId } from "./config";

// Binds analytics to `NEXT_PUBLIC_UMAMI_WEBSITE_ID`, read once at build.
// Unset: no tracker on the page. Malformed: `next.config.ts` already failed
// a production build; anywhere else this throws with the same message.

const result = readUmamiWebsiteId(process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID);
if (!result.ok) throw new Error(result.error);

export const getUmamiWebsiteId = (): string | null => result.websiteId;

export { AnalyticsClicks } from "./analytics-clicks";
export { AnalyticsScript } from "./analytics-script";
export { TrackCaseStudyRead, TrackLensVisit } from "./track-events";
