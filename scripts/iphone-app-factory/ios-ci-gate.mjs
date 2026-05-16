#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";

function arg(name, fallback = "") {
  const idx = process.argv.indexOf(name);
  return idx >= 0 && process.argv[idx + 1] ? process.argv[idx + 1] : fallback;
}

const appDir = process.argv[2] && !process.argv[2].startsWith("--")
  ? process.argv[2]
  : process.env.APP_DIR || process.env.UX_APP_DIR || "apps/generated-iphone-app";
const mode = arg("--mode", process.env.UX_IOS_VALIDATION_MODE || "github");
const allowDeferred = arg("--allow-deferred", process.env.UX_ALLOW_MACOS_DEFERRED || "false") === "true";
const root = ".workflow/iphone-app-factory";
const reportPath = `${root}/ios-ci-gate.json`;
const failures = [];
let status = "unknown";

function write(report) {
  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
}

function artifactNames(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((artifact) => typeof artifact === "string" ? artifact : artifact?.name)
    .filter(Boolean);
}

function hostedGithubEvidence(report) {
  const github = report.github_actions || report.githubActions || report.github || {};
  const runId = github.run_id || github.runId || report.github_run_id || report.actions_run_id || report.run_id;
  const commitSha = github.commit_sha || github.commitSha || github.head_sha || github.headSha || report.commit_sha || report.head_sha;
  const conclusion = github.conclusion || github.status || report.conclusion || report.github_conclusion;
  const artifacts = artifactNames(github.artifacts || report.artifacts || report.artifact_names || []);
  const failures = [];
  if (!runId) failures.push("missing GitHub Actions run id");
  if (!commitSha) failures.push("missing GitHub Actions commit SHA");
  if (!/^(success|succeeded|passed)$/i.test(String(conclusion || ""))) {
    failures.push("GitHub Actions conclusion must be success/passed");
  }
  if (artifacts.length === 0) failures.push("missing GitHub Actions artifact names");
  return {
    ok: failures.length === 0,
    failures,
    run_id: runId ? String(runId) : null,
    commit_sha: commitSha ? String(commitSha) : null,
    conclusion: conclusion ? String(conclusion) : null,
    artifacts,
  };
}

if (!existsSync(appDir)) failures.push(`missing app_dir ${appDir}`);

const existingReport = join(appDir, "reports/ios/ios-quality-report.json");
if (existsSync(existingReport)) {
  const parsed = JSON.parse(readFileSync(existingReport, "utf8"));
  if (parsed.ok === true || parsed.status === "passed") {
    const evidence = hostedGithubEvidence(parsed);
    if (mode === "github" && !allowDeferred && !evidence.ok) {
      failures.push(...evidence.failures);
      status = "failed_github_evidence";
    } else {
      status = mode === "github" ? "passed_github_actions" : "passed_existing_report";
    }
  } else {
    failures.push("reports/ios/ios-quality-report.json exists but is not passing");
  }
}

if (status === "unknown" && mode !== "github" && process.platform === "darwin" && existsSync(join(appDir, "scripts/ci/ios-quality.sh"))) {
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
    if (failures.length === 0 && allowDeferred) {
      status = "github_workflow_ready_deferred";
    } else if (failures.length === 0) {
      failures.push("missing hosted GitHub Actions iOS evidence while allow_macos_deferred=false");
      status = "missing_github_actions_evidence";
    } else {
      status = "github_workflow_invalid";
    }
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
