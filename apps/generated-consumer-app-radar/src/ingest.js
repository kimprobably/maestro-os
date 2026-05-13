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

// ── provenance ────────────────────────────────────────────────────

function withProvenance(app, source) {
  return {
    ...app,
    provenance: {
      source,
      fetchedAt: new Date().toISOString(),
      rawId: String(app.appStoreId || app.id || ""),
    },
  };
}

// ── retry helper ──────────────────────────────────────────────────

async function retryWithBackoff(fn, { maxRetries = 3, baseDelay = 1_000, maxDelay = 8_000 } = {}) {
  const nonRetryable = new Set([400, 401, 403, 404]);
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const code = err?.statusCode || err?.response?.status;
      if (code && nonRetryable.has(code)) {
        const e = new Error(err.message);
        e.error_type = "non-retryable";
        e.retryable = false;
        throw e;
      }
      if (attempt >= maxRetries) break;
      const delay = Math.min(baseDelay * 2 ** attempt + Math.random() * baseDelay, maxDelay);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastError;
}

// ── fixture / rank mode helpers ───────────────────────────────────

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
  return withProvenance(
    {
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
    },
    "fixture",
  );
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

// ── legacy exports ────────────────────────────────────────────────

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

// ── Live discovery: fetchMoreApps ────────────────────────────────

function normalizeFromAppleSearch(item, fallbackCategory) {
  const name = String(
    item.trackName || item.trackCensoredName || "unknown",
  ).trim();
  const id = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
  return {
    id,
    name,
    category: String(item.genres?.[0] || fallbackCategory || "Other").trim(),
    country: "US",
    appStoreId: String(item.trackId || id),
    currentRank: 999,
    isCategoryLeader: false,
    categoryLeader: false,
    sizeBand: "discovered",
    rankDelta4w: 0,
    reviewDelta4w: Number(item.userRatingCount || 0),
    rating: Number(item.averageUserRating || 0),
    socialDelta4w: 0,
    socialStrategy: ["Discovery pending social enrichment"],
    reviewThemes: [],
    featureRequests: ["Run live review scrape"],
    evidence: ["Discovered via Apple search"],
    weeklySnapshots: [
      {
        week: "current",
        rank: 999,
        reviewCount: Number(item.userRatingCount || 0),
        socialMentions: 0,
      },
    ],
    investigationAngles: [
      "Validate whether this app shows genuine opportunity signals.",
      "Run Apify enrichment for real review and social data.",
    ],
    growthHypothesis: {
      text: "Newly discovered; awaiting enrichment.",
      confidence: 0.3,
      basis: "Apple search discovery; no Apify enrichment yet.",
      liveScraped: false,
      sourceMode: "discovery",
    },
    reviewSamples: [],
    exampleContent: [],
    dataSources: [
      {
        name: "Apple App Store search",
        status: "active",
        note: "Discovered via search",
      },
    ],
  };
}

function parseTikTokContent(items) {
  return (Array.isArray(items) ? items : []).slice(0, 5).map((item) => ({
    platform: "TikTok",
    creator: String(
      item.authorUniqueName || item.authorNickname || "unknown",
    ).trim(),
    format: "video",
    hook: String(item.text || item.description || item.title || "").slice(
      0,
      150,
    ),
    caption: String(item.text || item.description || "").slice(0, 250),
    engagement: Number(
      item.likes ||
        item.likeCount ||
        item.playCount ||
        item.diggCount ||
        0,
    ),
    source: "apify-tiktok",
    verifiedLiveScrape: true,
  }));
}

export async function fetchMoreApps({
  category,
  limit = 5,
  offset = 0,
  seed = "",
  mode = "live",
  allowFixtureFallback = false,
} = {}) {
  const search = seed || category || "top apps";
  const existingIds = new Set(loadApps().map((a) => a.id));

  // Real-mode gate: fail when credentials are missing and no fallback allowed
  if (mode === "live" && !allowFixtureFallback) {
    const hasToken =
      process.env.APIFY_TOKEN &&
      !process.env.APIFY_TOKEN.includes("{{");
    if (!hasToken) {
      const err = new Error("Live mode requires APIFY_TOKEN");
      err.error_type = "missing-credential";
      err.retryable = false;
      throw err;
    }
  }

  // Step 1: Discover apps via Apple iTunes Search
  const { searchAppleApps } = await import("./sources/apple.js");
  const appleResults = await retryWithBackoff(() => searchAppleApps(search));

  const liveApps = [];
  for (const appleItem of appleResults) {
    if (liveApps.length >= limit) break;

    const app = normalizeFromAppleSearch(appleItem, search);
    if (existingIds.has(app.id)) continue;

    // Step 2: Enrich with Apple review samples
    try {
      const { fetchAppleReviews } = await import("./sources/apple.js");
      const reviews = await retryWithBackoff(() =>
        fetchAppleReviews(app.appStoreId, "us", 10),
      );
      app.reviewSamples = reviews.map((r) => ({ ...r, source: "apple-rss" }));
    } catch {
      app.reviewSamples = [
        {
          rating: 0,
          title: "Review fetch failed",
          body: "Could not retrieve reviews for this app.",
          source: "review-unavailable",
        },
      ];
    }

    // Step 3: Enrich with Apify social content if token available
    const hasToken =
      process.env.APIFY_TOKEN &&
      !process.env.APIFY_TOKEN.includes("{{");
    if (hasToken) {
      try {
        const { runApifyActor } = await import("./sources/apify.js");
        const socialItems = await retryWithBackoff(() =>
          runApifyActor("clockworks/tiktok-scraper", {
            searchTerms: [app.name],
            maxItems: 5,
          }),
        );
        app.exampleContent = parseTikTokContent(socialItems);
        app.growthHypothesis = {
          ...app.growthHypothesis,
          liveScraped: true,
          confidence: 0.82,
          basis: "Live TikTok scrape via Apify populated this hypothesis.",
        };
      } catch {
        app.exampleContent = [];
        app.growthHypothesis.liveScraped = false;
      }
    } else if (!allowFixtureFallback) {
      app.exampleContent = [];
    }

    liveApps.push(app);
  }

  // Deduplicate against in-memory repository
  const uniqueApps = liveApps.filter((a) => !existingIds.has(a.id));

  // Add provenance and scoring
  const enriched = uniqueApps.map((app, index) => {
    const withProv = withProvenance(
      app,
      app.growthHypothesis?.liveScraped ? "apify" : "apple-rss",
    );
    const scored = rankApps([withProv]).find((a) => a.id === app.id);
    return scored ? scored : withProv;
  });

  // Merge into repository
  if (enriched.length > 0) {
    const allApps = [...loadApps(), ...enriched];
    saveApps(
      rankApps(allApps).map((a, i) => ({ ...a, radarRank: i + 1 })),
    );
  }

  return {
    apps: enriched,
    hasMore: appleResults.length > limit && enriched.length > 0,
    nextOffset: offset + enriched.length,
  };
}

// ── Per-app live enrichment ──────────────────────────────────────

export async function enrichAppWithLiveSources(app = {}, options = {}) {
  const { mode = "live", allowFixtureFallback = false } = options;
  const enriched = { ...app };

  if (!enriched.appStoreId) {
    enriched.error = "App must have an appStoreId for live enrichment";
    return enriched;
  }

  // Apple review ingestion
  try {
    const { fetchAppleReviews } = await import("./sources/apple.js");
    const reviews = await retryWithBackoff(() =>
      fetchAppleReviews(enriched.appStoreId, "us", 25),
    );
    enriched.reviewSamples = reviews.map((r) => ({ ...r, source: "apple-rss" }));
  } catch (err) {
    enriched.reviewSamples = [
      {
        rating: 0,
        title: "Review unavailable",
        body: String(err?.message || "unknown error"),
        source: "review-unavailable",
      },
    ];
  }

  // Apify social scrape if token available
  const hasToken =
    process.env.APIFY_TOKEN &&
    !process.env.APIFY_TOKEN.includes("{{");
  if (hasToken) {
    try {
      const { runApifyActor } = await import("./sources/apify.js");
      const socialItems = await retryWithBackoff(() =>
        runApifyActor("clockworks/tiktok-scraper", {
          searchTerms: [enriched.name || enriched.id],
          maxItems: 10,
        }),
      );
      enriched.exampleContent = parseTikTokContent(socialItems);
      enriched.growthHypothesis = {
        ...(enriched.growthHypothesis || {}),
        liveScraped: true,
        confidence: 0.82,
        basis: "Live social scrape via Apify populated this hypothesis.",
      };
    } catch (socialErr) {
      if (!allowFixtureFallback) {
        enriched.dataSources = enriched.dataSources || [];
        enriched.dataSources.push({
          name: "Apify TikTok",
          status: "failed",
          note: String(socialErr?.message || "unknown"),
        });
      }
    }
  }

  return withProvenance(enriched, "live-enrichment");
}

// ── CLI entry ─────────────────────────────────────────────────────

if (process.argv[1] && process.argv[1].endsWith("ingest.js")) {
  const apps = await refreshApps({
    mode: process.argv.includes("--live") ? "live-smoke" : "fixture",
  });
  console.log(JSON.stringify({ ok: true, apps: apps.length }, null, 2));
}
