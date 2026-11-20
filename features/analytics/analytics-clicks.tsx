"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { ANALYTICS_EVENTS, clickEventData, faqEventData, knownEvent } from "./config";
import { track } from "./track";

/**
 * One listener for every `data-analytics-event` element (the CV button, spec
 * 0004 AC-10; "Start a project", spec 0006 AC-17), so components carry plain
 * attributes and no tracking code. Its other `data-analytics-*` attributes
 * become the event data.
 *
 * One capture phase `toggle` listener counts FAQ items (`details` with
 * `data-analytics-faq`) the first time each opens in a page view, so the FAQ
 * stays server markup that works without JavaScript.
 */
export function AnalyticsClicks() {
  const pathname = usePathname();
  const opened = useRef<Set<string>>(new Set());

  // A new page view: every question may count again.
  useEffect(() => {
    opened.current = new Set();
  }, [pathname]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const element = event.target.closest("[data-analytics-event]");
      const name = knownEvent(element?.getAttribute("data-analytics-event"));
      if (name && element) track(name, clickEventData(element.attributes));
    };
    // `toggle` does not bubble, but a capture listener on the document sees it.
    const onToggle = (event: Event) => {
      const details = event.target;
      if (!(details instanceof HTMLDetailsElement) || !details.open) return;
      const question = details.getAttribute("data-analytics-faq");
      if (!question || opened.current.has(question)) return;
      opened.current.add(question);
      track(ANALYTICS_EVENTS.faqOpen, faqEventData(window.location.pathname, question));
    };
    document.addEventListener("click", onClick, { capture: true });
    document.addEventListener("toggle", onToggle, { capture: true });
    return () => {
      document.removeEventListener("click", onClick, { capture: true });
      document.removeEventListener("toggle", onToggle, { capture: true });
    };
  }, []);
  return null;
}
