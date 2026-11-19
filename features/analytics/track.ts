import { UMAMI_SCRIPT_ID, type AnalyticsEvent, type EventData } from "./config";

// The one browser edge that sends an event. The tracker loads with `defer`,
// so an event raised before it is ready waits for its `load`. With analytics
// off, blocked, or not loaded, the event is dropped silently: analytics must
// never break the page.

type Umami = { readonly track: (event: string, data?: EventData) => void };

const umami = (): Umami | undefined => (window as Window & { umami?: Umami }).umami;

export const track = (event: AnalyticsEvent, data?: EventData): void => {
  if (typeof window === "undefined") return;
  const tracker = umami();
  if (tracker) {
    tracker.track(event, data);
    return;
  }
  document
    .getElementById(UMAMI_SCRIPT_ID)
    ?.addEventListener("load", () => umami()?.track(event, data), { once: true });
};
