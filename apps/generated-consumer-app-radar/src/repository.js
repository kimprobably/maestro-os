import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const dbPath = resolve('.data/apps.json');

export function saveApps(apps) {
  mkdirSync(dirname(dbPath), { recursive: true });
  writeFileSync(dbPath, JSON.stringify(apps, null, 2) + '\n');
}

export function loadApps() {
  if (!existsSync(dbPath)) return [];
  return JSON.parse(readFileSync(dbPath, 'utf8'));
}
