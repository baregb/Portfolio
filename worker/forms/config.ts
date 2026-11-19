// Spec 0005, AC-12: what the Worker needs before it accepts a submission,
// and what the email step needs before it sends. Missing values are named in
// the log, never in the response. Bindings and secrets can be absent at run
// time even though `Env` types them as present, so read them loosely here.

type Loose<T> = { readonly [K in keyof T]?: T[K] | undefined };

export type IntakeConfig = {
  readonly db: D1Database;
  readonly rateLimiter: RateLimit;
  readonly turnstileSecret: string;
  readonly allowedOrigins: readonly string[];
};

export type EmailConfig = {
  readonly email: SendEmail;
  readonly to: string;
  readonly from: string;
  readonly siteUrl: string;
  readonly environment: string;
};

export type ConfigResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly missing: readonly string[] };

const text = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;

/** Comma separated origins, trimmed, without a trailing slash. */
export const parseOrigins = (value: string): readonly string[] =>
  value
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter((origin) => origin !== "");

const missingNames = (entries: Readonly<Record<string, unknown>>): readonly string[] =>
  Object.entries(entries)
    .filter(([, value]) => value === undefined)
    .map(([name]) => name);

/** Gates a submission: only what saving it needs (AC-12). */
export const readIntakeConfig = (env: Loose<Env>): ConfigResult<IntakeConfig> => {
  const origins = text(env.ALLOWED_ORIGINS);
  const values = {
    DB: env.DB,
    RATE_LIMITER: env.RATE_LIMITER,
    TURNSTILE_SECRET_KEY: text(env.TURNSTILE_SECRET_KEY),
    ALLOWED_ORIGINS: origins && parseOrigins(origins).length > 0 ? origins : undefined,
  };
  const missing = missingNames(values);
  if (missing.length > 0 || !values.DB || !values.RATE_LIMITER || !values.TURNSTILE_SECRET_KEY) {
    return { ok: false, missing };
  }
  return {
    ok: true,
    value: {
      db: values.DB,
      rateLimiter: values.RATE_LIMITER,
      turnstileSecret: values.TURNSTILE_SECRET_KEY,
      allowedOrigins: parseOrigins(values.ALLOWED_ORIGINS ?? ""),
    },
  };
};

/** Checked in the send step; a gap leaves the row for the retry job (AC-6). */
export const readEmailConfig = (env: Loose<Env>): ConfigResult<EmailConfig> => {
  const values = {
    EMAIL: env.EMAIL,
    NOTIFY_TO: text(env.NOTIFY_TO),
    NOTIFY_FROM: text(env.NOTIFY_FROM),
    SITE_URL: text(env.SITE_URL)?.replace(/\/+$/, ""),
  };
  const missing = missingNames(values);
  if (
    missing.length > 0 ||
    !values.EMAIL ||
    !values.NOTIFY_TO ||
    !values.NOTIFY_FROM ||
    !values.SITE_URL
  ) {
    return { ok: false, missing };
  }
  return {
    ok: true,
    value: {
      email: values.EMAIL,
      to: values.NOTIFY_TO,
      from: values.NOTIFY_FROM,
      siteUrl: values.SITE_URL,
      environment: text(env.ENVIRONMENT) ?? "production",
    },
  };
};
