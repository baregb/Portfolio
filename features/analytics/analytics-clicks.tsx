"use client";

import { useEffect } from "react";
import { knownEvent, type AnalyticsEvent } from "./config";
import { track } from "./track";

/** The event a click target (or its ancestor) names in `data-analytics-event`. */
const clickedEvent = (target: EventTarget | null): AnalyticsEvent | null =>
  target instanceof Element
    ? knownEvent(target.closest("[data-analytics-event]")?.getAttribute("data-analytics-event"))
    : null;

/**
 * One listener for every `data-analytics-event` element (the CV button, spec
 * 0004 AC-10), so components carry a plain attribute and no tracking code.
 */
export function AnalyticsClicks() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const name = clickedEvent(event.target);
      if (name) track(name);
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);
  return null;
}
