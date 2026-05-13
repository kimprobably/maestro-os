import { existsSync } from "node:fs";
const required = [
  "package.json",
  "src/server.js",
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
console.log(JSON.stringify({ ok: true, artifacts: required.length }, null, 2));
