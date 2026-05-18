#!/usr/bin/env node
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { spawnSync } from "node:child_process";

const DEFAULT_MANIFEST = "reports/ios/screenshots/manifest.json";
const DEFAULT_REPORT = ".workflow/iphone-app-ux-studio/ios-runtime-evidence-preflight.json";
const DEFAULT_BLOCKER = ".workflow/iphone-app-ux-studio/evidence/ios-runtime-blocker.md";

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  return process.argv[index + 1] ?? fallback;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function hasCommand(name) {
  const result = spawnSync("sh", ["-lc", `command -v ${name} >/dev/null 2>&1`], {
    stdio: "ignore",
  });
  return result.status === 0;
}

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function writeBlocker(path, report) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(
    path,
    [
      "# iOS Runtime Evidence Blocker",
      "",
      `Captured: ${new Date().toISOString()}`,
      "",
      "## Failure Classification",
      "",
      "app build/test evidence blocker caused by missing hosted macOS/iOS runtime.",
      "",
      "## Evidence",
      "",
      `- Screenshot manifest present: ${report.manifest_present}`,
      `- xcrun available: ${report.xcrun_available}`,
      `- xcodebuild available: ${report.xcodebuild_available}`,
      "- The workflow must not fabricate simulator screenshots or a manifest.",
      "- With `allow_macos_deferred=false`, this remains a blocker until a real macOS/iOS worker or existing screenshot artifact set is provided.",
      "",
      "## Next Operator Action",
      "",
      "Route screenshot, Appium, and iOS quality evidence to a hosted macOS runner with Xcode and Simulator, or provide a reusable screenshot manifest plus image set before relaunching validation.",
      "",
    ].join("\n"),
  );
}

const manifestPath = argValue("--manifest", DEFAULT_MANIFEST);
const reportPath = argValue("--out", DEFAULT_REPORT);
const blockerPath = argValue("--blocker", DEFAULT_BLOCKER);
const successOnBlocker = hasFlag("--success-on-blocker");
const manifestPresent = existsSync(manifestPath);
const xcrunAvailable = hasCommand("xcrun");
const xcodebuildAvailable = hasCommand("xcodebuild");
const canProduceIosEvidence = xcrunAvailable && xcodebuildAvailable;

const report = {
  ok: manifestPresent || canProduceIosEvidence,
  manifest: manifestPath,
  manifest_present: manifestPresent,
  xcrun_available: xcrunAvailable,
  xcodebuild_available: xcodebuildAvailable,
  blocker_path: blockerPath,
  failure_classification: "none",
  failures: [],
};

if (!report.ok) {
  report.failure_classification = "app build/test";
  report.failures.push("missing screenshot manifest and no hosted macOS/iOS runtime tools are available");
  writeBlocker(blockerPath, report);
}

writeJson(reportPath, report);
console.log(JSON.stringify(report, null, 2));
process.exit(report.ok || successOnBlocker ? 0 : 1);
