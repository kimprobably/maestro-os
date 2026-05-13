export function computeWeeklyDeltas(snapshots) {
  const rows = Array.isArray(snapshots) ? snapshots : [];
  return rows.map((row, index) => {
    const previous = rows[index - 1] || row;
    return {
      ...row,
      rankDelta: Number(previous.rank || row.rank || 0) - Number(row.rank || previous.rank || 0),
      reviewDelta: Number(row.reviewCount || 0) - Number(previous.reviewCount || 0),
      socialDelta: Number(row.socialMentions || 0) - Number(previous.socialMentions || 0)
    };
  });
}

export function latestFourWeekVelocity(snapshots) {
  const deltas = computeWeeklyDeltas(snapshots).slice(-4);
  return deltas.reduce((sum, row) => sum + Math.max(0, row.rankDelta) + Math.max(0, row.reviewDelta) + Math.max(0, row.socialDelta), 0);
}
