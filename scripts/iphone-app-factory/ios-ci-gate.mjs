#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

function arg(name, fallback = "") {
  const idx = process.argv.indexOf(name);
  return idx >= 0 && process.argv[idx + 1] ? process.argv[idx + 1] : fallback;
}

const appDir = process.argv[2] || "apps/generated-iphone-app";
const mode = arg("--mode", "github");
const allowDeferred = arg("--allow-deferred", "false") === "true";
const root = ".workflow/iphone-app-factory";
const reportPath = `${root}/ios-ci-gate.json`;
const failures = [];
let status = "unknown";

function write(report) {
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
}

if (!existsSync(appDir)) failures.push(`missing app_dir ${appDir}`);

const existingReport = join(appDir, "reports/ios/ios-quality-report.json");
if (existsSync(existingReport)) {
  const parsed = JSON.parse(readFileSync(existingReport, "utf8"));
  if (parsed.ok === true || parsed.status === "passed") {
    status = "passed_existing_report";
  } else {
    failures.push("reports/ios/ios-quality-report.json exists but is not passing");
  }
}

if (status === "unknown" && process.platform === "darwin" && existsSync(join(appDir, "scripts/ci/ios-quality.sh"))) {
  const result = spawnSync("sh", ["scripts/ci/ios-quality.sh"], {
    cwd: appDir,
    encoding: "utf8",
    timeout: 60 * 60 * 1000
  });
  status = result.status === 0 ? "passed_local_macos" : "failed_local_macos";
  if (result.status !== 0) {
    failures.push(`local macOS quality script failed with status ${result.status}`);
  }
}

if (status === "unknown" && mode === "github") {
  const workflow = join(appDir, ".github/workflows/ios-quality.yml");
  if (!existsSync(workflow)) {
    failures.push("missing .github/workflows/ios-quality.yml for GitHub macOS validation");
  } else {
    const text = readFileSync(workflow, "utf8");
    if (!/macos-|runs-on:\s*\[?\s*macos/i.test(text)) failures.push("iOS CI workflow does not use a macOS runner");
    if (!/xcodebuild/i.test(text)) failures.push("iOS CI workflow missing xcodebuild");
    status = failures.length === 0 ? "github_workflow_ready" : "github_workflow_invalid";
  }
}

if (status === "unknown" && allowDeferred) {
  status = "deferred";
} else if (status === "unknown") {
  failures.push("no macOS validation evidence available and deferral is disabled");
}

const ok = failures.length === 0 || status === "deferred";
const report = { ok, status, appDir, mode, allowDeferred, failures };
write(report);
if (!ok) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}
console.log(JSON.stringify(report));
