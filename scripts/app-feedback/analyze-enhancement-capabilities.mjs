#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`Missing value for ${name}`);
  return value;
}

function readIfExists(path) {
  return existsSync(path) ? readFileSync(path, "utf8") : "";
}

function listFiles(root, prefix = "") {
  if (!existsSync(root)) return [];
  const entries = [];
  for (const name of readdirSync(root, { withFileTypes: true })) {
    const relative = prefix ? `${prefix}/${name.name}` : name.name;
    const full = resolve(root, name.name);
    if (name.isDirectory()) {
      if (["node_modules", ".next", "dist", "coverage"].includes(name.name)) continue;
      entries.push(...listFiles(full, relative));
    } else {
      entries.push(relative);
    }
  }
  return entries;
}

const appDir = resolve(argValue("--app-dir", "apps/generated-consumer-app-radar"));
const analysisPath = resolve(argValue("--analysis", ".workflow/enhancement-discovery/request-analysis.json"));
const outPath = resolve(argValue("--out", ".workflow/enhancement-discovery/capability-audit.json"));
const target = argValue("--target", "consumer-radar");

const files = listFiles(appDir);
const server = readIfExists(resolve(appDir, "src/server.js"));
const ingest = readIfExists(resolve(appDir, "src/ingest.js"));
const apify = readIfExists(resolve(appDir, "src/sources/apify.js"));
const apple = readIfExists(resolve(appDir, "src/sources/apple.js"));
const social = readIfExists(resolve(appDir, "src/sources/social.js"));
const client = readIfExists(resolve(appDir, "public/app.js"));
const fixture = readIfExists(resolve(appDir, "fixtures/apps.json"));

let requestAnalysis = {};
try {
  requestAnalysis = JSON.parse(readIfExists(analysisPath) || "{}");
} catch (error) {
  requestAnalysis = { parse_error: error instanceof Error ? error.message : String(error) };
}

const capabilities = {
  app_dir_exists: existsSync(appDir),
  has_apify_runner: apify.includes("runApifyActor"),
  has_apple_review_adapter: apple.includes("fetchAppleReviews"),
  has_apple_search_adapter: apple.includes("searchAppleApps"),
  has_social_adapter: social.includes("fetchTikTokSignals") && social.includes("fetchInstagramSignals"),
  has_manual_seed_flow: ingest.includes("addCustomApp") && server.includes("/api/apps"),
  has_live_discovery_endpoint: server.includes("/api/discover") || server.includes("/api/enrich"),
  has_live_refresh_mode: ingest.includes("live") && !ingest.includes('allowedModes = new Set(["fixture", "live-smoke"])'),
  has_visible_reviews: client.includes("renderReviewSamples"),
  has_visible_example_content: client.includes("renderExampleContent"),
  has_fixture_disclosure: fixture.includes("Fixture-backed hypothesis") || ingest.includes("Fixture-backed hypothesis"),
};

const gaps = [];
if (!capabilities.has_live_discovery_endpoint) {
  gaps.push({
    id: "live-discovery-endpoint",
    severity: "blocker",
    finding: "The app has no API endpoint that discovers or enriches more apps from live sources.",
    required_work: "Add a live discovery/enrichment endpoint and UI control that can run with APIFY_TOKEN.",
  });
}
if (!capabilities.has_apify_runner || !capabilities.has_social_adapter) {
  gaps.push({
    id: "source-adapters",
    severity: "blocker",
    finding: "Live Apify source adapters are missing or not wired into product behavior.",
    required_work: "Wire App Store, TikTok, and Instagram actor execution into app enrichment.",
  });
}
if (!capabilities.has_live_refresh_mode) {
  gaps.push({
    id: "fixture-only-refresh",
    severity: "blocker",
    finding: "Refresh modes still behave as fixture or smoke paths, not real data acquisition.",
    required_work: "Add real-mode ingestion that fails when live evidence is required and unavailable.",
  });
}
if (capabilities.has_fixture_disclosure) {
  gaps.push({
    id: "honest-but-not-complete",
    severity: "major",
    finding: "The previous enhancement disclosed fixture provenance but did not complete the live behavior.",
    required_work: "Replace fixture-only evidence with live scrape evidence where real mode is requested.",
  });
}

const report = {
  ok: capabilities.app_dir_exists,
  target,
  app_dir: appDir,
  request_count: Array.isArray(requestAnalysis.acceptance) ? requestAnalysis.acceptance.length : 0,
  file_count: files.length,
  capabilities,
  gaps,
  non_cheating_requirements: [
    "Real-mode live discovery must fail if APIFY_TOKEN is absent and allow_fixture_fallback=false.",
    "Growth hypotheses must cite live social or App Store evidence when marked liveScraped=true.",
    "Fixture-backed rows may remain only when visually disclosed and excluded from live acceptance counts.",
    "Add-app controls must be able to fetch or enrich more apps, not only seed local placeholders.",
    "Review samples and example content must include source provenance.",
  ],
};

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exit(1);
