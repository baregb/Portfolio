import * as Sentry from "@sentry/cloudflare";
import { Hono } from "hono";
import requestProjects from "../.generated/request-projects.json";
import type { RequestProjectMap } from "../features/forms/request-projects";
import { createFormsRoutes, type FormsDeps } from "./forms/routes";
import { runScheduled } from "./forms/scheduled";

// The API Worker (spec 0001). Static Assets serve every page; this Worker runs
// only for `/api/*` (`run_worker_first` in wrangler.jsonc). The forms (spec
// 0005) add their routes and a cron handler here; the AI chat comes later.

// API responses are JSON, never HTML, so their content security policy can be
// stricter than the one pages get from `public/_headers`. The other headers
// mirror that file.
const API_SECURITY_HEADERS: Record<string, string> = {
  "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Cache-Control": "no-store",
};

const isApiPath = (url: string): boolean => new URL(url).pathname.startsWith("/api/");

/** Builds the app; tests pass their own dependencies. */
export const createApp = (deps: FormsDeps) => {
  const app = new Hono<{ Bindings: Env }>();

  app.use("*", async (c, next) => {
    await next();
    // Pages handed back to Static Assets keep their own headers from
    // `public/_headers`; the API policy would block their scripts and styles.
    if (!isApiPath(c.req.url)) return;
    for (const [name, value] of Object.entries(API_SECURITY_HEADERS)) {
      c.res.headers.set(name, value);
    }
  });

  // Liveness check: proves the Worker is reachable and which environment it is.
  app.get("/api/health", (c) => c.json({ ok: true, environment: c.env.ENVIRONMENT }));

  app.notFound((c) => {
    // Only `/api/*` reaches this Worker. If anything else ever does, hand it to
    // Static Assets so pages keep working.
    if (!isApiPath(c.req.url)) {
      return c.env.ASSETS.fetch(c.req.raw);
    }
    return c.json({ error: "not_found" }, 404);
  });

  app.onError((err, c) => {
    console.error(
      JSON.stringify({
        level: "error",
        message: err.message,
        path: new URL(c.req.url).pathname,
        method: c.req.method,
      }),
    );
    return c.json({ error: "internal_error" }, 500);
  });

  app.route("/", createFormsRoutes(deps));

  return app;
};

const projects: RequestProjectMap = requestProjects;

// AC-7: the third failed attempt for a row alerts through Sentry, carrying
// only the submission id.
const alert = (submissionId: string) => {
  Sentry.captureMessage("notify_failed", { level: "error", extra: { submissionId } });
};

const liveDeps: FormsDeps = { projects, alert, now: () => new Date() };

export const app = createApp(liveDeps);

// One default export carries both handlers. Sentry is off without a DSN
// (local and CI); Sentry 11 leaves personal data out by default.
export default Sentry.withSentry(
  (env: Env) => ({
    dsn: env.SENTRY_DSN || undefined,
    enabled: Boolean(env.SENTRY_DSN),
  }),
  {
    fetch: app.fetch,
    scheduled: (controller, env, ctx) => {
      ctx.waitUntil(
        runScheduled({ env, now: new Date(controller.scheduledTime), projects, alert }),
      );
    },
  } satisfies ExportedHandler<Env>,
);
