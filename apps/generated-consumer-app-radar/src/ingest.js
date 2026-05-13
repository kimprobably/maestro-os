import { readFileSync } from 'node:fs';
import { rankApps } from './scoring.js';
import { saveApps } from './repository.js';

export function loadFixtureApps() {
  return JSON.parse(readFileSync(new URL('../fixtures/apps.json', import.meta.url), 'utf8'));
}

export async function refreshApps({ mode = 'fixture' } = {}) {
  const apps = loadFixtureApps();
  const ranked = rankApps(apps).map((app, index) => ({ ...app, radarRank: index + 1, dataMode: mode }));
  saveApps(ranked);
  return ranked;
}

if (process.argv[1] && process.argv[1].endsWith('ingest.js')) {
  const apps = await refreshApps({ mode: process.argv.includes('--live') ? 'live-smoke' : 'fixture' });
  console.log(JSON.stringify({ ok: true, apps: apps.length }, null, 2));
}
