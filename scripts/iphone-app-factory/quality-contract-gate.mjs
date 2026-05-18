#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const appDir = process.argv[2] || "apps/generated-iphone-app";
const root = ".workflow/iphone-app-factory";
const failures = [];

function file(path) {
  const full = join(appDir, path);
  return existsSync(full) ? readFileSync(full, "utf8") : "";
}

const ci = file(".github/workflows/ios-quality.yml") || file(".github/workflows/ios-ci.yml");
const qualityScript = file("scripts/ci/ios-quality.sh") || file("scripts/ios/quality-gates.sh");
const appiumScript = file("scripts/qa/appium-exploratory-clicks.mjs") || file("scripts/qa/appium-exploratory-clicks.js");
const combined = `${ci}\n${qualityScript}\n${appiumScript}`;

if (!combined.trim()) failures.push("missing iOS quality workflow/scripts");

for (const token of ["xcodebuild", "test", "build", "swiftlint", "swiftformat", "qlty"]) {
  if (!combined.toLowerCase().includes(token.toLowerCase())) failures.push(`quality harness missing ${token}`);
}

if (!/gitleaks|trufflehog/i.test(combined)) failures.push("quality harness missing secret scan with gitleaks or trufflehog");
if (!/appium|xcuitest/i.test(combined)) failures.push("quality harness missing Appium/XCUITest");
if (!/button|XCUIElementTypeButton|tap/i.test(combined)) failures.push("Appium harness missing button tap exploration");
if (!/SwiftAI|Boilerplate|EchoLLM|MockAuth|TODO/i.test(combined)) failures.push("quality harness missing App Store 4.3 string audit tokens");

const report = { ok: failures.length === 0, appDir, failures };
writeFileSync(`${root}/quality-contract-gate.json`, `${JSON.stringify(report, null, 2)}\n`);
if (!report.ok) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}
console.log(JSON.stringify(report));
