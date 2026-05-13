import { runApifyActor } from './apify.js';

export async function fetchTikTokSignals(appName, { actorId = process.env.APIFY_TIKTOK_ACTOR || 'clockworks/tiktok-scraper' } = {}) {
  const items = await runApifyActor(actorId, { searchTerms: [appName], maxItems: 20 });
  return summarizeSocialItems(items, 'tiktok');
}

export async function fetchInstagramSignals(appName, { actorId = process.env.APIFY_INSTAGRAM_ACTOR || 'apify/instagram-scraper' } = {}) {
  const items = await runApifyActor(actorId, { search: appName, resultsLimit: 20 });
  return summarizeSocialItems(items, 'instagram');
}

export function summarizeSocialItems(items, platform) {
  const posts = Array.isArray(items) ? items : [];
  const engagements = posts.map((item) => Number(item.likes || item.likeCount || item.playCount || item.views || 0)).filter(Number.isFinite);
  const totalEngagement = engagements.reduce((sum, value) => sum + value, 0);
  return { platform, postCount: posts.length, totalEngagement, sampleCaptions: posts.slice(0, 5).map((item) => item.text || item.caption || item.description || '').filter(Boolean) };
}
