#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

function arg(name, fallback = "") {
  const idx = process.argv.indexOf(name);
  return idx >= 0 && process.argv[idx + 1] ? process.argv[idx + 1] : fallback;
}

const appDir = process.argv[2] || "apps/generated-iphone-app";
const allowDeferred = arg("--allow-deferred", "false") === "true";
const root = ".workflow/iphone-app-factory";
const candidates = [
  join(appDir, "reports/ios/appium-exploratory-report.json"),
  `${root}/appium-exploratory-report.json`
];
const reportFile = candidates.find((file) => existsSync(file));
const failures = [];
let parsed = null;

if (!reportFile) {
  failures.push("missing Appium exploratory report");
} else {
  parsed = JSON.parse(readFileSync(reportFile, "utf8"));
  const buttonsTapped = Number(parsed.buttons_tapped ?? parsed.buttonsTapped ?? 0);
  const crashes = Number(parsed.crashes ?? 0);
  const failuresCount = Number(parsed.failures ?? parsed.failed_taps ?? 0);
  if (buttonsTapped < 1) failures.push("Appium report did not tap any buttons");
  if (crashes > 0) failures.push(`Appium report has ${crashes} crashes`);
  if (failuresCount > 0) failures.push(`Appium report has ${failuresCount} failures`);
}

let ok = failures.length === 0;
let status = ok ? "passed" : "failed";
if (!ok && allowDeferred && !reportFile) {
  ok = true;
  status = "deferred";
}

const report = { ok, status, appDir, reportFile: reportFile || null, failures, parsed };
writeFileSync(`${root}/appium-gate.json`, `${JSON.stringify(report, null, 2)}\n`);
if (!ok) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}
console.log(JSON.stringify(report));
