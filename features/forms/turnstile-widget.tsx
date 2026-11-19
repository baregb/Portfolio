"use client";

import { useEffect, useImperativeHandle, useRef, type Ref } from "react";

// Spec 0005, Build details: Turnstile rendered explicitly in `execute` mode,
// so the check runs only when the visitor submits (the token is always fresh),
// and only shows a challenge when it has to. Its theme follows the site's own
// toggle (the `dark` class on <html>), not the OS.

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type RenderOptions = {
  readonly sitekey: string;
  readonly execution: "execute";
  readonly appearance: "interaction-only";
  readonly theme: "light" | "dark";
  readonly callback: (token: string) => void;
  readonly "error-callback": () => void;
  readonly "expired-callback": () => void;
};
type TurnstileApi = {
  readonly render: (element: HTMLElement, options: RenderOptions) => string;
  readonly execute: (widgetId: string) => void;
  readonly reset: (widgetId: string) => void;
  readonly remove: (widgetId: string) => void;
};
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export type TurnstileHandle = {
  /** Runs the check and resolves with a fresh token, or rejects. */
  readonly execute: () => Promise<string>;
  readonly reset: () => void;
};

let scriptPromise: Promise<TurnstileApi> | undefined;
const loadTurnstile = (): Promise<TurnstileApi> => {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  scriptPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () =>
      window.turnstile ? resolve(window.turnstile) : reject(new Error("turnstile"));
    script.onerror = () => {
      scriptPromise = undefined;
      reject(new Error("turnstile"));
    };
    document.head.append(script);
  });
  return scriptPromise;
};

const siteTheme = (): "light" | "dark" =>
  document.documentElement.classList.contains("dark") ? "dark" : "light";

type Pending = { resolve: (token: string) => void; reject: (error: Error) => void };

export function TurnstileWidget({
  siteKey,
  ref,
}: {
  readonly siteKey: string;
  readonly ref: Ref<TurnstileHandle>;
}) {
  const container = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const pending = useRef<Pending | null>(null);
  const ready = useRef<Promise<void> | null>(null);

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    let api: TurnstileApi | undefined;
    let theme = siteTheme();

    const settle = (outcome: { token: string } | { error: string }) => {
      const current = pending.current;
      pending.current = null;
      if (!current) return;
      if ("token" in outcome) current.resolve(outcome.token);
      else current.reject(new Error(outcome.error));
    };

    const render = () => {
      if (!api) return;
      if (widgetId.current) api.remove(widgetId.current);
      widgetId.current = api.render(element, {
        sitekey: siteKey,
        execution: "execute",
        appearance: "interaction-only",
        theme,
        callback: (token) => settle({ token }),
        "error-callback": () => settle({ error: "turnstile_error" }),
        "expired-callback": () => settle({ error: "turnstile_expired" }),
      });
    };

    ready.current = loadTurnstile().then((loaded) => {
      api = loaded;
      render();
    });

    // Follow the site's theme toggle.
    const observer = new MutationObserver(() => {
      const next = siteTheme();
      if (next === theme) return;
      theme = next;
      render();
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    return () => {
      observer.disconnect();
      if (api && widgetId.current) api.remove(widgetId.current);
      widgetId.current = null;
    };
  }, [siteKey]);

  useImperativeHandle(
    ref,
    () => ({
      execute: async () => {
        await ready.current;
        const api = window.turnstile;
        const id = widgetId.current;
        if (!api || !id) throw new Error("turnstile_unavailable");
        return new Promise<string>((resolve, reject) => {
          pending.current = { resolve, reject };
          api.execute(id);
        });
      },
      reset: () => {
        pending.current = null;
        if (window.turnstile && widgetId.current) window.turnstile.reset(widgetId.current);
      },
    }),
    [],
  );

  return <div ref={container} className="empty:hidden" />;
}
