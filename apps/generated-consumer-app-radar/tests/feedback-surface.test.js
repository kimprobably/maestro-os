import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { refreshApps, addCustomApp } from "../src/ingest.js";
import { rankApps } from "../src/scoring.js";

test("fixture data is explicit about non-live growth evidence", async () => {
  const apps = await refreshApps({ mode: "fixture" });
  const first = apps[0];
  assert.equal(first.growthHypothesis.liveScraped, false);
  assert.match(first.growthHypothesis.basis, /fixture/i);
  assert.ok(first.growthHypothesis.confidence <= 0.65);
  assert.ok(first.reviewSamples.length >= 2);
  assert.ok(first.exampleContent.length >= 2);
});

test("ranking prefers emerging fast growers over category leaders", () => {
  const ranked = rankApps([
    {
      id: "leader",
      rankDelta4w: 70,
      reviewDelta4w: 120,
      socialDelta4w: 200,
      currentRank: 2,
      isCategoryLeader: true,
      rating: 4.9,
    },
    {
      id: "emerging",
      rankDelta4w: 55,
      reviewDelta4w: 92,
      socialDelta4w: 150,
      currentRank: 64,
      isCategoryLeader: false,
      rating: 4.6,
    },
  ]);
  assert.equal(ranked[0].id, "emerging");
});

test("custom app addition creates a ranked research seed", async () => {
  await refreshApps({ mode: "fixture" });
  const app = await addCustomApp({
    name: "Test Focus App",
    category: "Productivity",
    appStoreId: "test-focus-app",
  });
  assert.equal(app.name, "Test Focus App");
  assert.equal(app.dataMode, "manual-seed");
  assert.ok(app.reviewSamples.length >= 1);
  assert.ok(app.exampleContent.length >= 1);
  assert.ok(app.radarRank >= 1);
});

test("frontend surfaces feedback-driven controls and evidence panels", () => {
  const html = readFileSync(
    new URL("../public/index.html", import.meta.url),
    "utf8",
  );
  const client = readFileSync(
    new URL("../public/app.js", import.meta.url),
    "utf8",
  );
  for (const marker of [
    "refresh-mode",
    "add-app-form",
    "growth-hypothesis",
    "reviewSamples",
    "exampleContent",
    "categoryLeader",
  ]) {
    assert.ok(
      html.includes(marker) || client.includes(marker),
      `missing frontend marker ${marker}`,
    );
  }
});
