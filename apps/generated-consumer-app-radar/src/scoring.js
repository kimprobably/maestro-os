export function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Number(value) || 0));
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
  const score =
    (rank * 0.34 +
      reviews * 0.23 +
      social * 0.24 +
      pain * 0.14 +
      rating * 0.05) *
    100;
  return Math.round(score);
}

export function rankApps(apps) {
  return apps
    .map((app) => ({ ...app, opportunityScore: scoreApp(app) }))
    .sort((a, b) => b.opportunityScore - a.opportunityScore);
}
