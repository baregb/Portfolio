"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { ANALYTICS_EVENTS, type EventData } from "./config";
import { track } from "./track";

/** Records a lens visit once per page view, with the lens slug. */
export function TrackLensVisit({ lens }: { readonly lens: string }) {
  // The last lens sent: once per lens view, even when the lens switcher moves
  // between lenses without remounting (and under React's double effect in dev).
  const sent = useRef<string | null>(null);
  useEffect(() => {
    if (sent.current === lens) return;
    sent.current = lens;
    track(ANALYTICS_EVENTS.lensVisit, { lens });
  }, [lens]);
  return null;
}

/** Records a service page view once per page view, with the service slug (spec 0006, AC-17). */
export function TrackServiceVisit({ service }: { readonly service: string }) {
  const sent = useRef<string | null>(null);
  useEffect(() => {
    if (sent.current === service) return;
    sent.current = service;
    track(ANALYTICS_EVENTS.serviceVisit, { service });
  }, [service]);
  return null;
}

/**
 * Wraps what follows a case study's last section. A read is recorded once,
 * when that scrolls into view, so it counts visitors who reached the end of
 * the story, not everyone who opened the page.
 */
export function TrackCaseStudyRead({
  project,
  children,
}: {
  readonly project: string;
  readonly children: ReactNode;
}) {
  const marker = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = marker.current;
    if (!element || typeof IntersectionObserver === "undefined") return;
    const data: EventData = { project };
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect();
        track(ANALYTICS_EVENTS.caseStudyRead, data);
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [project]);
  return <div ref={marker}>{children}</div>;
}
