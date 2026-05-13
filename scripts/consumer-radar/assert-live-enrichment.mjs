#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error("Missing value for " + name);
  return value;
}

function argBool(name, fallback) {
  const raw = argValue(name, String(fallback));
  return raw === true || raw === "true" || raw === "1" || raw === "yes";
}

function argNumber(name, fallback) {
  const raw = Number(argValue(name, String(fallback)));
  if (!Number.isFinite(raw)) throw new Error("Invalid number for " + name);
  return raw;
}

function usableSecret(value) {
  return Boolean(value && !value.includes("{{") && !value.includes("}}"));
}

function readJson(file, fallback) {
  if (!existsSync(file)) return fallback;
  return JSON.parse(readFileSync(file, "utf8"));
}

function stringsFrom(value, out = []) {
  if (value == null) return out;
  if (typeof value === "string") out.push(value);
  else if (typeof value === "number" || typeof value === "boolean") out.push(String(value));
  else if (Array.isArray(value)) value.forEach((item) => stringsFrom(item, out));
  else if (typeof value === "object") Object.values(value).forEach((item) => stringsFrom(item, out));
  return out;
}

function hasLiveSource(value, requiredTerms = []) {
  const text = stringsFrom(value).join(" ").toLowerCase();
  if (/\bfixture\b|\bseed\b|manual-placeholder|not-run|pending scrape/.test(text)) return false;
  if (requiredTerms.length > 0 && !requiredTerms.some((term) => text.includes(term))) return false;
  return /\blive\b|apify|itunes|app store|apple|tiktok|instagram/.test(text);
}

function collectArrays(value, keyPattern, out = []) {
  if (!value || typeof value !== "object") return out;
  if (Array.isArray(value)) {
    value.forEach((item) => collectArrays(item, keyPattern, out));
    return out;
  }
  for (const [key, child] of Object.entries(value)) {
    if (Array.isArray(child) && keyPattern.test(key)) out.push(...child);
    collectArrays(child, keyPattern, out);
  }
  return out;
}

const appDir = process.argv[2] || "apps/generated-consumer-app-radar";
const realMode = argBool("--real-mode", false);
const allowFixtureFallback = argBool("--allow-fixture-fallback", true);
const minimumLiveApps = argNumber("--minimum-live-apps", 8);
const minimumReviewSamples = argNumber("--minimum-review-samples", 12);
const minimumSocialExamples = argNumber("--minimum-social-examples", 8);

const dataPath = resolve(appDir, ".data/apps.json");
const fixturePath = resolve(appDir, "fixtures/apps.json");
const rows = readJson(dataPath, readJson(fixturePath, []));
const apps = Array.isArray(rows) ? rows : [];

const reviewSamples = apps.flatMap((app) =>
  collectArrays(app, /^(reviews?|reviewSamples|userReviews|appStoreReviews)$/i),
);
const socialExamples = apps.flatMap((app) =>
  collectArrays(app, /^(socialExamples|socialContent|contentExamples|exampleContent|posts)$/i),
);

const liveApps = apps.filter((app) => {
  if (app?.growthHypothesis?.liveScraped !== true) return false;
  return hasLiveSource(app, ["live"]) || hasLiveSource(app, ["apify"]) || hasLiveSource(app, ["itunes"]);
});
const liveReviewSamples = reviewSamples.filter((item) => hasLiveSource(item, ["itunes", "app store", "apple", "live"]));
const liveSocialExamples = socialExamples.filter(
  (item) => item?.verifiedLiveScrape === true || hasLiveSource(item, ["apify", "tiktok", "instagram", "live"]),
);

const server = existsSync(resolve(appDir, "src/server.js"))
  ? readFileSync(resolve(appDir, "src/server.js"), "utf8")
  : "";
const frontend = existsSync(resolve(appDir, "public/app.js"))
  ? readFileSync(resolve(appDir, "public/app.js"), "utf8")
  : "";

const failures = [];
const warnings = [];
const strictRealMode = realMode && !allowFixtureFallback;

if (strictRealMode && !usableSecret(process.env.APIFY_TOKEN)) failures.push("APIFY_TOKEN missing or unresolved");
if (strictRealMode && liveApps.length < minimumLiveApps) {
  failures.push(`live_app_count ${liveApps.length} below minimum ${minimumLiveApps}`);
}
if (strictRealMode && liveReviewSamples.length < minimumReviewSamples) {
  failures.push(`live_review_sample_count ${liveReviewSamples.length} below minimum ${minimumReviewSamples}`);
}
if (strictRealMode && liveSocialExamples.length < minimumSocialExamples) {
  failures.push(`live_social_example_count ${liveSocialExamples.length} below minimum ${minimumSocialExamples}`);
}
if (strictRealMode && !server.includes("/api/fetch-more")) failures.push("missing /api/fetch-more endpoint");
if (strictRealMode && !server.includes("/api/enrich-app")) failures.push("missing /api/enrich-app endpoint");
if (strictRealMode && !/fetch more|fetchMore|load more/i.test(frontend)) {
  failures.push("missing fetch-more frontend control");
}

if (!strictRealMode && apps.length > 0 && liveApps.length === 0) {
  warnings.push("No live apps counted; fixture fallback is allowed for this run");
}

const report = {
  ok: failures.length === 0,
  app_dir: appDir,
  real_mode: realMode,
  allow_fixture_fallback: allowFixtureFallback,
  data_path: existsSync(dataPath) ? dataPath : fixturePath,
  totals: {
    app_count: apps.length,
    review_sample_count: reviewSamples.length,
    social_example_count: socialExamples.length,
  },
  live_app_count: liveApps.length,
  live_review_sample_count: liveReviewSamples.length,
  live_social_example_count: liveSocialExamples.length,
  minimums: {
    live_apps: minimumLiveApps,
    review_samples: minimumReviewSamples,
    social_examples: minimumSocialExamples,
  },
  warnings,
  failures,
};

for (const file of [
  ".workflow/consumer-radar/live-enrichment-report.json",
  "reports/consumer-radar/quality/live-enrichment-report.json",
]) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(report, null, 2) + "\n");
}

console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exit(1);
