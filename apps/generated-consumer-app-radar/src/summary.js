export function buildSummary(apps) {
  const rows = Array.isArray(apps) ? apps : [];
  const byCategory = new Map();
  let totalFeatureRequests = 0;
  for (const app of rows) {
    byCategory.set(app.category, (byCategory.get(app.category) || 0) + 1);
    totalFeatureRequests += Array.isArray(app.featureRequests) ? app.featureRequests.length : 0;
  }
  const topCategory = [...byCategory.entries()].sort((a, b) => b[1] - a[1])[0] || ['n/a', 0];
  const fastestMover = rows.slice().sort((a, b) => Number(b.rankDelta4w || 0) - Number(a.rankDelta4w || 0))[0] || null;
  const strongestSocial = rows.slice().sort((a, b) => Number(b.socialDelta4w || 0) - Number(a.socialDelta4w || 0))[0] || null;
  return {
    trackedApps: rows.length,
    topCategory: { name: topCategory[0], count: topCategory[1] },
    fastestMover: fastestMover ? { name: fastestMover.name, rankDelta4w: fastestMover.rankDelta4w } : null,
    strongestSocial: strongestSocial ? { name: strongestSocial.name, socialDelta4w: strongestSocial.socialDelta4w } : null,
    totalFeatureRequests,
    sourceStatus: [
      { name: 'Apple App Store RSS', status: 'adapter-ready', detail: 'Review and search adapters are included.' },
      { name: 'Apify TikTok/Instagram', status: process.env.APIFY_TOKEN && !process.env.APIFY_TOKEN.includes('{{') ? 'token-present' : 'needs-token', detail: 'Social scraping runs through configurable Apify actors.' },
      { name: 'Fixture seed', status: 'active', detail: 'Used for deterministic CI and demos.' }
    ]
  };
}
