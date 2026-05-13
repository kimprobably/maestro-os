import test from "node:test";
import assert from "node:assert/strict";
import { enrichAppWithLiveSources } from "../src/ingest.js";
import { loadApps, saveApps } from "../src/repository.js";
import { readFileSync } from "node:fs";

test("fetchMoreApps gate: rejects when APIFY_TOKEN missing and no fallback", async () => {
  const oldToken = process.env.APIFY_TOKEN;
  delete process.env.APIFY_TOKEN;
  try {
    const { fetchMoreApps } = await import("../src/ingest.js");
    await assert.rejects(
      () =>
        fetchMoreApps({
          category: "Productivity",
          mode: "live",
          allowFixtureFallback: false,
        }),
      /APIFY_TOKEN/,
    );
  } finally {
    process.env.APIFY_TOKEN = oldToken;
  }
});

test("enrichAppWithLiveSources returns provenance metadata", async () => {
  const enriched = await enrichAppWithLiveSources({
    id: "test-app",
    name: "Test App",
    appStoreId: "test-123",
  });
  assert.ok(enriched.provenance, "should have provenance");
  assert.ok(enriched.provenance.source, "provenance should have source");
  assert.ok(enriched.provenance.fetchedAt, "provenance should have fetchedAt");
  assert.ok(enriched.provenance.rawId, "provenance should have rawId");
});

test("enrichAppWithLiveSources fails without appStoreId", async () => {
  const enriched = await enrichAppWithLiveSources({ id: "test" });
  assert.ok(enriched.error, "should have error without appStoreId");
});

test("frontend surfaces fetch-more UI and live-badge markers", () => {
  const html = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
  const client = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  for (const marker of [
    "fetch-more-btn",
    "fetch-more-retry",
    "fetch-more-loading",
    "fetch-more-bar",
    "live-badge",
    "review-actions",
    "enrich",
  ]) {
    assert.ok(
      html.includes(marker) || client.includes(marker),
      `missing frontend marker ${marker}`,
    );
  }
});
