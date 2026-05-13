#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

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

function usableSecret(value) {
  return Boolean(value && !value.includes("{{") && !value.includes("}}"));
}

const output = argValue("--output", ".workflow/consumer-radar/data-source-smoke.json");
const realMode = argBool("--real-mode", false);
const allowFixtureFallback = argBool("--allow-fixture-fallback", true);
const report = {
  ok: true,
  real_mode: realMode,
  allow_fixture_fallback: allowFixtureFallback,
  env_injected_by_fabro: true,
  checked_at: new Date().toISOString(),
  apify_token_available: usableSecret(process.env.APIFY_TOKEN),
  openrouter_key_available: usableSecret(process.env.OPENROUTER_API_KEY),
  actors: {
    appstore: process.env.APIFY_APPSTORE_ACTOR || "crawlerbros/appstore-scraper",
    tiktok: process.env.APIFY_TIKTOK_ACTOR || "clockworks/tiktok-scraper",
    instagram: process.env.APIFY_INSTAGRAM_ACTOR || "apify/instagram-scraper"
  },
  apple_review_rss: null,
  apify_identity: null
};

try {
  const response = await fetch("https://itunes.apple.com/us/rss/topfreeapplications/limit=25/genre=6007/json", {
    signal: AbortSignal.timeout(12000)
  });
  report.apple_review_rss = { ok: response.ok, status: response.status };
} catch (error) {
  report.apple_review_rss = { ok: false, error: error instanceof Error ? error.message : String(error) };
}

if (report.apify_token_available) {
  try {
    const response = await fetch("https://api.apify.com/v2/users/me?token=" + encodeURIComponent(process.env.APIFY_TOKEN), {
      signal: AbortSignal.timeout(12000)
    });
    report.apify_identity = { ok: response.ok, status: response.status };
  } catch (error) {
    report.apify_identity = { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
} else {
  report.apify_identity = { ok: false, status: "missing_or_unresolved_token" };
}

const hardFailures = [];
if (realMode && !allowFixtureFallback) {
  if (!report.apify_token_available) hardFailures.push("APIFY_TOKEN missing or unresolved");
  if (!report.openrouter_key_available) hardFailures.push("OPENROUTER_API_KEY missing or unresolved");
  if (!report.apple_review_rss?.ok) hardFailures.push("Apple RSS smoke failed");
  if (!report.apify_identity?.ok) hardFailures.push("Apify identity smoke failed");
}
report.hard_failures = hardFailures;
report.ok = hardFailures.length === 0;
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exit(1);
