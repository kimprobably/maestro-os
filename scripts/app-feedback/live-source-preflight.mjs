#!/usr/bin/env node
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`Missing value for ${name}`);
  return value;
}

function booleanArg(name, fallback) {
  return String(argValue(name, String(fallback))).toLowerCase() === "true";
}

const appDir = resolve(argValue("--app-dir", "apps/generated-consumer-app-radar"));
const realMode = booleanArg("--real-mode", true);
const allowFixtureFallback = booleanArg("--allow-fixture-fallback", false);
const outPath = resolve(argValue("--out", ".workflow/consumer-radar-live-enrichment/source-preflight.json"));

const failures = [];
if (!existsSync(appDir)) failures.push(`app_dir does not exist: ${appDir}`);
if (realMode && !allowFixtureFallback && !process.env.APIFY_TOKEN) {
  failures.push("APIFY_TOKEN is required for real_mode without fixture fallback");
}

const report = {
  ok: failures.length === 0,
  app_dir: appDir,
  real_mode: realMode,
  allow_fixture_fallback: allowFixtureFallback,
  has_apify_token: Boolean(process.env.APIFY_TOKEN),
  failures,
};

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exit(1);
