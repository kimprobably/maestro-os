export function buildSummary(apps) {
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
