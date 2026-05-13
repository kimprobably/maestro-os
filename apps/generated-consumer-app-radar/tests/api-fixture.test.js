import test from 'node:test';
import assert from 'node:assert/strict';
import { refreshApps } from '../src/ingest.js';

test('fixture ingest produces ranked apps', async () => {
  const apps = await refreshApps({ mode: 'fixture' });
  assert.ok(apps.length >= 3);
  assert.equal(apps[0].radarRank, 1);
  assert.ok(apps[0].opportunityScore > 0);
});
