export async function fetchAppleReviews(appStoreId, country = 'us', limit = 25) {
  const url = 'https://itunes.apple.com/' + country + '/rss/customerreviews/id=' + encodeURIComponent(appStoreId) + '/sortBy=mostRecent/json';
  const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error('Apple review RSS failed: ' + response.status);
  const payload = await response.json();
  const entries = Array.isArray(payload?.feed?.entry) ? payload.feed.entry.slice(1) : [];
  return entries.slice(0, limit).map((entry) => ({
    title: entry?.title?.label || '',
    body: entry?.content?.label || '',
    rating: Number(entry?.['im:rating']?.label || 0),
    updated: entry?.updated?.label || null
  }));
}

export async function searchAppleApps(term, country = 'US') {
  const url = 'https://itunes.apple.com/search?entity=software&limit=10&country=' + encodeURIComponent(country) + '&term=' + encodeURIComponent(term);
  const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error('Apple search failed: ' + response.status);
  const payload = await response.json();
  return payload.results || [];
}
