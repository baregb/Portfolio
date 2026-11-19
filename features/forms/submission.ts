// Spec 0005, AC-10 and AC-12: pure helpers the forms and the build use.
// Relative imports only.

export type Failure = "rate_limited" | "turnstile_failed" | "network" | "generic";

/** What a server answer means for the visitor (AC-4, AC-10). */
export const outcomeOf = (status: number, body: unknown): "success" | Failure => {
  if (status === 201) return "success";
  if (status === 429) return "rate_limited";
  const code =
    typeof body === "object" && body !== null ? (body as { error?: unknown }).error : undefined;
  if (status === 403 && code === "turnstile_failed") return "turnstile_failed";
  return "generic";
};

/** The line shown in the form for each failure (AC-10). The generic one adds LinkedIn when known. */
export const FAILURE_MESSAGES: Readonly<Record<Failure, string>> = {
  rate_limited: "Too many tries. Wait a minute, then send it again.",
  turnstile_failed: "Could not confirm you are human. Try the check again.",
  network: "Could not send. Check your connection and try again.",
  generic: "Something went wrong on my side. Try again, or reach me on LinkedIn.",
};

export type SiteKeyResult =
  { readonly ok: true; readonly value: string } | { readonly ok: false; readonly error: string };

/** AC-12: the production build needs the Turnstile site key, and names it when missing. */
export const readTurnstileSiteKey = (value: string | undefined): SiteKeyResult => {
  const key = value?.trim();
  return key
    ? { ok: true, value: key }
    : {
        ok: false,
        error:
          "NEXT_PUBLIC_TURNSTILE_SITE_KEY is missing. Set it in .env.local (Turnstile's test key 1x00000000000000000000AA works locally) or in the build variables.",
      };
};
