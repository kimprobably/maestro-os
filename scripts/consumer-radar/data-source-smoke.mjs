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

function usableSecret(value) {
  return Boolean(value && !value.includes("{{") && !value.includes("}}"));
}

const output = argValue("--output", ".workflow/consumer-radar/data-source-smoke.json");
const report = {
  ok: true,
  checked_at: new Date().toISOString(),
  apify_token_available: usableSecret(process.env.APIFY_TOKEN),
  actors: {
    appstore: process.env.APIFY_APPSTORE_ACTOR || "crawlerbros/appstore-scraper",
    tiktok: process.env.APIFY_TIKTOK_ACTOR || "clockworks/tiktok-scraper",
    instagram: process.env.APIFY_INSTAGRAM_ACTOR || "apify/instagram-scraper"
  },
  apple_review_rss: null,
  apify_identity: null
};

try {
  const response = await fetch("https://itunes.apple.com/us/rss/customerreviews/id=1610430305/sortBy=mostRecent/json", {
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

mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report, null, 2));
