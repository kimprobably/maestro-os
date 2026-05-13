#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const appDir = process.argv[2] || "apps/generated-consumer-app-radar";

function read(relativePath) {
  const fullPath = resolve(appDir, relativePath);
  if (!existsSync(fullPath)) return "";
  return readFileSync(fullPath, "utf8");
}

function includesAll(label, body, required) {
  return required
    .filter((needle) => !body.includes(needle))
    .map((needle) => `${label} missing ${needle}`);
}

const html = read("public/index.html");
const js = read("public/app.js");
const css = read("public/styles.css");
const server = read("src/server.js");
const fixturePath = resolve(appDir, "fixtures/apps.json");
const fixtures = existsSync(fixturePath) ? JSON.parse(readFileSync(fixturePath, "utf8")) : [];

const failures = [
  ...includesAll("index", html, [
    'id="search"',
    'id="category"',
    'id="sort"',
    'id="summary"',
    'id="source-status"',
    "app-table",
  ]),
  ...includesAll("client", js, [
    "renderSummary",
    "renderSourceStatus",
    "investigationAngles",
    "weeklySnapshots",
    "featureRequests",
    "socialStrategy",
  ]),
  ...includesAll("styles", css, [
    ".kpi-grid",
    ".toolbar",
    ".app-table",
    ".opportunity-grid",
    ".source-list",
  ]),
  ...includesAll("server", server, ["/api/summary", "buildSummary"]),
];

if (fixtures.length < 6) {
  failures.push(`fixtures expected at least 6 apps, found ${fixtures.length}`);
}

for (const app of fixtures) {
  for (const key of [
    "weeklySnapshots",
    "socialStrategy",
    "reviewThemes",
    "featureRequests",
    "investigationAngles",
    "dataSources",
  ]) {
    if (!Array.isArray(app[key]) || app[key].length === 0) {
      failures.push(`${app.id || app.name || "app"} missing non-empty ${key}`);
    }
  }
}

const report = {
  ok: failures.length === 0,
  app_dir: appDir,
  checks: {
    fixture_apps: fixtures.length,
    html: Boolean(html),
    client: Boolean(js),
    styles: Boolean(css),
    server: Boolean(server),
  },
  failures,
};

console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exit(1);
