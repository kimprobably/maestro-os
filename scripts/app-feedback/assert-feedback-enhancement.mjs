#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`Missing value for ${name}`);
  return value;
}

const appDir = resolve(process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : argValue("--app-dir", "apps/generated-consumer-app-radar"));
const target = argValue("--target", "consumer-radar");
const outPath = resolve(argValue("--out", ".workflow/app-feedback/feedback-acceptance.json"));

function read(relativePath) {
  const file = resolve(appDir, relativePath);
  return existsSync(file) ? readFileSync(file, "utf8") : "";
}

const failures = [];
const requiredFiles = [
  "fixtures/apps.json",
  "src/ingest.js",
  "src/scoring.js",
  "src/server.js",
  "public/index.html",
  "public/app.js",
  "public/styles.css",
  "tests/feedback-surface.test.js",
];

for (const file of requiredFiles) {
  if (!existsSync(resolve(appDir, file))) failures.push(`missing ${file}`);
}

const html = read("public/index.html");
const client = read("public/app.js");
const css = read("public/styles.css");
const ingest = read("src/ingest.js");
const scoring = read("src/scoring.js");
const server = read("src/server.js");

for (const marker of ["id=\"refresh-mode\"", "id=\"add-app-form\"", "id=\"hide-leaders\""]) {
  if (!html.includes(marker)) failures.push(`index missing ${marker}`);
}
for (const marker of ["renderReviewSamples", "renderExampleContent", "growthHypothesis", "reviewSamples", "exampleContent", "categoryLeader"]) {
  if (!client.includes(marker)) failures.push(`client missing ${marker}`);
}
for (const marker of ["addCustomApp", "manual-seed", "Fixture-backed hypothesis"]) {
  if (!ingest.includes(marker)) failures.push(`ingest missing ${marker}`);
}
for (const marker of ["POST", "/api/apps", "addCustomApp"]) {
  if (!server.includes(marker)) failures.push(`server missing ${marker}`);
}
for (const marker of ["sizeScore", "isCategoryLeader", "currentRank <= 15"]) {
  if (!scoring.includes(marker)) failures.push(`scoring missing ${marker}`);
}
for (const marker of [".review-card", ".content-card", ".add-app-form"]) {
  if (!css.includes(marker)) failures.push(`styles missing ${marker}`);
}

let apps = [];
try {
  apps = JSON.parse(read("fixtures/apps.json"));
} catch (error) {
  failures.push(`fixtures/apps.json invalid: ${error instanceof Error ? error.message : String(error)}`);
}

for (const app of apps) {
  const id = app.id || app.name || "unknown-app";
  if (typeof app.currentRank !== "number") failures.push(`${id} missing numeric currentRank`);
  if (typeof app.categoryLeader !== "boolean") failures.push(`${id} missing categoryLeader boolean`);
  if (!app.growthHypothesis || app.growthHypothesis.liveScraped !== false) failures.push(`${id} missing explicit non-live growthHypothesis`);
  if (!/fixture|manual/i.test(app.growthHypothesis?.basis || "")) failures.push(`${id} missing fixture/manual growth basis`);
  if (!Array.isArray(app.reviewSamples) || app.reviewSamples.length < 1) failures.push(`${id} missing reviewSamples`);
  if (!Array.isArray(app.exampleContent) || app.exampleContent.length < 1) failures.push(`${id} missing exampleContent`);
}

const report = {
  ok: failures.length === 0,
  target,
  app_dir: appDir,
  checked_apps: apps.length,
  failures,
  accepted_feedback: [
    "growth hypothesis provenance",
    "visible reviews",
    "emerging-not-biggest ranking",
    "example content",
    "add-app seed flow",
  ],
};

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exit(1);
