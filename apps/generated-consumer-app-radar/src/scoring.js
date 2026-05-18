export function clamp(value, min = 0, max = 100) {
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
  const pain =
    clamp(
      (app.reviewThemes || []).length * 18 +
        (app.featureRequests || []).length * 12,
      0,
      100,
    ) / 100;
  const rating = clamp(((Number(app.rating) || 0) - 3.5) * 35, 0, 55) / 100;
  const confidence =
    clamp(Number(app.growthHypothesis?.confidence ?? 0.5) * 100, 20, 100) / 100;
  const score =
    (rank * 0.34 +
      reviews * 0.23 +
      social * 0.22 +
      pain * 0.12 +
      rating * 0.04 +
      confidence * 0.05) *
      100 +
    sizeScore(app);
  return Math.round(clamp(score, 0, 100));
}

export function rankApps(apps) {
  return apps
    .map((app) => ({ ...app, opportunityScore: scoreApp(app) }))
    .sort((a, b) => b.opportunityScore - a.opportunityScore);
}
