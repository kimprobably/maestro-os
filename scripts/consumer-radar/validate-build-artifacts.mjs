#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error("Missing value for " + name);
  return value;
}

const appDir = process.argv[2] || "apps/generated-consumer-app-radar";
const minimum_apps = Number(argValue("--minimum-apps", "3"));
const minimum_reports = Number(argValue("--minimum-reports", "4"));
const required = [
  "package.json",
  "src/server.js",
  "src/scoring.js",
  "src/snapshots.js",
  "src/evidence.js",
  "src/sources/apify.js",
  "src/sources/apple.js",
  "src/sources/social.js",
  "public/index.html",
  "public/app.js",
  "public/styles.css",
  "fixtures/apps.json",
  "README.md"
];
const missing = required.filter((file) => !existsSync(resolve(appDir, file)));
const reports = [
  "reports/consumer-radar/quality/native-checks.json",
  "reports/consumer-radar/quality/qlty-report.json",
  "reports/consumer-radar/quality/promptfoo-report.json",
  "reports/consumer-radar/review-consensus.json"
];
const missingReports = reports.filter((file) => !existsSync(file));
const presentReports = reports.length - missingReports.length;
const apps = existsSync(resolve(appDir, "fixtures/apps.json")) ? JSON.parse(readFileSync(resolve(appDir, "fixtures/apps.json"), "utf8")) : [];
const report = {
  ok: missing.length === 0 && missingReports.length === 0 && apps.length >= minimum_apps && presentReports >= minimum_reports,
  app_dir: appDir,
  missing,
  missing_reports: missingReports,
  reports_present: presentReports,
  minimum_apps,
  minimum_reports,
  fixture_apps: apps.length
};
mkdirSync(".workflow/consumer-radar", { recursive: true });
writeFileSync(".workflow/consumer-radar/artifact-gate.json", JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exit(1);
