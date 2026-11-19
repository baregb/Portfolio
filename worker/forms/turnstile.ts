// Spec 0005, AC-5: server side Turnstile check (Siteverify), with a 5 second
// timeout. Its hostname must match the request's Origin hostname, except with
// Turnstile's test secrets, which always report a dummy hostname.

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const TIMEOUT_MS = 5000;

// Turnstile's documented test secrets: always pass, always fail, token spent.
const TEST_SECRETS: readonly string[] = [
  "1x0000000000000000000000000000000AA",
  "2x0000000000000000000000000000000AA",
  "3x0000000000000000000000000000000AA",
];

export type TurnstileResult =
  { readonly ok: true } | { readonly ok: false; readonly reason: "failed" | "unreachable" };

type SiteverifyBody = { readonly success?: unknown; readonly hostname?: unknown };

export const verifyTurnstile = async ({
  secret,
  token,
  ip,
  expectedHostname,
  fetcher = fetch,
}: {
  readonly secret: string;
  readonly token: string;
  readonly ip: string | undefined;
  readonly expectedHostname: string;
  readonly fetcher?: typeof fetch;
}): Promise<TurnstileResult> => {
  const form = new FormData();
  form.append("secret", secret);
  form.append("response", token);
  if (ip) form.append("remoteip", ip);

  let body: SiteverifyBody;
  try {
    const response = await fetcher(SITEVERIFY_URL, {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) return { ok: false, reason: "unreachable" };
    body = await response.json();
  } catch {
    // A timeout, a network error, or a body that is not JSON.
    return { ok: false, reason: "unreachable" };
  }

  if (body.success !== true) return { ok: false, reason: "failed" };
  if (!TEST_SECRETS.includes(secret) && body.hostname !== expectedHostname) {
    return { ok: false, reason: "failed" };
  }
  return { ok: true };
};
