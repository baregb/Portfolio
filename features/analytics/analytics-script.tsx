import { UMAMI_SCRIPT_ID, UMAMI_SCRIPT_SRC } from "./config";

/**
 * The Umami tracker: cookieless, deferred, limited to the canonical host so a
 * copy of the site elsewhere records nothing, and it respects Do Not Track.
 * Page views (including client side route changes) are recorded by the script.
 */
export function AnalyticsScript({
  websiteId,
  host,
}: {
  readonly websiteId: string;
  readonly host: string;
}) {
  return (
    <script
      id={UMAMI_SCRIPT_ID}
      defer
      src={UMAMI_SCRIPT_SRC}
      data-website-id={websiteId}
      data-domains={host}
      data-do-not-track="true"
    />
  );
}
