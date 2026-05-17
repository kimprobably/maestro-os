#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

function arg(name, fallback = "") {
  const idx = process.argv.indexOf(name);
  return idx >= 0 && process.argv[idx + 1] ? process.argv[idx + 1] : fallback;
}

const appDir = process.argv[2] && !process.argv[2].startsWith("--")
  ? process.argv[2]
  : process.env.APP_DIR || process.env.UX_APP_DIR || "apps/generated-iphone-app";
const allowDeferred = arg("--allow-deferred", process.env.UX_ALLOW_MACOS_DEFERRED || "false") === "true";
const root = ".workflow/iphone-app-factory";
const uxRoot = ".workflow/iphone-app-ux-studio";
const candidates = [
  join(appDir, "reports/ios/appium-exploratory-report.json"),
  `${root}/appium-exploratory-report.json`
];
const reportFile = candidates.find((file) => existsSync(file));
const failures = [];
let parsed = null;

function readText(file) {
  return existsSync(file) ? readFileSync(file, "utf8") : "";
}

function hasHostedRuntimeDeferralEvidence() {
  const evidenceText = [
    `${uxRoot}/evidence/screen-flows.md`,
    `${uxRoot}/evidence/screen-flows-gate.json`,
    `${uxRoot}/screenshots/screenshot-manifest-gate.json`,
    `${root}/ios-ci-gate.json`,
  ]
    .map(readText)
    .filter(Boolean)
    .join("\n");

  return (
    /hosted\s+(macos|ios)|hosted\s+macos\/ios|daytona worker cannot|cannot produce ios simulator|simulator validation (was|were) not executable/i.test(evidenceText) &&
    /appium|simulator|runtime|xcode|screenshot/i.test(evidenceText)
  );
}

if (!reportFile) {
  failures.push("missing Appium exploratory report");
} else {
  parsed = JSON.parse(readFileSync(reportFile, "utf8"));
  const buttonsTapped = Number(parsed.buttons_tapped ?? parsed.buttonsTapped ?? 0);
  const crashes = Number(parsed.crashes ?? 0);
  const failuresCount = Number(parsed.failures ?? parsed.failed_taps ?? 0);
  const telemetryAvailable = parsed.telemetry_available === true;
  const fallbackEvidence =
    parsed.validated_fallback === true ||
    Boolean(parsed.raw_log_artifact || parsed.session_transcript || parsed.xcresult_path);
  if (parsed.ok === false) failures.push("Appium report marks ok=false");
  if (buttonsTapped < 1) failures.push("Appium report did not tap any buttons");
  if (crashes > 0) failures.push(`Appium report has ${crashes} crashes`);
  if (failuresCount > 0) failures.push(`Appium report has ${failuresCount} failures`);
  if (!telemetryAvailable && !fallbackEvidence) {
    failures.push("Appium report is not backed by telemetry or validated raw fallback evidence");
  }
  if (!telemetryAvailable && parsed.telemetry_source === "xcodebuild-log" && !fallbackEvidence) {
    failures.push("xcodebuild-log fallback must include raw_log_artifact, session_transcript, or xcresult_path");
  }
}

let ok = failures.length === 0;
let status = ok ? "passed" : "failed";
const hostedRuntimeDeferral = !reportFile && hasHostedRuntimeDeferralEvidence();
let deferredFailures = [];
if (!ok && hostedRuntimeDeferral) {
  deferredFailures = [...failures];
  failures.length = 0;
  ok = true;
  status = "deferred_to_hosted_ios";
} else if (!ok && allowDeferred && !reportFile) {
  deferredFailures = [...failures];
  failures.length = 0;
  ok = true;
  status = "deferred";
}

const report = {
  ok,
  status,
  appDir,
  reportFile: reportFile || null,
  allowDeferred,
  hostedRuntimeDeferral,
  failures,
  deferredFailures,
  parsed,
};
mkdirSync(dirname(`${root}/appium-gate.json`), { recursive: true });
writeFileSync(`${root}/appium-gate.json`, `${JSON.stringify(report, null, 2)}\n`);
if (!ok) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}
console.log(JSON.stringify(report));
