import { existsSync } from "node:fs";
import { readFileSync } from "node:fs";
const required = [
  "package.json",
  "src/server.js",
  "src/summary.js",
  "src/scoring.js",
  "src/snapshots.js",
  "src/evidence.js",
  "src/sources/social.js",
  "public/index.html",
  "public/app.js",
  "fixtures/apps.json",
  "tests/scoring.test.js",
];
const missing = required.filter((file) => !existsSync(file));
if (missing.length)
  throw new Error("Missing generated artifacts: " + missing.join(", "));
const html = readFileSync("public/index.html", "utf8");
const js = readFileSync("public/app.js", "utf8");
const css = readFileSync("public/styles.css", "utf8");
for (const marker of [
  'id="search"',
  'id="category"',
  'id="sort"',
  'id="summary"',
  'id="source-status"',
])
  if (!html.includes(marker))
    throw new Error("Missing product marker: " + marker);
for (const marker of [
  "renderSummary",
  "renderSourceStatus",
  "investigationAngles",
  "weeklySnapshots",
])
  if (!js.includes(marker)) throw new Error("Missing client marker: " + marker);
for (const marker of [
  ".kpi-grid",
  ".toolbar",
  ".app-table",
  ".opportunity-grid",
  ".source-list",
])
  if (!css.includes(marker)) throw new Error("Missing style marker: " + marker);
console.log(
  JSON.stringify(
    { ok: true, artifacts: required.length, product_surface: true },
    null,
    2,
  ),
);
