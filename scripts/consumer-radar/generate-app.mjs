#!/usr/bin/env node
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error("Missing value for " + name);
  return value;
}

const requestedAppDir = argValue("--app-dir", "apps/generated-consumer-app-radar");
const appDir = resolve(requestedAppDir);
rmSync(appDir, { recursive: true, force: true });

function write(relativePath, lines) {
  const fullPath = resolve(appDir, relativePath);
  mkdirSync(dirname(fullPath), { recursive: true });
  const content = Array.isArray(lines) ? lines.join("\n") + "\n" : String(lines);
  writeFileSync(fullPath, content.endsWith("\n") ? content : content + "\n");
}

const fixtureApps = [
  {
    id: "one-sec",
    name: "one sec",
    category: "Productivity",
    country: "US",
    appStoreId: "1532875441",
    rankDelta4w: 76,
    reviewDelta4w: 138,
    rating: 4.8,
    socialDelta4w: 212,
    socialStrategy: ["Creator demos interrupting app-open autopilot", "Short before-after clips", "Academic credibility hooks"],
    reviewThemes: ["Needs better schedule exceptions", "Users want stronger family controls", "More granular app groups requested"],
    featureRequests: ["Calendar-aware focus rules", "Shared household accountability", "Weekly relapse insights"],
    evidence: ["Fixture seed until live Apify ranking feed is tuned", "Apple RSS reviews supported by adapter"]
  },
  {
    id: "opal",
    name: "Opal",
    category: "Screen Time",
    country: "US",
    appStoreId: "1497465230",
    rankDelta4w: 42,
    reviewDelta4w: 89,
    rating: 4.7,
    socialDelta4w: 156,
    socialStrategy: ["Founder-led productivity clips", "Relatable addiction framing", "Creator routines"],
    reviewThemes: ["Lock bypass confusion", "Subscription objections", "More reporting exports"],
    featureRequests: ["Anti-bypass education", "Cheaper student plan", "CSV/report export"],
    evidence: ["Fixture seed; social adapters support Apify enrichment"]
  },
  {
    id: "stoic",
    name: "stoic.",
    category: "Wellness",
    country: "US",
    appStoreId: "1312926037",
    rankDelta4w: 31,
    reviewDelta4w: 64,
    rating: 4.8,
    socialDelta4w: 92,
    socialStrategy: ["Calm aesthetic reels", "Journaling prompts", "Mental model education"],
    reviewThemes: ["Users want gentler onboarding", "Export/sync concerns", "Prompt repetition"],
    featureRequests: ["Adaptive prompts", "Better Apple Health context", "Private export"],
    evidence: ["Fixture seed for repeatable CI"]
  },
  {
    id: "screenzen",
    name: "ScreenZen",
    category: "Screen Time",
    country: "US",
    appStoreId: "1541027222",
    rankDelta4w: 58,
    reviewDelta4w: 73,
    rating: 4.8,
    socialDelta4w: 118,
    socialStrategy: ["Reddit-style authenticity", "Anti-subscription positioning", "Direct comparisons to expensive blockers"],
    reviewThemes: ["Users praise free controls", "Setup friction appears repeatedly", "Requests for more lockout nuance"],
    featureRequests: ["Preset lockout templates", "Onboarding checklist", "Cross-device shared rules"],
    evidence: ["Seed target for live chart/review enrichment"]
  },
  {
    id: "structured",
    name: "Structured",
    category: "Productivity",
    country: "US",
    appStoreId: "1499198946",
    rankDelta4w: 36,
    reviewDelta4w: 82,
    rating: 4.8,
    socialDelta4w: 134,
    socialStrategy: ["ADHD creator routines", "Calendar before-after clips", "Aesthetic planning screenshots"],
    reviewThemes: ["Sync reliability matters", "Users want faster capture", "Recurring task UX is a purchase driver"],
    featureRequests: ["Natural-language task capture", "More robust calendar sync", "Better widgets"],
    evidence: ["Seed target for productivity category monitoring"]
  },
  {
    id: "finch",
    name: "Finch",
    category: "Positivity",
    country: "US",
    appStoreId: "1528595748",
    rankDelta4w: 29,
    reviewDelta4w: 151,
    rating: 4.9,
    socialDelta4w: 177,
    socialStrategy: ["Character-led UGC", "Mental health community clips", "Gift/share loops"],
    reviewThemes: ["Emotional attachment is strong", "Users want more personalization", "Subscription boundaries are sensitive"],
    featureRequests: ["Adaptive self-care journeys", "More low-cost social gifting", "Smarter mood insights"],
    evidence: ["Seed target for positivity/wellness benchmarking"]
  },
  {
    id: "rise",
    name: "Rise",
    category: "Health",
    country: "US",
    appStoreId: "1453884781",
    rankDelta4w: 24,
    reviewDelta4w: 57,
    rating: 4.6,
    socialDelta4w: 102,
    socialStrategy: ["Sleep debt education", "Science-backed creator explainers", "Routine optimization hooks"],
    reviewThemes: ["Accuracy questions", "Paywall complaints", "Users want wearable context"],
    featureRequests: ["Clearer accuracy explanations", "Better Apple Health summaries", "Actionable weekly plan"],
    evidence: ["Seed target for health/wellness category monitoring"]
  },
  {
    id: "ladder",
    name: "Ladder",
    category: "Fitness",
    country: "US",
    appStoreId: "1502936453",
    rankDelta4w: 51,
    reviewDelta4w: 68,
    rating: 4.9,
    socialDelta4w: 189,
    socialStrategy: ["Trainer-led short clips", "Transformation proof", "Community/accountability framing"],
    reviewThemes: ["Program switching requests", "Equipment substitutions", "More beginner guidance"],
    featureRequests: ["Adaptive equipment swaps", "Beginner ramp plans", "Progress story exports"],
    evidence: ["Seed target for fitness category monitoring"]
  }
];

function weeklySnapshots(app) {
  const finalRank = Math.max(2, 140 - app.rankDelta4w);
  return [4, 3, 2, 1, 0].map((weeksAgo) => ({
    week: weeksAgo === 0 ? "current" : `${weeksAgo}w ago`,
    rank: finalRank + Math.round((weeksAgo * app.rankDelta4w) / 4),
    reviewCount: Math.max(50, 900 + app.reviewDelta4w - Math.round((weeksAgo * app.reviewDelta4w) / 4)),
    socialMentions: Math.max(25, 500 + app.socialDelta4w - Math.round((weeksAgo * app.socialDelta4w) / 4))
  }));
}

const fixtureAppsWithSignals = fixtureApps.map((app) => ({
  ...app,
  weeklySnapshots: weeklySnapshots(app),
  investigationAngles: [
    `Validate whether ${app.name} is growing from creator-led distribution or store/category velocity.`,
    `Interview users complaining about ${app.reviewThemes[0].toLowerCase()} and test a sharper onboarding wedge.`,
    `Prototype ${app.featureRequests[0].toLowerCase()} as a differentiated feature.`
  ],
  dataSources: [
    { name: "Apple App Store RSS", status: "adapter-ready", note: "Reviews and search metadata can be refreshed when network egress allows it." },
    { name: "Apify TikTok/Instagram", status: "configured", note: "Actor IDs are configurable through environment variables." },
    { name: "Fixture seed", status: "active", note: "Deterministic seed keeps CI stable while live scrapers are tuned." }
  ]
}));

write("package.json", JSON.stringify({
  name: "generated-consumer-app-radar",
  private: true,
  type: "module",
  scripts: {
    start: "node src/server.js",
    dev: "node src/server.js",
    test: "node --test tests/*.test.js",
    typecheck: "node --check src/server.js && node --check src/summary.js && node --check src/scoring.js && node --check src/repository.js && node --check src/ingest.js && node --check src/snapshots.js && node --check src/evidence.js && node --check src/sources/apify.js && node --check src/sources/apple.js && node --check src/sources/social.js && node --check public/app.js",
    build: "node scripts/validate-artifacts.mjs"
  },
  dependencies: {},
  devDependencies: {}
}, null, 2));

write("fixtures/apps.json", JSON.stringify(fixtureAppsWithSignals, null, 2));

write("src/scoring.js", [
  "export function clamp(value, min = 0, max = 100) {",
  "  return Math.max(min, Math.min(max, Number(value) || 0));",
  "}",
  "",
  "export function scoreApp(app) {",
  "  const rank = clamp(app.rankDelta4w, 0, 120) / 120;",
  "  const reviews = clamp(app.reviewDelta4w, 0, 180) / 180;",
  "  const social = clamp(app.socialDelta4w, 0, 240) / 240;",
  "  const pain = clamp((app.reviewThemes || []).length * 18 + (app.featureRequests || []).length * 12, 0, 100) / 100;",
  "  const rating = clamp(((Number(app.rating) || 0) - 3.5) * 35, 0, 55) / 100;",
  "  const score = (rank * 0.34 + reviews * 0.23 + social * 0.24 + pain * 0.14 + rating * 0.05) * 100;",
  "  return Math.round(score);",
  "}",
  "",
  "export function rankApps(apps) {",
  "  return apps.map((app) => ({ ...app, opportunityScore: scoreApp(app) })).sort((a, b) => b.opportunityScore - a.opportunityScore);",
  "}"
]);

write("src/repository.js", [
  "import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';",
  "import { dirname, resolve } from 'node:path';",
  "",
  "const dbPath = resolve('.data/apps.json');",
  "",
  "export function saveApps(apps) {",
  "  mkdirSync(dirname(dbPath), { recursive: true });",
  "  writeFileSync(dbPath, JSON.stringify(apps, null, 2) + '\\n');",
  "}",
  "",
  "export function loadApps() {",
  "  if (!existsSync(dbPath)) return [];",
  "  return JSON.parse(readFileSync(dbPath, 'utf8'));",
  "}"
]);

write("src/summary.js", [
  "export function buildSummary(apps) {",
  "  const rows = Array.isArray(apps) ? apps : [];",
  "  const byCategory = new Map();",
  "  let totalFeatureRequests = 0;",
  "  for (const app of rows) {",
  "    byCategory.set(app.category, (byCategory.get(app.category) || 0) + 1);",
  "    totalFeatureRequests += Array.isArray(app.featureRequests) ? app.featureRequests.length : 0;",
  "  }",
  "  const topCategory = [...byCategory.entries()].sort((a, b) => b[1] - a[1])[0] || ['n/a', 0];",
  "  const fastestMover = rows.slice().sort((a, b) => Number(b.rankDelta4w || 0) - Number(a.rankDelta4w || 0))[0] || null;",
  "  const strongestSocial = rows.slice().sort((a, b) => Number(b.socialDelta4w || 0) - Number(a.socialDelta4w || 0))[0] || null;",
  "  return {",
  "    trackedApps: rows.length,",
  "    topCategory: { name: topCategory[0], count: topCategory[1] },",
  "    fastestMover: fastestMover ? { name: fastestMover.name, rankDelta4w: fastestMover.rankDelta4w } : null,",
  "    strongestSocial: strongestSocial ? { name: strongestSocial.name, socialDelta4w: strongestSocial.socialDelta4w } : null,",
  "    totalFeatureRequests,",
  "    sourceStatus: [",
  "      { name: 'Apple App Store RSS', status: 'adapter-ready', detail: 'Review and search adapters are included.' },",
  "      { name: 'Apify TikTok/Instagram', status: process.env.APIFY_TOKEN && !process.env.APIFY_TOKEN.includes('{{') ? 'token-present' : 'needs-token', detail: 'Social scraping runs through configurable Apify actors.' },",
  "      { name: 'Fixture seed', status: 'active', detail: 'Used for deterministic CI and demos.' }",
  "    ]",
  "  };",
  "}"
]);

write("src/sources/apple.js", [
  "export async function fetchAppleReviews(appStoreId, country = 'us', limit = 25) {",
  "  const url = 'https://itunes.apple.com/' + country + '/rss/customerreviews/id=' + encodeURIComponent(appStoreId) + '/sortBy=mostRecent/json';",
  "  const response = await fetch(url, { signal: AbortSignal.timeout(15000) });",
  "  if (!response.ok) throw new Error('Apple review RSS failed: ' + response.status);",
  "  const payload = await response.json();",
  "  const entries = Array.isArray(payload?.feed?.entry) ? payload.feed.entry.slice(1) : [];",
  "  return entries.slice(0, limit).map((entry) => ({",
  "    title: entry?.title?.label || '',",
  "    body: entry?.content?.label || '',",
  "    rating: Number(entry?.['im:rating']?.label || 0),",
  "    updated: entry?.updated?.label || null",
  "  }));",
  "}",
  "",
  "export async function searchAppleApps(term, country = 'US') {",
  "  const url = 'https://itunes.apple.com/search?entity=software&limit=10&country=' + encodeURIComponent(country) + '&term=' + encodeURIComponent(term);",
  "  const response = await fetch(url, { signal: AbortSignal.timeout(15000) });",
  "  if (!response.ok) throw new Error('Apple search failed: ' + response.status);",
  "  const payload = await response.json();",
  "  return payload.results || [];",
  "}"
]);

write("src/sources/apify.js", [
  "function actorPath(actorId) {",
  "  return String(actorId || '').replace('/', '~');",
  "}",
  "",
  "export async function runApifyActor(actorId, input, { token = process.env.APIFY_TOKEN, timeoutMs = 180000 } = {}) {",
  "  if (!token || token.includes('{{')) throw new Error('APIFY_TOKEN is not configured');",
  "  const start = await fetch('https://api.apify.com/v2/acts/' + actorPath(actorId) + '/runs?token=' + encodeURIComponent(token), {",
  "    method: 'POST',",
  "    headers: { 'Content-Type': 'application/json' },",
  "    body: JSON.stringify(input || {})",
  "  });",
  "  if (!start.ok) throw new Error('Apify actor start failed: ' + start.status);",
  "  const started = await start.json();",
  "  const runId = started?.data?.id;",
  "  const deadline = Date.now() + timeoutMs;",
  "  while (Date.now() < deadline) {",
  "    await new Promise((resolve) => setTimeout(resolve, 3500));",
  "    const status = await fetch('https://api.apify.com/v2/actor-runs/' + runId + '?token=' + encodeURIComponent(token));",
  "    const statusPayload = await status.json();",
  "    const state = statusPayload?.data?.status;",
  "    if (state === 'SUCCEEDED') {",
  "      const datasetId = statusPayload.data.defaultDatasetId;",
  "      const dataset = await fetch('https://api.apify.com/v2/datasets/' + datasetId + '/items?clean=true&format=json&token=' + encodeURIComponent(token));",
  "      if (!dataset.ok) throw new Error('Apify dataset fetch failed: ' + dataset.status);",
  "      return dataset.json();",
  "    }",
  "    if (['FAILED', 'ABORTED', 'TIMED-OUT'].includes(state)) throw new Error('Apify actor ended with status ' + state);",
  "  }",
  "  throw new Error('Apify actor timed out');",
  "}"
]);

write("src/sources/social.js", [
  "import { runApifyActor } from './apify.js';",
  "",
  "export async function fetchTikTokSignals(appName, { actorId = process.env.APIFY_TIKTOK_ACTOR || 'clockworks/tiktok-scraper' } = {}) {",
  "  const items = await runApifyActor(actorId, { searchTerms: [appName], maxItems: 20 });",
  "  return summarizeSocialItems(items, 'tiktok');",
  "}",
  "",
  "export async function fetchInstagramSignals(appName, { actorId = process.env.APIFY_INSTAGRAM_ACTOR || 'apify/instagram-scraper' } = {}) {",
  "  const items = await runApifyActor(actorId, { search: appName, resultsLimit: 20 });",
  "  return summarizeSocialItems(items, 'instagram');",
  "}",
  "",
  "export function summarizeSocialItems(items, platform) {",
  "  const posts = Array.isArray(items) ? items : [];",
  "  const engagements = posts.map((item) => Number(item.likes || item.likeCount || item.playCount || item.views || 0)).filter(Number.isFinite);",
  "  const totalEngagement = engagements.reduce((sum, value) => sum + value, 0);",
  "  return { platform, postCount: posts.length, totalEngagement, sampleCaptions: posts.slice(0, 5).map((item) => item.text || item.caption || item.description || '').filter(Boolean) };",
  "}"
]);

write("src/snapshots.js", [
  "export function computeWeeklyDeltas(snapshots) {",
  "  const rows = Array.isArray(snapshots) ? snapshots : [];",
  "  return rows.map((row, index) => {",
  "    const previous = rows[index - 1] || row;",
  "    return {",
  "      ...row,",
  "      rankDelta: Number(previous.rank || row.rank || 0) - Number(row.rank || previous.rank || 0),",
  "      reviewDelta: Number(row.reviewCount || 0) - Number(previous.reviewCount || 0),",
  "      socialDelta: Number(row.socialMentions || 0) - Number(previous.socialMentions || 0)",
  "    };",
  "  });",
  "}",
  "",
  "export function latestFourWeekVelocity(snapshots) {",
  "  const deltas = computeWeeklyDeltas(snapshots).slice(-4);",
  "  return deltas.reduce((sum, row) => sum + Math.max(0, row.rankDelta) + Math.max(0, row.reviewDelta) + Math.max(0, row.socialDelta), 0);",
  "}"
]);

write("src/evidence.js", [
  "const REQUEST_WORDS = ['wish', 'please add', 'need', 'missing', 'would love', 'feature'];",
  "",
  "export function extractReviewThemes(reviews) {",
  "  const text = (Array.isArray(reviews) ? reviews : []).map((review) => [review.title, review.body].filter(Boolean).join(' ')).join(' ').toLowerCase();",
  "  const themes = [];",
  "  if (/price|subscription|paywall|expensive/.test(text)) themes.push('Pricing and subscription sensitivity');",
  "  if (/sync|calendar|apple health|widget/.test(text)) themes.push('Ecosystem integration requests');",
  "  if (/confusing|setup|onboarding|hard/.test(text)) themes.push('Onboarding and setup friction');",
  "  if (/bug|crash|slow|reliable/.test(text)) themes.push('Reliability concerns');",
  "  return themes;",
  "}",
  "",
  "export function featureRequestsFromReviews(reviews) {",
  "  return (Array.isArray(reviews) ? reviews : [])",
  "    .filter((review) => REQUEST_WORDS.some((word) => String(review.body || '').toLowerCase().includes(word)))",
  "    .slice(0, 8)",
  "    .map((review) => ({ title: review.title || 'Review request', excerpt: String(review.body || '').slice(0, 220) }));",
  "}"
]);

write("src/ingest.js", [
  "import { readFileSync } from 'node:fs';",
  "import { rankApps } from './scoring.js';",
  "import { saveApps } from './repository.js';",
  "",
  "const allowedModes = new Set(['fixture', 'live-smoke']);",
  "",
  "export function loadFixtureApps() {",
  "  try {",
  "    return JSON.parse(readFileSync(new URL('../fixtures/apps.json', import.meta.url), 'utf8'));",
  "  } catch (error) {",
  "    throw new Error('Fixture apps unavailable: ' + (error instanceof Error ? error.message : String(error)));",
  "  }",
  "}",
  "",
  "export async function refreshApps({ mode = 'fixture' } = {}) {",
  "  if (!allowedModes.has(mode)) throw new Error('Unsupported refresh mode: ' + mode);",
  "  const apps = loadFixtureApps();",
  "  const ranked = rankApps(apps).map((app, index) => ({ ...app, radarRank: index + 1, dataMode: mode }));",
  "  saveApps(ranked);",
  "  return ranked;",
  "}",
  "",
  "if (process.argv[1] && process.argv[1].endsWith('ingest.js')) {",
  "  const apps = await refreshApps({ mode: process.argv.includes('--live') ? 'live-smoke' : 'fixture' });",
  "  console.log(JSON.stringify({ ok: true, apps: apps.length }, null, 2));",
  "}"
]);

write("src/server.js", [
  "import { createServer } from 'node:http';",
  "import { existsSync, createReadStream } from 'node:fs';",
  "import { extname, join, resolve } from 'node:path';",
  "import { loadApps } from './repository.js';",
  "import { refreshApps } from './ingest.js';",
  "import { buildSummary } from './summary.js';",
  "",
  "const publicDir = resolve('public');",
  "const port = Number(process.env.PORT || 4317);",
  "const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };",
  "const jsonHeaders = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };",
  "",
  "function sendJson(res, status, body) {",
  "  res.writeHead(status, jsonHeaders);",
  "  res.end(JSON.stringify(body));",
  "}",
  "",
  "function serveStatic(req, res) {",
  "  const pathname = new URL(req.url, 'http://localhost').pathname;",
  "  const file = pathname === '/' ? join(publicDir, 'index.html') : join(publicDir, pathname);",
  "  if (!file.startsWith(publicDir) || !existsSync(file)) return false;",
  "  res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream' });",
  "  createReadStream(file).pipe(res);",
  "  return true;",
  "}",
  "",
  "const server = createServer(async (req, res) => {",
  "  const url = new URL(req.url, 'http://localhost');",
  "  try {",
  "    if (req.method === 'OPTIONS') return sendJson(res, 204, {});",
  "    if (url.pathname === '/health') return sendJson(res, 200, { ok: true });",
  "    if (url.pathname === '/api/summary' && req.method === 'GET') return sendJson(res, 200, buildSummary(loadApps()));",
  "    if (url.pathname === '/api/apps' && req.method === 'GET') return sendJson(res, 200, { apps: loadApps() });",
  "    if (url.pathname.startsWith('/api/apps/') && req.method === 'GET') {",
  "      const id = decodeURIComponent(url.pathname.split('/').pop());",
  "      const app = loadApps().find((item) => item.id === id);",
  "      return app ? sendJson(res, 200, { app }) : sendJson(res, 404, { error: 'not_found' });",
  "    }",
  "    if (url.pathname === '/api/refresh' && req.method === 'POST') {",
  "      const apps = await refreshApps({ mode: url.searchParams.get('mode') || 'fixture' });",
  "      return sendJson(res, 200, { ok: true, apps });",
  "    }",
  "    if (serveStatic(req, res)) return;",
  "    sendJson(res, 404, { error: 'not_found' });",
  "  } catch (error) {",
  "    sendJson(res, 500, { error: error instanceof Error ? error.message : String(error) });",
  "  }",
  "});",
  "",
  "await refreshApps({ mode: 'fixture' });",
  "server.listen(port, () => console.log('Consumer App Radar listening on :' + port));"
]);

write("public/index.html", `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Consumer App Radar</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <main>
    <header class="topbar">
      <div>
        <p class="eyebrow">Consumer app factory intelligence</p>
        <h1>Consumer App Radar</h1>
        <p>Find fast-growing iPhone apps, understand their growth loops, and spot product gaps worth building.</p>
      </div>
      <button id="refresh" type="button">Refresh data</button>
    </header>

    <section id="summary" class="kpi-grid" aria-label="Radar summary"></section>

    <section class="toolbar" aria-label="Radar controls">
      <label>
        Search
        <input id="search" type="search" placeholder="App, category, request, strategy">
      </label>
      <label>
        Category
        <select id="category">
          <option value="all">All categories</option>
        </select>
      </label>
      <label>
        Sort
        <select id="sort">
          <option value="opportunityScore">Opportunity score</option>
          <option value="rankDelta4w">Rank velocity</option>
          <option value="reviewDelta4w">Review growth</option>
          <option value="socialDelta4w">Social growth</option>
          <option value="rating">Rating</option>
        </select>
      </label>
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
`);

write("public/styles.css", `
:root {
  color-scheme: light;
  --ink: #182026;
  --muted: #61717d;
  --line: #d9e1e7;
  --panel: #ffffff;
  --bg: #f5f7f8;
  --accent: #0f766e;
  --accent-soft: #e6f4f1;
  --warn: #9a5b12;
  --danger: #9f2d20;
  --blue: #315f8a;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  color: var(--ink);
  background: var(--bg);
}
main { max-width: 1380px; margin: 0 auto; padding: 24px; }
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
.topbar p { max-width: 780px; margin-top: 6px; }
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
.kpi {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 14px;
  min-height: 88px;
}
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
  grid-template-columns: minmax(260px, 1fr) 220px 220px;
  gap: 10px;
  align-items: end;
  margin-bottom: 14px;
}
.toolbar label {
  display: grid;
  gap: 5px;
  font-size: 12px;
  font-weight: 750;
  text-transform: uppercase;
}
input, select {
  width: 100%;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: white;
  color: var(--ink);
  min-height: 42px;
  padding: 9px 10px;
}
.layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(360px, 430px);
  gap: 14px;
  align-items: start;
}
.panel {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 16px;
}
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
  grid-template-columns: 72px minmax(170px, 1.2fr) minmax(240px, 1fr) 120px 120px 120px;
  gap: 12px;
  align-items: center;
  min-height: 82px;
  padding: 12px;
  border-bottom: 1px solid var(--line);
  background: white;
  cursor: pointer;
}
.app-row:last-child { border-bottom: 0; }
.app-row[aria-selected="true"] { background: #f0f7f5; box-shadow: inset 3px 0 0 var(--accent); }
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
.meta, .signal-label { color: var(--muted); font-size: 13px; margin-top: 4px; }
.strategy-preview { color: var(--ink); font-size: 13px; line-height: 1.35; }
.metric { text-align: right; font-weight: 800; }
.metric span { display: block; color: var(--muted); font-size: 12px; font-weight: 650; margin-top: 3px; }
.detail { display: grid; gap: 14px; position: sticky; top: 14px; }
.chips { display: flex; flex-wrap: wrap; gap: 6px; margin: 12px 0; }
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
.timeline { display: grid; gap: 7px; margin-top: 10px; }
.timeline-row {
  display: grid;
  grid-template-columns: 72px 1fr 48px;
  gap: 8px;
  align-items: center;
  color: var(--muted);
  font-size: 12px;
}
.bar { height: 8px; border-radius: 999px; background: #e8edf0; overflow: hidden; }
.bar span { display: block; height: 100%; background: var(--blue); }
.source-list { display: grid; gap: 9px; }
.source-item {
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 10px;
}
.source-item strong { display: block; font-size: 13px; }
.source-item span { color: var(--muted); font-size: 12px; }
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
  .layout { grid-template-columns: 1fr; }
  .detail { position: static; }
  .app-row { grid-template-columns: 64px minmax(0, 1fr) 100px; }
  .strategy-preview, .app-row .metric:nth-of-type(n+2) { display: none; }
}
@media (max-width: 720px) {
  main { padding: 16px; }
  .topbar { flex-direction: column; }
  .toolbar, .kpi-grid { grid-template-columns: 1fr; }
  .app-row { grid-template-columns: 54px minmax(0, 1fr); }
  .metric { text-align: left; grid-column: 2; }
}
`);

write("public/app.js", `
let apps = [];
let summary = null;
let selectedId = null;
const state = { search: "", category: "all", sort: "opportunityScore" };

const elements = {
  summary: document.querySelector("#summary"),
  apps: document.querySelector("#apps"),
  detail: document.querySelector("#detail"),
  sourceStatus: document.querySelector("#source-status"),
  search: document.querySelector("#search"),
  category: document.querySelector("#category"),
  sort: document.querySelector("#sort"),
  resultCount: document.querySelector("#result-count"),
  refresh: document.querySelector("#refresh")
};

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}

function list(items) {
  return "<ul>" + (items || []).map((item) => "<li>" + escapeHtml(item) + "</li>").join("") + "</ul>";
}

function metric(value, label) {
  return '<div class="metric">+' + escapeHtml(value) + '<span>' + escapeHtml(label) + '</span></div>';
}

function renderSummary() {
  if (!summary) return;
  const fastest = summary.fastestMover ? summary.fastestMover.name + " +" + summary.fastestMover.rankDelta4w : "n/a";
  const social = summary.strongestSocial ? summary.strongestSocial.name + " +" + summary.strongestSocial.socialDelta4w : "n/a";
  elements.summary.innerHTML = [
    ["Tracked apps", summary.trackedApps],
    ["Top category", summary.topCategory.name + " (" + summary.topCategory.count + ")"],
    ["Fastest rank move", fastest],
    ["Strongest social", social],
    ["Feature requests", summary.totalFeatureRequests]
  ].map(([label, value]) => '<article class="kpi"><span>' + escapeHtml(label) + '</span><strong>' + escapeHtml(value) + '</strong></article>').join("");
}

function renderSourceStatus() {
  const sources = summary?.sourceStatus || [];
  elements.sourceStatus.innerHTML = sources.map((source) =>
    '<article class="source-item"><strong>' + escapeHtml(source.name) + '</strong><span>' + escapeHtml(source.detail) + '</span><div class="status">' + escapeHtml(source.status) + '</div></article>'
  ).join("");
}

function renderCategories() {
  const selected = elements.category.value || state.category;
  const categories = [...new Set(apps.map((app) => app.category))].sort();
  elements.category.innerHTML = '<option value="all">All categories</option>' + categories.map((category) => '<option value="' + escapeHtml(category) + '">' + escapeHtml(category) + '</option>').join("");
  elements.category.value = categories.includes(selected) ? selected : "all";
  state.category = elements.category.value;
}

function filteredApps() {
  const query = state.search.trim().toLowerCase();
  return apps
    .filter((app) => state.category === "all" || app.category === state.category)
    .filter((app) => {
      if (!query) return true;
      const haystack = [app.name, app.category, ...(app.socialStrategy || []), ...(app.reviewThemes || []), ...(app.featureRequests || [])].join(" ").toLowerCase();
      return haystack.includes(query);
    })
    .sort((a, b) => Number(b[state.sort] || 0) - Number(a[state.sort] || 0));
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
      '<div class="score">' + escapeHtml(app.opportunityScore) + '</div>' +
      '<div><div class="name">' + escapeHtml(app.radarRank + ". " + app.name) + '</div><div class="meta">' + escapeHtml(app.category + " / " + app.country + " / rating " + app.rating) + '</div></div>' +
      '<div class="strategy-preview">' + escapeHtml((app.socialStrategy || [])[0] || "Strategy pending") + '<div class="signal-label">growth hypothesis</div></div>' +
      metric(app.rankDelta4w, "rank 4w") +
      metric(app.reviewDelta4w, "reviews 4w") +
      metric(app.socialDelta4w, "social 4w") +
    '</article>'
  ).join("");
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
    return '<div class="timeline-row"><span>' + escapeHtml(row.week) + '</span><div class="bar"><span style="width:' + width + '%"></span></div><strong>#' + escapeHtml(row.rank) + '</strong></div>';
  }).join("") + '</div>';
}

function renderDetail(app) {
  if (!app) {
    elements.detail.innerHTML = '<p>Select an app to inspect.</p>';
    return;
  }
  elements.detail.innerHTML =
    '<h3>' + escapeHtml(app.name) + '</h3>' +
    '<p>' + escapeHtml(app.category + " / rating " + app.rating + " / App Store ID " + app.appStoreId) + '</p>' +
    '<div class="chips"><span class="chip">rank +' + escapeHtml(app.rankDelta4w) + '</span><span class="chip">reviews +' + escapeHtml(app.reviewDelta4w) + '</span><span class="chip">social +' + escapeHtml(app.socialDelta4w) + '</span><span class="chip">mode ' + escapeHtml(app.dataMode || "fixture") + '</span></div>' +
    renderTimeline(app) +
    '<div class="opportunity-grid">' +
      '<section class="brief-section"><h4>Social Strategy</h4>' + list(app.socialStrategy) + '</section>' +
      '<section class="brief-section"><h4>Review Pain</h4>' + list(app.reviewThemes) + '</section>' +
      '<section class="brief-section"><h4>Feature Requests</h4>' + list(app.featureRequests) + '</section>' +
      '<section class="brief-section"><h4>Investigation Angles</h4>' + list(app.investigationAngles) + '</section>' +
      '<section class="brief-section"><h4>Evidence</h4>' + list(app.evidence) + '</section>' +
    '</div>';
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
elements.refresh.addEventListener("click", async () => {
  elements.refresh.disabled = true;
  try {
    await fetch("/api/refresh", { method: "POST" });
    await loadApps();
  } finally {
    elements.refresh.disabled = false;
  }
});

await loadApps();
`);

write("scripts/validate-artifacts.mjs", [
  "import { existsSync } from 'node:fs';",
  "import { readFileSync } from 'node:fs';",
  "const required = ['package.json','src/server.js','src/summary.js','src/scoring.js','src/snapshots.js','src/evidence.js','src/sources/social.js','public/index.html','public/app.js','fixtures/apps.json','tests/scoring.test.js'];",
  "const missing = required.filter((file) => !existsSync(file));",
  "if (missing.length) throw new Error('Missing generated artifacts: ' + missing.join(', '));",
  "const html = readFileSync('public/index.html', 'utf8');",
  "const js = readFileSync('public/app.js', 'utf8');",
  "const css = readFileSync('public/styles.css', 'utf8');",
  "for (const marker of ['id=\"search\"','id=\"category\"','id=\"sort\"','id=\"summary\"','id=\"source-status\"']) if (!html.includes(marker)) throw new Error('Missing product marker: ' + marker);",
  "for (const marker of ['renderSummary','renderSourceStatus','investigationAngles','weeklySnapshots']) if (!js.includes(marker)) throw new Error('Missing client marker: ' + marker);",
  "for (const marker of ['.kpi-grid','.toolbar','.app-table','.opportunity-grid','.source-list']) if (!css.includes(marker)) throw new Error('Missing style marker: ' + marker);",
  "console.log(JSON.stringify({ ok: true, artifacts: required.length, product_surface: true }, null, 2));"
]);

write("tests/scoring.test.js", [
  "import test from 'node:test';",
  "import assert from 'node:assert/strict';",
  "import { rankApps, scoreApp } from '../src/scoring.js';",
  "",
  "test('score rewards acceleration and review/social velocity', () => {",
  "  const fast = { rankDelta4w: 80, reviewDelta4w: 120, socialDelta4w: 200, rating: 4.8, reviewThemes: ['a','b'], featureRequests: ['c'] };",
  "  const slow = { rankDelta4w: 5, reviewDelta4w: 8, socialDelta4w: 12, rating: 4.9, reviewThemes: [], featureRequests: [] };",
  "  assert.ok(scoreApp(fast) > scoreApp(slow));",
  "});",
  "",
  "test('rankApps sorts by opportunity score', () => {",
  "  const ranked = rankApps([{ id: 'slow', rankDelta4w: 1 }, { id: 'fast', rankDelta4w: 90, reviewDelta4w: 90, socialDelta4w: 90 }]);",
  "  assert.equal(ranked[0].id, 'fast');",
  "});"
]);

write("tests/api-fixture.test.js", [
  "import test from 'node:test';",
  "import assert from 'node:assert/strict';",
  "import { refreshApps } from '../src/ingest.js';",
  "",
  "test('fixture ingest produces ranked apps', async () => {",
  "  const apps = await refreshApps({ mode: 'fixture' });",
  "  assert.ok(apps.length >= 3);",
  "  assert.equal(apps[0].radarRank, 1);",
  "  assert.ok(apps[0].opportunityScore > 0);",
  "});"
]);

write("README.md", [
  "# Consumer App Radar",
  "",
  "Generated by the Fabro Consumer App Radar workflow.",
  "",
  "## Run",
  "",
  "~~~bash",
  "npm test",
  "npm start",
  "~~~",
  "",
  "Open http://localhost:4317.",
  "",
  "## Live Data",
  "",
  "The first pass uses fixture data for repeatable CI. Live adapters are scaffolded",
  "for Apple RSS/iTunes and Apify actors. Set APIFY_TOKEN plus actor IDs in the",
  "workflow sandbox env before enabling live refresh."
]);

mkdirSync(".workflow/consumer-radar", { recursive: true });
writeFileSync(resolve(appDir, ".workflow-build.json"), JSON.stringify({
  ok: true,
  app_dir: requestedAppDir,
  generated_at: new Date().toISOString(),
  files: 17
}, null, 2) + "\n");
console.log(JSON.stringify({ ok: true, app_dir: requestedAppDir }, null, 2));
