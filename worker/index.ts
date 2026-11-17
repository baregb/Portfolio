import { Hono } from "hono";

// The API Worker (spec 0001). Static Assets serve every page; this Worker runs
// only for `/api/*` (`run_worker_first` in wrangler.jsonc). Forms and the AI
// chat add their routes here.

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

export default app satisfies ExportedHandler<Env>;
