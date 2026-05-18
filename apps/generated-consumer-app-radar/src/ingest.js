import { readFileSync } from "node:fs";
import { rankApps } from "./scoring.js";
import { loadApps, saveApps } from "./repository.js";

const allowedModes = new Set(["fixture", "live-smoke"]);

function slug(value) {
  return String(value || "app")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

export function loadFixtureApps() {
  try {
    return JSON.parse(
      readFileSync(new URL("../fixtures/apps.json", import.meta.url), "utf8"),
    );
  } catch (error) {
    throw new Error(
      "Fixture apps unavailable: " +
        (error instanceof Error ? error.message : String(error)),
    );
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
      confidence: liveScraped
        ? 0.82
        : Number(app.growthHypothesis?.confidence || 0.58),
    },
  };
}

function persistRanked(apps, mode) {
  const ranked = rankApps(apps.map((app) => withRunMode(app, mode))).map(
    (app, index) => ({
      ...app,
      radarRank: index + 1,
    }),
  );
  saveApps(ranked);
  return ranked;
}

export async function refreshApps({ mode = "fixture" } = {}) {
  if (!allowedModes.has(mode))
    throw new Error("Unsupported refresh mode: " + mode);
  return persistRanked(loadFixtureApps(), mode);
}

export async function addCustomApp(input = {}) {
  const existing = loadApps().length
    ? loadApps()
    : await refreshApps({ mode: "fixture" });
  const name = String(input.name || "").trim();
  if (!name) throw new Error("App name is required");
  const category =
    String(input.category || "Productivity").trim() || "Productivity";
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
    featureRequests: [
      "Run live review scrape",
      "Find TikTok and Instagram content examples",
    ],
    evidence: ["Manual seed from Add app form"],
    weeklySnapshots: [
      { week: "4w ago", rank: 158, reviewCount: 90, socialMentions: 45 },
      { week: "3w ago", rank: 153, reviewCount: 95, socialMentions: 50 },
      { week: "2w ago", rank: 148, reviewCount: 99, socialMentions: 57 },
      { week: "1w ago", rank: 143, reviewCount: 103, socialMentions: 62 },
      {
        week: "current",
        rank: Number(input.currentRank || 140),
        reviewCount: 108,
        socialMentions: 69,
      },
    ],
    investigationAngles: [
      "Validate App Store rank movement before treating this as a true opportunity.",
      "Run Apify search for TikTok and Instagram posts that mention this app.",
      "Scrape recent App Store reviews and replace the manual placeholder pain points.",
    ],
    growthHypothesis: {
      text: "Manual research seed; no growth claim yet.",
      confidence: 0.25,
      basis:
        "Added manually. No live Apify or App Store scrape has run for this seed.",
      liveScraped: false,
      sourceMode: "manual-seed",
    },
    reviewSamples: [
      {
        rating: 0,
        title: "Manual seed",
        body: "Run review ingestion to populate real customer feedback.",
        source: "manual-placeholder",
      },
    ],
    exampleContent: [
      {
        platform: "TikTok",
        creator: "pending",
        format: "pending scrape",
        hook: "Search needed",
        caption: "Run Apify to find example content.",
        engagement: 0,
        source: "manual-placeholder",
        verifiedLiveScrape: false,
      },
    ],
    dataSources: [
      {
        name: "Manual seed",
        status: "active",
        note: "Added through the dashboard form.",
      },
      {
        name: "Apify TikTok/Instagram",
        status: "not-run",
        note: "Use live refresh once actors are tuned.",
      },
    ],
  };
  const withoutDuplicate = existing.filter((app) => app.id !== id);
  const ranked = persistRanked([...withoutDuplicate, seed], "manual-seed");
  return ranked.find((app) => app.id === id);
}

if (process.argv[1] && process.argv[1].endsWith("ingest.js")) {
  const apps = await refreshApps({
    mode: process.argv.includes("--live") ? "live-smoke" : "fixture",
  });
  console.log(JSON.stringify({ ok: true, apps: apps.length }, null, 2));
}
