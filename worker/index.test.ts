import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import app from "./index";

// Integration tests for the API Worker (spec 0001). Requests go through the
// real Hono app; only the Static Assets binding is faked, since it is the one
// boundary the Worker hands off to.

const API_CSP = "default-src 'none'; frame-ancestors 'none'";

// The headers `public/_headers` sets on every page, keyed by lower case name.
function pageHeaders(): Map<string, string> {
  const file = readFileSync(join(import.meta.dirname, "../public/_headers"), "utf8");
  const headers = new Map<string, string>();
  for (const line of file.split("\n")) {
    const match = /^\s+([A-Za-z-]+):\s*(.+)$/.exec(line);
    if (match?.[1] && match[2]) headers.set(match[1].toLowerCase(), match[2].trim());
  }
  return headers;
}

function makeEnv(environment: Env["ENVIRONMENT"] = "production") {
  const assetsFetch = vi.fn(
    async (_input: Request | string | URL) =>
      new Response("<!doctype html><title>page</title>", {
        status: 200,
        headers: {
          "Content-Type": "text/html",
          "Content-Security-Policy": "default-src 'self'",
        },
      }),
  );
  const env = { ENVIRONMENT: environment, ASSETS: { fetch: assetsFetch } } as unknown as Env;
  return { env, assetsFetch };
}

function expectApiSecurityHeaders(res: Response) {
  expect(res.headers.get("Content-Security-Policy")).toBe(API_CSP);
  expect(res.headers.get("Strict-Transport-Security")).toBe("max-age=31536000; includeSubDomains");
  expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
  expect(res.headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
  expect(res.headers.get("Permissions-Policy")).toBe("camera=(), microphone=(), geolocation=()");
  expect(res.headers.get("Cache-Control")).toBe("no-store");
}

describe("GET /api/health", () => {
  it("returns 200 with ok and the production environment", async () => {
    const { env } = makeEnv("production");

    const res = await app.request("/api/health", {}, env);

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toMatch(/^application\/json/);
    expect(await res.json()).toEqual({ ok: true, environment: "production" });
  });

  it("reports the preview environment when deployed as the preview Worker", async () => {
    const { env } = makeEnv("preview");

    const res = await app.request("/api/health", {}, env);

    expect(await res.json()).toEqual({ ok: true, environment: "preview" });
  });

  it("ignores a query string", async () => {
    const { env } = makeEnv();

    const res = await app.request("/api/health?probe=1", {}, env);

    expect(res.status).toBe(200);
  });

  it("sets every API security header and no-store caching", async () => {
    const { env } = makeEnv();

    const res = await app.request("/api/health", {}, env);

    expectApiSecurityHeaders(res);
  });
});

describe("unknown /api routes", () => {
  it("return a JSON 404, not an HTML page", async () => {
    const { env, assetsFetch } = makeEnv();

    const res = await app.request("/api/nope", {}, env);

    expect(res.status).toBe(404);
    expect(res.headers.get("Content-Type")).toMatch(/^application\/json/);
    expect(await res.json()).toEqual({ error: "not_found" });
    expect(assetsFetch).not.toHaveBeenCalled();
  });

  it("return a JSON 404 for a method the route does not accept", async () => {
    const { env } = makeEnv();

    const res = await app.request("/api/health", { method: "POST" }, env);

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "not_found" });
  });

  it("still carry the API security headers", async () => {
    const { env } = makeEnv();

    const res = await app.request("/api/nope", {}, env);

    expectApiSecurityHeaders(res);
  });
});

describe("paths outside /api/", () => {
  it("are handed to Static Assets with the original request", async () => {
    const { env, assetsFetch } = makeEnv();

    const res = await app.request("http://localhost/about", {}, env);

    expect(assetsFetch).toHaveBeenCalledTimes(1);
    const forwarded = assetsFetch.mock.calls[0]?.[0] as Request;
    expect(new URL(forwarded.url).pathname).toBe("/about");
    expect(res.status).toBe(200);
    expect(await res.text()).toContain("<title>page</title>");
  });

  it("treat a bare /api (no trailing slash) as a page path", async () => {
    const { env, assetsFetch } = makeEnv();

    await app.request("/api", {}, env);

    expect(assetsFetch).toHaveBeenCalledTimes(1);
  });

  it("keep the page's own security policy instead of the stricter API one", async () => {
    // The fallback exists "so pages keep working". The API policy
    // (default-src 'none') would block every script and stylesheet on a page.
    const { env } = makeEnv();

    const res = await app.request("/about", {}, env);

    expect(res.headers.get("Content-Security-Policy")).toBe("default-src 'self'");
  });
});

describe("unexpected errors", () => {
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  // With no bindings at all, reading `c.env.ENVIRONMENT` throws inside the
  // handler, which is a real failure path (a misconfigured deploy).
  it("return a generic JSON 500 without leaking the error message", async () => {
    const res = await app.request("/api/health", {}, undefined);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({ error: "internal_error" });
  });

  it("log one structured JSON line with the path and method", async () => {
    await app.request("/api/health?token=secret", {}, undefined);

    expect(consoleError).toHaveBeenCalledTimes(1);
    const logged = JSON.parse(String(consoleError.mock.calls[0]?.[0]));
    expect(logged).toMatchObject({ level: "error", path: "/api/health", method: "GET" });
    expect(typeof logged.message).toBe("string");
    expect(JSON.stringify(logged)).not.toContain("secret");
  });

  it("still carry the API security headers", async () => {
    const res = await app.request("/api/health", {}, undefined);

    expectApiSecurityHeaders(res);
  });
});

describe("API security headers vs public/_headers", () => {
  it("mirror every page header except the content security policy", async () => {
    const { env } = makeEnv();
    const res = await app.request("/api/health", {}, env);

    const page = pageHeaders();
    page.delete("content-security-policy");

    expect(page.size).toBeGreaterThan(0);
    for (const [name, value] of page) {
      expect(res.headers.get(name), name).toBe(value);
    }
  });
});
