// The canonical site address (spec 0001: `NEXT_PUBLIC_SITE_URL`, the apex in
// production, the preview address in preview). Pure: takes the raw value,
// returns the origin with no trailing slash, or a typed error naming the
// variable. Plain `http` is allowed only for local addresses.

export type SiteUrlResult =
  { readonly ok: true; readonly url: string } | { readonly ok: false; readonly error: string };

const NAME = "NEXT_PUBLIC_SITE_URL";
const LOCAL_HOSTS: ReadonlySet<string> = new Set(["localhost", "127.0.0.1"]);

/** Local development and tests use this when the variable is not set. */
export const DEV_SITE_URL = "http://localhost:3000";

export const readSiteUrl = (value: string | undefined): SiteUrlResult => {
  const raw = value?.trim();
  if (!raw) return { ok: false, error: `${NAME} is not set (the canonical site address).` };
  if (!URL.canParse(raw)) return { ok: false, error: `${NAME} is not a valid URL: "${raw}".` };
  const url = new URL(raw);
  const local = LOCAL_HOSTS.has(url.hostname);
  if (url.protocol !== "https:" && !(local && url.protocol === "http:")) {
    return { ok: false, error: `${NAME} must use https (http only for localhost): "${raw}".` };
  }
  if (url.pathname !== "/" || url.search || url.hash || url.username || url.password) {
    return { ok: false, error: `${NAME} must be a bare origin with no path: "${raw}".` };
  }
  return { ok: true, url: url.origin };
};

/**
 * Whether search engines may index this address. Local addresses and the
 * preview Worker's `workers.dev` address must never be indexed.
 */
export const isIndexable = (siteUrl: string): boolean => {
  const { hostname } = new URL(siteUrl);
  return !LOCAL_HOSTS.has(hostname) && !hostname.endsWith(".workers.dev");
};
