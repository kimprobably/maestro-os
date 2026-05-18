#!/usr/bin/env node
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const root = resolve(".workflow/test-assert-live-enrichment");
const passingApp = resolve(root, "passing-app");
const failingApp = resolve(root, "failing-app");

rmSync(root, { recursive: true, force: true });
mkdirSync(resolve(passingApp, ".data"), { recursive: true });
mkdirSync(resolve(passingApp, "src"), { recursive: true });
mkdirSync(resolve(passingApp, "public"), { recursive: true });
mkdirSync(resolve(failingApp, ".data"), { recursive: true });
mkdirSync(resolve(failingApp, "src"), { recursive: true });
mkdirSync(resolve(failingApp, "public"), { recursive: true });

const liveRows = Array.from({ length: 8 }, (_, index) => ({
  id: `live-${index + 1}`,
  name: `Live App ${index + 1}`,
  growthHypothesis: {
    liveScraped: true,
    basis: "Live Apify and Apple evidence",
  },
  reviews: [
    { source: "itunes-live", text: "Great blocker.", rating: 5 },
    { source: "app-store-live", text: "Needs better focus mode.", rating: 4 },
  ],
  socialExamples: [
    { platform: "TikTok", source: "apify-live", caption: "I deleted distractions", verifiedLiveScrape: true },
  ],
}));

writeFileSync(resolve(passingApp, ".data/apps.json"), JSON.stringify(liveRows, null, 2) + "\n");
writeFileSync(resolve(passingApp, "src/server.js"), "app.get('/api/fetch-more', handler); app.post('/api/enrich-app', handler);\n");
writeFileSync(resolve(passingApp, "public/app.js"), "button.textContent = 'Fetch More Apps';\n");
writeFileSync(
  resolve(failingApp, ".data/apps.json"),
  JSON.stringify(
    liveRows.slice(0, 2).map((row) => ({
      ...row,
      growthHypothesis: { liveScraped: false, basis: "Fixture-backed hypothesis" },
      reviews: [{ source: "fixture", text: "Seed review" }],
      socialExamples: [{ source: "fixture", caption: "Seed post", verifiedLiveScrape: false }],
    })),
    null,
    2,
  ) + "\n",
);
writeFileSync(resolve(failingApp, "src/server.js"), "app.get('/api/fetch-more', handler); app.post('/api/enrich-app', handler);\n");
writeFileSync(resolve(failingApp, "public/app.js"), "button.textContent = 'Fetch More Apps';\n");

const commonArgs = [
  "scripts/consumer-radar/assert-live-enrichment.mjs",
  passingApp,
  "--real-mode",
  "true",
  "--allow-fixture-fallback",
  "false",
  "--minimum-live-apps",
  "8",
  "--minimum-review-samples",
  "12",
  "--minimum-social-examples",
  "8",
];

const passing = spawnSync(process.execPath, commonArgs, {
  cwd: resolve("."),
  encoding: "utf8",
  env: { ...process.env, APIFY_TOKEN: "test-token" },
});
if (passing.status !== 0) {
  process.stderr.write(passing.stderr);
  process.stdout.write(passing.stdout);
  throw new Error("expected live enrichment gate to pass for live rows");
}

const failing = spawnSync(
  process.execPath,
  [
    "scripts/consumer-radar/assert-live-enrichment.mjs",
    failingApp,
    "--real-mode",
    "true",
    "--allow-fixture-fallback",
    "false",
    "--minimum-live-apps",
    "8",
    "--minimum-review-samples",
    "12",
    "--minimum-social-examples",
    "8",
  ],
  {
    cwd: resolve("."),
    encoding: "utf8",
    env: { ...process.env, APIFY_TOKEN: "test-token" },
  },
);

if (failing.status === 0) throw new Error("expected fixture-backed live enrichment gate to fail");
if (!failing.stdout.includes("live_app_count")) {
  process.stderr.write(failing.stderr);
  process.stdout.write(failing.stdout);
  throw new Error("failing report should include live counts");
}

console.log(JSON.stringify({ ok: true }, null, 2));
