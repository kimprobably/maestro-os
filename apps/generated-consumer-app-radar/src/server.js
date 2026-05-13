import { createServer } from "node:http";
import { existsSync, createReadStream } from "node:fs";
import { extname, join, resolve } from "node:path";
import { loadApps } from "./repository.js";
import { addCustomApp, refreshApps } from "./ingest.js";
import { buildSummary } from "./summary.js";

const publicDir = resolve("public");
const port = Number(process.env.PORT || 4317);
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
};
const jsonHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

function sendJson(res, status, body) {
  res.writeHead(status, jsonHeaders);
  res.end(JSON.stringify(body));
}

async function readJson(req) {
  let body = "";
  for await (const chunk of req) body += chunk;
  if (!body.trim()) return {};
  return JSON.parse(body);
}

function serveStatic(req, res) {
  const pathname = new URL(req.url, "http://localhost").pathname;
  const file =
    pathname === "/"
      ? join(publicDir, "index.html")
      : join(publicDir, pathname);
  if (!file.startsWith(publicDir) || !existsSync(file)) return false;
  res.writeHead(200, {
    "Content-Type": types[extname(file)] || "application/octet-stream",
  });
  createReadStream(file).pipe(res);
  return true;
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  try {
    if (req.method === "OPTIONS") return sendJson(res, 204, {});
    if (url.pathname === "/health") return sendJson(res, 200, { ok: true });
    if (url.pathname === "/api/summary" && req.method === "GET")
      return sendJson(res, 200, buildSummary(loadApps()));
    if (url.pathname === "/api/apps" && req.method === "GET")
      return sendJson(res, 200, { apps: loadApps() });
    if (url.pathname === "/api/fetch-more" && req.method === "GET") {
      const category = url.searchParams.get("category") || "";
      const limit = Number(url.searchParams.get("limit") || 5);
      const offset = Number(url.searchParams.get("offset") || 0);
      const seed = url.searchParams.get("seed") || "";
      const mode = url.searchParams.get("mode") || "live";
      const allowFixtureFallback =
        url.searchParams.get("allow_fixture_fallback") === "true";
      const { fetchMoreApps } = await import("./ingest.js");
      const result = await fetchMoreApps({
        category,
        limit,
        offset,
        seed,
        mode,
        allowFixtureFallback,
      });
      return sendJson(res, 200, {
        apps: result.apps || [],
        next_offset: result.nextOffset || 0,
        has_more: result.hasMore || false,
      });
    }
    if (url.pathname === "/api/enrich-app" && req.method === "POST") {
      const body = await readJson(req);
      const mode = url.searchParams.get("mode") || "live";
      const allowFixtureFallback =
        url.searchParams.get("allow_fixture_fallback") === "true";
      const { enrichAppWithLiveSources } = await import("./ingest.js");
      const enriched = await enrichAppWithLiveSources(body, {
        mode,
        allowFixtureFallback,
      });
      return sendJson(res, 200, { ok: true, app: enriched });
    }
    if (url.pathname === "/api/apps" && req.method === "POST")
      return sendJson(res, 201, {
        ok: true,
        app: await addCustomApp(await readJson(req)),
      });
    if (url.pathname.startsWith("/api/apps/") && req.method === "GET") {
      const id = decodeURIComponent(url.pathname.split("/").pop());
      const app = loadApps().find((item) => item.id === id);
      return app
        ? sendJson(res, 200, { app })
        : sendJson(res, 404, { error: "not_found" });
    }
    if (url.pathname === "/api/refresh" && req.method === "POST") {
      const apps = await refreshApps({
        mode: url.searchParams.get("mode") || "fixture",
      });
      return sendJson(res, 200, { ok: true, apps });
    }
    if (serveStatic(req, res)) return;
    sendJson(res, 404, { error: "not_found" });
  } catch (error) {
    sendJson(res, 500, {
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

await refreshApps({ mode: "fixture" });
server.listen(port, () =>
  console.log("Consumer App Radar listening on :" + port),
);
