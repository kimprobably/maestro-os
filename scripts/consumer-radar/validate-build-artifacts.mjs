#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const appDir = process.argv[2] || "apps/generated-consumer-app-radar";
const required = [
  "package.json",
  "src/server.js",
  "src/scoring.js",
  "src/sources/apify.js",
  "src/sources/apple.js",
  "public/index.html",
  "public/app.js",
  "public/styles.css",
  "fixtures/apps.json",
  "README.md"
];
const missing = required.filter((file) => !existsSync(resolve(appDir, file)));
const reports = [
  ".workflow/consumer-radar/native-checks.json",
  ".workflow/consumer-radar/qlty-report.json",
  ".workflow/consumer-radar/promptfoo-report.json",
  ".workflow/consumer-radar/review-consensus.json"
];
const missingReports = reports.filter((file) => !existsSync(file));
const apps = existsSync(resolve(appDir, "fixtures/apps.json")) ? JSON.parse(readFileSync(resolve(appDir, "fixtures/apps.json"), "utf8")) : [];
const report = {
  ok: missing.length === 0 && missingReports.length === 0 && apps.length >= 3,
  app_dir: appDir,
  missing,
  missing_reports: missingReports,
  fixture_apps: apps.length
};
mkdirSync(".workflow/consumer-radar", { recursive: true });
writeFileSync(".workflow/consumer-radar/artifact-gate.json", JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exit(1);
