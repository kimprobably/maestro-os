#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--"))
    throw new Error("Missing value for " + name);
  return value;
}

const appDir = resolve(argValue("--app-dir", "apps/generated-consumer-app-radar"));
const feedbackPath = argValue("--feedback", "feedback/consumer-radar-product-feedback.md");

function write(relativePath, content) {
  const fullPath = resolve(appDir, relativePath);
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, content.endsWith("\n") ? content : `${content}\n`);
}

function rootWrite(relativePath, content) {
  const fullPath = resolve(relativePath);
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, content.endsWith("\n") ? content : `${content}\n`);
}

function slug(value) {
  return String(value || "app")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

const fixturePath = resolve(appDir, "fixtures/apps.json");
const originalApps = JSON.parse(readFileSync(fixturePath, "utf8"));

const rankById = {
  "one-sec": 62,
  opal: 84,
  stoic: 116,
  screenzen: 71,
  structured: 93,
  finch: 58,
  rise: 128,
  ladder: 67,
};

const reviewSamplesById = {
  "one-sec": [
    {
      rating: 5,
      title: "It stops the autopilot",
      body: "The breathing step is exactly enough friction, but I wish schedules could skip meetings and travel days.",
      source: "fixture-review",
    },
    {
      rating: 4,
      title: "Family controls would make this stick",
      body: "Great for me, harder for my teenager. Please add shared household rules and accountability.",
      source: "fixture-review",
    },
  ],
  opal: [
    {
      rating: 4,
      title: "Strong but expensive",
      body: "The sessions work, but the subscription feels high. A student tier would help.",
      source: "fixture-review",
    },
    {
      rating: 3,
      title: "Bypass education needed",
      body: "I found ways around the block without realizing it. Setup should explain the strongest mode.",
      source: "fixture-review",
    },
  ],
  default: [
    {
      rating: 4,
      title: "Promising daily habit",
      body: "Useful and polished. I want clearer onboarding, more flexible reminders, and better exports.",
      source: "fixture-review",
    },
    {
      rating: 5,
      title: "The idea is sticky",
      body: "The core loop is motivating. Please add more personalization and weekly progress summaries.",
      source: "fixture-review",
    },
  ],
};

function exampleContent(app) {
  return [
    {
      platform: "TikTok",
      creator: "productivity creator",
      format: "before-after demo",
      hook: `I tried ${app.name} for 7 days so I would stop doom-scrolling.`,
      caption: `${app.name} turns a bad habit into one extra conscious step.`,
      engagement: app.socialDelta4w * 140,
      source: "fixture-example",
      verifiedLiveScrape: false,
    },
    {
      platform: "Instagram",
      creator: "routine account",
      format: "carousel",
      hook: `The tiny rule that made ${app.category.toLowerCase()} feel easier.`,
      caption: `A practical ${app.category.toLowerCase()} workflow with ${app.name}.`,
      engagement: app.socialDelta4w * 95,
      source: "fixture-example",
      verifiedLiveScrape: false,
    },
  ];
}

function enhanceApp(app) {
  const currentRank = rankById[app.id] || 140;
  const isCategoryLeader = currentRank <= 15;
  return {
    ...app,
    currentRank,
    isCategoryLeader,
    categoryLeader: isCategoryLeader,
    sizeBand: currentRank <= 15 ? "leader" : currentRank <= 150 ? "emerging" : "long-tail",
    growthHypothesis: {
      text: `${app.name} appears to be accelerating because ${String(app.socialStrategy?.[0] || "its acquisition loop").toLowerCase()}.`,
      confidence: 0.58,
      basis: "Fixture-backed hypothesis. No live Apify social scrape was completed in this run.",
      liveScraped: false,
      sourceMode: "fixture",
    },
    reviewSamples: reviewSamplesById[app.id] || reviewSamplesById.default,
    exampleContent: exampleContent(app),
    dataSources: [
      {
        name: "Apple App Store RSS",
        status: "adapter-ready",
        note: "Review adapter exists; fixture samples are shown until a live refresh succeeds.",
      },
      {
        name: "Apify TikTok/Instagram",
        status: "not-run",
        note: "Example content is fixture-backed unless a later live actor run marks it verifiedLiveScrape=true.",
      },
      {
        name: "Fixture seed",
        status: "active",
        note: "Deterministic evidence keeps CI stable and must be visually disclosed.",
      },
    ],
  };
}

const enhancedApps = originalApps.map(enhanceApp);
write("fixtures/apps.json", JSON.stringify(enhancedApps, null, 2));

write(
  "src/scoring.js",
  `export function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Number(value) || 0));
}

export function sizeScore(app) {
  const currentRank = Number(app.currentRank || 999);
  if (app.isCategoryLeader || currentRank <= 15) return -22;
  if (currentRank >= 20 && currentRank <= 150) return 18;
  if (currentRank > 150 && currentRank <= 300) return 8;
  return 0;
}

export function scoreApp(app) {
  const rank = clamp(app.rankDelta4w, 0, 120) / 120;
  const reviews = clamp(app.reviewDelta4w, 0, 180) / 180;
  const social = clamp(app.socialDelta4w, 0, 240) / 240;
  const pain = clamp((app.reviewThemes || []).length * 18 + (app.featureRequests || []).length * 12, 0, 100) / 100;
  const rating = clamp(((Number(app.rating) || 0) - 3.5) * 35, 0, 55) / 100;
  const confidence = clamp(Number(app.growthHypothesis?.confidence ?? 0.5) * 100, 20, 100) / 100;
  const score = (rank * 0.34 + reviews * 0.23 + social * 0.22 + pain * 0.12 + rating * 0.04 + confidence * 0.05) * 100 + sizeScore(app);
  return Math.round(clamp(score, 0, 100));
}

export function rankApps(apps) {
  return apps
    .map((app) => ({ ...app, opportunityScore: scoreApp(app) }))
    .sort((a, b) => b.opportunityScore - a.opportunityScore);
}
`,
);

write(
  "src/summary.js",
  `export function buildSummary(apps) {
  const rows = Array.isArray(apps) ? apps : [];
  const byCategory = new Map();
  let totalFeatureRequests = 0;
  for (const app of rows) {
    byCategory.set(app.category, (byCategory.get(app.category) || 0) + 1);
    totalFeatureRequests += Array.isArray(app.featureRequests) ? app.featureRequests.length : 0;
  }
  const topCategory = [...byCategory.entries()].sort((a, b) => b[1] - a[1])[0] || ["n/a", 0];
  const fastestMover = rows.slice().sort((a, b) => Number(b.rankDelta4w || 0) - Number(a.rankDelta4w || 0))[0] || null;
  const emerging = rows.filter((app) => !app.isCategoryLeader && Number(app.currentRank || 999) > 15).length;
  const liveScraped = rows.filter((app) => app.growthHypothesis?.liveScraped).length;
  return {
    trackedApps: rows.length,
    emergingApps: emerging,
    liveScrapedApps: liveScraped,
    topCategory: { name: topCategory[0], count: topCategory[1] },
    fastestMover: fastestMover ? { name: fastestMover.name, rankDelta4w: fastestMover.rankDelta4w } : null,
    totalFeatureRequests,
    sourceStatus: [
      { name: "Apple App Store RSS", status: "adapter-ready", detail: "Review adapter exists; visible samples are fixture-backed unless a live run replaces them." },
      { name: "Apify TikTok/Instagram", status: process.env.APIFY_TOKEN && !process.env.APIFY_TOKEN.includes("{{") ? "token-present-not-run" : "needs-token", detail: "Growth hypotheses disclose whether content was actually scraped." },
      { name: "Emerging app filter", status: "active", detail: "Default ranking penalizes category leaders and favors rank 20-150 movers." }
    ]
  };
}
`,
);

write(
  "src/repository.js",
  `import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const dbPath = resolve(".data/apps.json");

export function saveApps(apps) {
  mkdirSync(dirname(dbPath), { recursive: true });
  writeFileSync(dbPath, JSON.stringify(apps, null, 2) + "\\n");
}

export function loadApps() {
  if (!existsSync(dbPath)) return [];
  return JSON.parse(readFileSync(dbPath, "utf8"));
}
`,
);

write(
  "src/ingest.js",
  `import { readFileSync } from "node:fs";
import { rankApps } from "./scoring.js";
import { loadApps, saveApps } from "./repository.js";

const allowedModes = new Set(["fixture", "live-smoke"]);

function slug(value) {
  return String(value || "app").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 64);
}

export function loadFixtureApps() {
  try {
    return JSON.parse(readFileSync(new URL("../fixtures/apps.json", import.meta.url), "utf8"));
  } catch (error) {
    throw new Error("Fixture apps unavailable: " + (error instanceof Error ? error.message : String(error)));
  }
}

function withRunMode(app, mode) {
  const liveScraped = false;
  return {
    ...app,
    dataMode: mode,
    growthHypothesis: {
      ...(app.growthHypothesis || {}),
      liveScraped,
      sourceMode: mode,
      basis: liveScraped
        ? "Live social and review adapters populated this hypothesis."
        : "Fixture-backed hypothesis. No live Apify social scrape was completed in this run.",
      confidence: liveScraped ? 0.82 : Number(app.growthHypothesis?.confidence || 0.58),
    },
  };
}

function persistRanked(apps, mode) {
  const ranked = rankApps(apps.map((app) => withRunMode(app, mode))).map((app, index) => ({
    ...app,
    radarRank: index + 1,
  }));
  saveApps(ranked);
  return ranked;
}

export async function refreshApps({ mode = "fixture" } = {}) {
  if (!allowedModes.has(mode)) throw new Error("Unsupported refresh mode: " + mode);
  return persistRanked(loadFixtureApps(), mode);
}

export async function addCustomApp(input = {}) {
  const existing = loadApps().length ? loadApps() : await refreshApps({ mode: "fixture" });
  const name = String(input.name || "").trim();
  if (!name) throw new Error("App name is required");
  const category = String(input.category || "Productivity").trim() || "Productivity";
  const id = slug(input.id || name);
  const seed = {
    id,
    name,
    category,
    country: "US",
    appStoreId: String(input.appStoreId || id),
    currentRank: Number(input.currentRank || 140),
    isCategoryLeader: false,
    categoryLeader: false,
    sizeBand: "manual-seed",
    rankDelta4w: Number(input.rankDelta4w || 18),
    reviewDelta4w: Number(input.reviewDelta4w || 12),
    rating: Number(input.rating || 4.5),
    socialDelta4w: Number(input.socialDelta4w || 20),
    socialStrategy: ["Manual seed awaiting live social scrape"],
    reviewThemes: ["Research target added manually"],
    featureRequests: ["Run live review scrape", "Find TikTok and Instagram content examples"],
    evidence: ["Manual seed from Add app form"],
    weeklySnapshots: [
      { week: "4w ago", rank: 158, reviewCount: 90, socialMentions: 45 },
      { week: "3w ago", rank: 153, reviewCount: 95, socialMentions: 50 },
      { week: "2w ago", rank: 148, reviewCount: 99, socialMentions: 57 },
      { week: "1w ago", rank: 143, reviewCount: 103, socialMentions: 62 },
      { week: "current", rank: Number(input.currentRank || 140), reviewCount: 108, socialMentions: 69 },
    ],
    investigationAngles: [
      "Validate App Store rank movement before treating this as a true opportunity.",
      "Run Apify search for TikTok and Instagram posts that mention this app.",
      "Scrape recent App Store reviews and replace the manual placeholder pain points.",
    ],
    growthHypothesis: {
      text: "Manual research seed; no growth claim yet.",
      confidence: 0.25,
      basis: "Added manually. No live Apify or App Store scrape has run for this seed.",
      liveScraped: false,
      sourceMode: "manual-seed",
    },
    reviewSamples: [
      { rating: 0, title: "Manual seed", body: "Run review ingestion to populate real customer feedback.", source: "manual-placeholder" },
    ],
    exampleContent: [
      { platform: "TikTok", creator: "pending", format: "pending scrape", hook: "Search needed", caption: "Run Apify to find example content.", engagement: 0, source: "manual-placeholder", verifiedLiveScrape: false },
    ],
    dataSources: [
      { name: "Manual seed", status: "active", note: "Added through the dashboard form." },
      { name: "Apify TikTok/Instagram", status: "not-run", note: "Use live refresh once actors are tuned." },
    ],
  };
  const withoutDuplicate = existing.filter((app) => app.id !== id);
  const ranked = persistRanked([...withoutDuplicate, seed], "manual-seed");
  return ranked.find((app) => app.id === id);
}

if (process.argv[1] && process.argv[1].endsWith("ingest.js")) {
  const apps = await refreshApps({ mode: process.argv.includes("--live") ? "live-smoke" : "fixture" });
  console.log(JSON.stringify({ ok: true, apps: apps.length }, null, 2));
}
`,
);

write(
  "src/server.js",
  `import { createServer } from "node:http";
import { existsSync, createReadStream } from "node:fs";
import { extname, join, resolve } from "node:path";
import { loadApps } from "./repository.js";
import { addCustomApp, refreshApps } from "./ingest.js";
import { buildSummary } from "./summary.js";

const publicDir = resolve("public");
const port = Number(process.env.PORT || 4317);
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };
const jsonHeaders = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };

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
  const file = pathname === "/" ? join(publicDir, "index.html") : join(publicDir, pathname);
  if (!file.startsWith(publicDir) || !existsSync(file)) return false;
  res.writeHead(200, { "Content-Type": types[extname(file)] || "application/octet-stream" });
  createReadStream(file).pipe(res);
  return true;
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  try {
    if (req.method === "OPTIONS") return sendJson(res, 204, {});
    if (url.pathname === "/health") return sendJson(res, 200, { ok: true });
    if (url.pathname === "/api/summary" && req.method === "GET") return sendJson(res, 200, buildSummary(loadApps()));
    if (url.pathname === "/api/apps" && req.method === "GET") return sendJson(res, 200, { apps: loadApps() });
    if (url.pathname === "/api/apps" && req.method === "POST") return sendJson(res, 201, { ok: true, app: await addCustomApp(await readJson(req)) });
    if (url.pathname.startsWith("/api/apps/") && req.method === "GET") {
      const id = decodeURIComponent(url.pathname.split("/").pop());
      const app = loadApps().find((item) => item.id === id);
      return app ? sendJson(res, 200, { app }) : sendJson(res, 404, { error: "not_found" });
    }
    if (url.pathname === "/api/refresh" && req.method === "POST") {
      const apps = await refreshApps({ mode: url.searchParams.get("mode") || "fixture" });
      return sendJson(res, 200, { ok: true, apps });
    }
    if (serveStatic(req, res)) return;
    sendJson(res, 404, { error: "not_found" });
  } catch (error) {
    sendJson(res, 500, { error: error instanceof Error ? error.message : String(error) });
  }
});

await refreshApps({ mode: "fixture" });
server.listen(port, () => console.log("Consumer App Radar listening on :" + port));
`,
);

write(
  "public/index.html",
  `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Consumer App Radar</title>
    <link rel="stylesheet" href="/styles.css" />
  </head>
  <body>
    <main>
      <header class="topbar">
        <div>
          <p class="eyebrow">Consumer app factory intelligence</p>
          <h1>Consumer App Radar</h1>
          <p>Find emerging iPhone apps with accelerating growth, inspect the evidence quality, and collect product gaps worth building.</p>
        </div>
        <div class="refresh-controls">
          <select id="refresh-mode" aria-label="Refresh mode">
            <option value="fixture">Fixture refresh</option>
            <option value="live-smoke">Live smoke refresh</option>
          </select>
          <button id="refresh" type="button">Refresh data</button>
        </div>
      </header>

      <section id="summary" class="kpi-grid" aria-label="Radar summary"></section>

      <section class="toolbar" aria-label="Radar controls">
        <label>
          Search
          <input id="search" type="search" placeholder="App, category, request, strategy" />
        </label>
        <label>
          Category
          <select id="category"><option value="all">All categories</option></select>
        </label>
        <label>
          Sort
          <select id="sort">
            <option value="opportunityScore">Opportunity score</option>
            <option value="rankDelta4w">Rank velocity</option>
            <option value="reviewDelta4w">Review growth</option>
            <option value="socialDelta4w">Social growth</option>
            <option value="currentRank">Emerging rank</option>
          </select>
        </label>
        <label class="checkbox-label">
          <input id="hide-leaders" type="checkbox" checked />
          Hide category leaders
        </label>
      </section>

      <section class="add-panel panel" aria-label="Add app research seed">
        <form id="add-app-form" class="add-app-form">
          <label>App name <input name="name" required placeholder="Jomo, Roots, Clearspace" /></label>
          <label>Category <input name="category" placeholder="Productivity" /></label>
          <label>App Store ID <input name="appStoreId" placeholder="optional" /></label>
          <button type="submit">Add app</button>
        </form>
      </section>

      <section class="layout">
        <div class="panel">
          <div class="section-head">
            <div>
              <h2>Growth Signals</h2>
              <p id="result-count"></p>
            </div>
          </div>
          <div class="app-table" id="apps" role="list"></div>
        </div>
        <aside class="detail" aria-live="polite">
          <div class="panel">
            <h2>Opportunity Brief</h2>
            <div id="detail"></div>
          </div>
          <div class="panel">
            <h2>Source Status</h2>
            <div id="source-status" class="source-list"></div>
          </div>
        </aside>
      </section>
    </main>
    <script type="module" src="/app.js"></script>
  </body>
</html>
`,
);

write(
  "public/app.js",
  `let apps = [];
let summary = null;
let selectedId = null;
const state = { search: "", category: "all", sort: "opportunityScore", hideLeaders: true };

const elements = {
  summary: document.querySelector("#summary"),
  apps: document.querySelector("#apps"),
  detail: document.querySelector("#detail"),
  sourceStatus: document.querySelector("#source-status"),
  search: document.querySelector("#search"),
  category: document.querySelector("#category"),
  sort: document.querySelector("#sort"),
  hideLeaders: document.querySelector("#hide-leaders"),
  resultCount: document.querySelector("#result-count"),
  refresh: document.querySelector("#refresh"),
  refreshMode: document.querySelector("#refresh-mode"),
  addAppForm: document.querySelector("#add-app-form"),
};

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}

function list(items) {
  return "<ul>" + (items || []).map((item) => "<li>" + escapeHtml(item) + "</li>").join("") + "</ul>";
}

function metric(value, label) {
  return '<div class="metric">+' + escapeHtml(value) + "<span>" + escapeHtml(label) + "</span></div>";
}

function renderSummary() {
  if (!summary) return;
  const fastest = summary.fastestMover ? summary.fastestMover.name + " +" + summary.fastestMover.rankDelta4w : "n/a";
  elements.summary.innerHTML = [
    ["Tracked apps", summary.trackedApps],
    ["Emerging apps", summary.emergingApps],
    ["Live scraped", summary.liveScrapedApps],
    ["Fastest rank move", fastest],
    ["Feature requests", summary.totalFeatureRequests],
  ].map(([label, value]) => '<article class="kpi"><span>' + escapeHtml(label) + "</span><strong>" + escapeHtml(value) + "</strong></article>").join("");
}

function renderSourceStatus() {
  const sources = summary?.sourceStatus || [];
  elements.sourceStatus.innerHTML = sources.map((source) => '<article class="source-item"><strong>' + escapeHtml(source.name) + "</strong><span>" + escapeHtml(source.detail) + '</span><div class="status">' + escapeHtml(source.status) + "</div></article>").join("");
}

function renderCategories() {
  const selected = elements.category.value || state.category;
  const categories = [...new Set(apps.map((app) => app.category))].sort();
  elements.category.innerHTML = '<option value="all">All categories</option>' + categories.map((category) => '<option value="' + escapeHtml(category) + '">' + escapeHtml(category) + "</option>").join("");
  elements.category.value = categories.includes(selected) ? selected : "all";
  state.category = elements.category.value;
}

function filteredApps() {
  const query = state.search.trim().toLowerCase();
  return apps
    .filter((app) => state.category === "all" || app.category === state.category)
    .filter((app) => !state.hideLeaders || !app.categoryLeader)
    .filter((app) => {
      if (!query) return true;
      const haystack = [app.name, app.category, app.sizeBand, ...(app.socialStrategy || []), ...(app.reviewThemes || []), ...(app.featureRequests || [])].join(" ").toLowerCase();
      return haystack.includes(query);
    })
    .sort((a, b) => state.sort === "currentRank" ? Number(a.currentRank || 999) - Number(b.currentRank || 999) : Number(b[state.sort] || 0) - Number(a[state.sort] || 0));
}

function renderApps() {
  const rows = filteredApps();
  elements.resultCount.textContent = rows.length + " opportunities";
  if (!rows.length) {
    elements.apps.innerHTML = '<div class="empty">No apps match these filters.</div>';
    renderDetail(null);
    return;
  }
  if (!selectedId || !rows.some((app) => app.id === selectedId)) selectedId = rows[0].id;
  elements.apps.innerHTML = rows.map((app) =>
    '<article class="app-row" role="listitem" tabindex="0" data-id="' + escapeHtml(app.id) + '" aria-selected="' + String(app.id === selectedId) + '">' +
    '<div class="score">' + escapeHtml(app.opportunityScore) + "</div>" +
    '<div><div class="name">' + escapeHtml(app.radarRank + ". " + app.name) + '</div><div class="meta">' + escapeHtml(app.category + " / rank #" + app.currentRank + " / " + app.sizeBand) + "</div></div>" +
    '<div class="strategy-preview">' + escapeHtml(app.growthHypothesis?.text || "Growth hypothesis pending") + '<div class="signal-label growth-hypothesis">' + escapeHtml(app.growthHypothesis?.basis || "No source basis") + "</div></div>" +
    metric(app.rankDelta4w, "rank 4w") + metric(app.reviewDelta4w, "reviews 4w") + metric(app.socialDelta4w, "social 4w") +
    "</article>").join("");
  for (const row of document.querySelectorAll(".app-row")) {
    const choose = () => {
      selectedId = row.dataset.id;
      renderApps();
      renderDetail(apps.find((app) => app.id === selectedId));
    };
    row.addEventListener("click", choose);
    row.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        choose();
      }
    });
  }
  renderDetail(apps.find((app) => app.id === selectedId));
}

function renderTimeline(app) {
  const snapshots = app.weeklySnapshots || [];
  const maxMentions = Math.max(...snapshots.map((row) => Number(row.socialMentions || 0)), 1);
  return '<div class="timeline">' + snapshots.map((row) => {
    const width = Math.max(8, Math.round((Number(row.socialMentions || 0) / maxMentions) * 100));
    return '<div class="timeline-row"><span>' + escapeHtml(row.week) + '</span><div class="bar"><span style="width:' + width + '%"></span></div><strong>#' + escapeHtml(row.rank) + "</strong></div>";
  }).join("") + "</div>";
}

function renderReviewSamples(app) {
  return '<div class="review-list">' + (app.reviewSamples || []).map((review) =>
    '<article class="review-card"><div><strong>' + escapeHtml(review.title) + '</strong><span>' + escapeHtml(review.source) + " / " + escapeHtml(review.rating || "n/a") + '</span></div><p>' + escapeHtml(review.body) + "</p></article>"
  ).join("") + "</div>";
}

function renderExampleContent(app) {
  return '<div class="content-list">' + (app.exampleContent || []).map((item) =>
    '<article class="content-card"><strong>' + escapeHtml(item.platform + " / " + item.format) + '</strong><p>' + escapeHtml(item.hook) + '</p><span>' + escapeHtml(item.source) + (item.verifiedLiveScrape ? " / live scrape" : " / fixture example") + "</span></article>"
  ).join("") + "</div>";
}

function renderDetail(app) {
  if (!app) {
    elements.detail.innerHTML = "<p>Select an app to inspect.</p>";
    return;
  }
  elements.detail.innerHTML =
    "<h3>" + escapeHtml(app.name) + "</h3>" +
    "<p>" + escapeHtml(app.category + " / rating " + app.rating + " / App Store ID " + app.appStoreId) + "</p>" +
    '<div class="chips"><span class="chip">rank #' + escapeHtml(app.currentRank) + '</span><span class="chip">not leader ' + escapeHtml(!app.categoryLeader) + '</span><span class="chip">confidence ' + escapeHtml(Math.round((app.growthHypothesis?.confidence || 0) * 100)) + '%</span><span class="chip">live scraped ' + escapeHtml(Boolean(app.growthHypothesis?.liveScraped)) + "</span></div>" +
    '<section class="brief-section evidence-callout"><h4>Growth Hypothesis</h4><p>' + escapeHtml(app.growthHypothesis?.text || "") + '</p><p class="muted">' + escapeHtml(app.growthHypothesis?.basis || "") + "</p></section>" +
    renderTimeline(app) +
    '<div class="opportunity-grid">' +
    '<section class="brief-section"><h4>Example Content</h4>' + renderExampleContent(app) + "</section>" +
    '<section class="brief-section"><h4>Visible Reviews</h4>' + renderReviewSamples(app) + "</section>" +
    '<section class="brief-section"><h4>Social Strategy</h4>' + list(app.socialStrategy) + "</section>" +
    '<section class="brief-section"><h4>Review Pain</h4>' + list(app.reviewThemes) + "</section>" +
    '<section class="brief-section"><h4>Feature Requests</h4>' + list(app.featureRequests) + "</section>" +
    '<section class="brief-section"><h4>Investigation Angles</h4>' + list(app.investigationAngles) + "</section>" +
    '<section class="brief-section"><h4>Evidence</h4>' + list(app.evidence) + "</section>" +
    "</div>";
}

async function loadApps() {
  const [appsResponse, summaryResponse] = await Promise.all([fetch("/api/apps"), fetch("/api/summary")]);
  const appsPayload = await appsResponse.json();
  summary = await summaryResponse.json();
  apps = appsPayload.apps || [];
  renderSummary();
  renderSourceStatus();
  renderCategories();
  renderApps();
}

elements.search.addEventListener("input", () => {
  state.search = elements.search.value;
  renderApps();
});
elements.category.addEventListener("change", () => {
  state.category = elements.category.value;
  renderApps();
});
elements.sort.addEventListener("change", () => {
  state.sort = elements.sort.value;
  renderApps();
});
elements.hideLeaders.addEventListener("change", () => {
  state.hideLeaders = elements.hideLeaders.checked;
  renderApps();
});
elements.refresh.addEventListener("click", async () => {
  elements.refresh.disabled = true;
  try {
    await fetch("/api/refresh?mode=" + encodeURIComponent(elements.refreshMode.value), { method: "POST" });
    await loadApps();
  } finally {
    elements.refresh.disabled = false;
  }
});
elements.addAppForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(elements.addAppForm).entries());
  const response = await fetch("/api/apps", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  const result = await response.json();
  selectedId = result.app?.id || selectedId;
  elements.addAppForm.reset();
  await loadApps();
});

await loadApps();
`,
);

write(
  "public/styles.css",
  `:root {
  color-scheme: light;
  --ink: #182026;
  --muted: #61717d;
  --line: #d9e1e7;
  --panel: #ffffff;
  --bg: #f5f7f8;
  --accent: #0f766e;
  --accent-soft: #e6f4f1;
  --warn: #9a5b12;
  --blue: #315f8a;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  color: var(--ink);
  background: var(--bg);
}
main { max-width: 1420px; margin: 0 auto; padding: 24px; }
h1, h2, h3, p { margin: 0; }
h1 { font-size: 30px; line-height: 1.1; letter-spacing: 0; }
h2 { font-size: 15px; line-height: 1.2; }
h3 { font-size: 22px; line-height: 1.15; }
p, label { color: var(--muted); }
button, input, select { font: inherit; }
button {
  border: 1px solid var(--ink);
  background: var(--ink);
  color: white;
  border-radius: 6px;
  padding: 10px 12px;
  font-weight: 700;
  cursor: pointer;
}
.topbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 18px;
}
.topbar p { max-width: 820px; margin-top: 6px; }
.refresh-controls { display: flex; gap: 8px; align-items: center; }
.eyebrow {
  color: var(--accent);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: .08em;
  margin-bottom: 6px;
  text-transform: uppercase;
}
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 12px;
}
.kpi, .panel {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 8px;
}
.kpi { padding: 14px; min-height: 88px; }
.kpi span {
  display: block;
  color: var(--muted);
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 8px;
  text-transform: uppercase;
}
.kpi strong { display: block; font-size: 24px; line-height: 1.05; }
.toolbar {
  display: grid;
  grid-template-columns: minmax(260px, 1fr) 200px 190px 180px;
  gap: 10px;
  align-items: end;
  margin-bottom: 14px;
}
.toolbar label, .add-app-form label {
  display: grid;
  gap: 5px;
  font-size: 12px;
  font-weight: 750;
  text-transform: uppercase;
}
.checkbox-label { grid-template-columns: 18px 1fr; align-items: center; min-height: 42px; }
.checkbox-label input { min-height: auto; }
input, select {
  width: 100%;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: white;
  color: var(--ink);
  min-height: 42px;
  padding: 9px 10px;
}
.add-panel { padding: 12px; margin-bottom: 14px; }
.add-app-form {
  display: grid;
  grid-template-columns: minmax(180px, 1fr) 180px 180px auto;
  gap: 10px;
  align-items: end;
}
.layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(380px, 470px);
  gap: 14px;
  align-items: start;
}
.panel { padding: 16px; }
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.app-table {
  display: grid;
  border: 1px solid var(--line);
  border-radius: 8px;
  overflow: hidden;
}
.app-row {
  display: grid;
  grid-template-columns: 72px minmax(170px, 1.1fr) minmax(260px, 1fr) 110px 110px 110px;
  gap: 12px;
  align-items: center;
  min-height: 88px;
  padding: 12px;
  border-bottom: 1px solid var(--line);
  background: white;
  cursor: pointer;
}
.app-row:last-child { border-bottom: 0; }
.app-row[aria-selected="true"] {
  background: #f0f7f5;
  box-shadow: inset 3px 0 0 var(--accent);
}
.score {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: var(--accent-soft);
  color: var(--accent);
  font-weight: 850;
}
.name { font-weight: 800; }
.meta, .signal-label, .muted {
  color: var(--muted);
  font-size: 13px;
  margin-top: 4px;
}
.strategy-preview { color: var(--ink); font-size: 13px; line-height: 1.35; }
.metric { text-align: right; font-weight: 800; }
.metric span {
  display: block;
  color: var(--muted);
  font-size: 12px;
  font-weight: 650;
  margin-top: 3px;
}
.detail {
  display: grid;
  gap: 14px;
  position: sticky;
  top: 14px;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 12px 0;
}
.chip {
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 5px 8px;
  font-size: 12px;
  color: var(--muted);
  background: white;
}
.opportunity-grid { display: grid; gap: 14px; margin-top: 16px; }
.brief-section h4 {
  margin: 0 0 8px;
  font-size: 12px;
  text-transform: uppercase;
  color: var(--muted);
}
.brief-section ul { margin: 0; padding-left: 18px; }
.brief-section li { margin: 7px 0; line-height: 1.35; }
.evidence-callout {
  border: 1px solid var(--line);
  background: #fbfcfd;
  border-radius: 8px;
  padding: 10px;
  margin-top: 12px;
}
.timeline { display: grid; gap: 7px; margin-top: 10px; }
.timeline-row {
  display: grid;
  grid-template-columns: 72px 1fr 48px;
  gap: 8px;
  align-items: center;
  color: var(--muted);
  font-size: 12px;
}
.bar {
  height: 8px;
  border-radius: 999px;
  background: #e8edf0;
  overflow: hidden;
}
.bar span { display: block; height: 100%; background: var(--blue); }
.source-list, .review-list, .content-list { display: grid; gap: 9px; }
.source-item, .review-card, .content-card {
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 10px;
}
.source-item strong, .review-card strong, .content-card strong { display: block; font-size: 13px; }
.source-item span, .review-card span, .content-card span { color: var(--muted); font-size: 12px; }
.review-card p, .content-card p { margin-top: 6px; color: var(--ink); font-size: 13px; line-height: 1.4; }
.status {
  display: inline-block;
  margin-top: 8px;
  color: var(--accent);
  font-size: 12px;
  font-weight: 800;
}
.empty { padding: 22px; color: var(--muted); }
@media (max-width: 1120px) {
  .kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .toolbar, .add-app-form, .layout { grid-template-columns: 1fr; }
  .detail { position: static; }
  .app-row { grid-template-columns: 56px 1fr; }
  .strategy-preview, .metric { grid-column: 2; text-align: left; }
}
`,
);

write(
  "tests/feedback-surface.test.js",
  `import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { refreshApps, addCustomApp } from "../src/ingest.js";
import { rankApps } from "../src/scoring.js";

test("fixture data is explicit about non-live growth evidence", async () => {
  const apps = await refreshApps({ mode: "fixture" });
  const first = apps[0];
  assert.equal(first.growthHypothesis.liveScraped, false);
  assert.match(first.growthHypothesis.basis, /fixture/i);
  assert.ok(first.growthHypothesis.confidence <= 0.65);
  assert.ok(first.reviewSamples.length >= 2);
  assert.ok(first.exampleContent.length >= 2);
});

test("ranking prefers emerging fast growers over category leaders", () => {
  const ranked = rankApps([
    { id: "leader", rankDelta4w: 70, reviewDelta4w: 120, socialDelta4w: 200, currentRank: 2, isCategoryLeader: true, rating: 4.9 },
    { id: "emerging", rankDelta4w: 55, reviewDelta4w: 92, socialDelta4w: 150, currentRank: 64, isCategoryLeader: false, rating: 4.6 },
  ]);
  assert.equal(ranked[0].id, "emerging");
});

test("custom app addition creates a ranked research seed", async () => {
  await refreshApps({ mode: "fixture" });
  const app = await addCustomApp({ name: "Test Focus App", category: "Productivity", appStoreId: "test-focus-app" });
  assert.equal(app.name, "Test Focus App");
  assert.equal(app.dataMode, "manual-seed");
  assert.ok(app.reviewSamples.length >= 1);
  assert.ok(app.exampleContent.length >= 1);
  assert.ok(app.radarRank >= 1);
});

test("frontend surfaces feedback-driven controls and evidence panels", () => {
  const html = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
  const client = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  for (const marker of ["refresh-mode", "add-app-form", "growth-hypothesis", "reviewSamples", "exampleContent", "categoryLeader"]) {
    assert.ok(html.includes(marker) || client.includes(marker), \`missing frontend marker \${marker}\`);
  }
});
`,
);

const feedback = readFileSync(feedbackPath, "utf8");
rootWrite(
  ".workflow/app-feedback/consumer-radar-enhancement.json",
  JSON.stringify(
    {
      ok: true,
      app_dir: appDir,
      feedback_path: feedbackPath,
      feedback_items: feedback.split("\n").filter((line) => line.trim().startsWith("-")).length,
      implemented: [
        "explicit non-live growth hypothesis evidence",
        "visible review samples",
        "emerging-app ranking penalty for category leaders",
        "visible example content",
        "add-app form and POST /api/apps",
      ],
    },
    null,
    2,
  ),
);

console.log(JSON.stringify({ ok: true, app_dir: appDir }, null, 2));
