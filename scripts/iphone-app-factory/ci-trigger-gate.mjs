#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const appDir = process.argv[2] && !process.argv[2].startsWith("--")
  ? process.argv[2]
  : process.env.APP_DIR || process.env.UX_APP_DIR || "apps/generated-iphone-app";
const root = process.env.FEATURE_WORKFLOW_ROOT || ".workflow/existing-app-feature";
const allowDeferred = String(process.env.FEATURE_ALLOW_CI_DEFERRED || process.env.UX_ALLOW_MACOS_DEFERRED || "false") === "true";
const evidencePath = `${root}/validation/ci-evidence.json`;
const reportPath = `${root}/validation/ci-trigger-gate.json`;
const failures = [];

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    failures.push(`${path} is not valid JSON`);
    return {};
  }
}

let evidence = {};
if (existsSync(evidencePath)) {
  evidence = readJson(evidencePath);
} else {
  const appReport = join(appDir, "reports/ios/ios-quality-report.json");
  if (existsSync(appReport)) evidence = readJson(appReport);
  else failures.push(`missing ${evidencePath}`);
}

const github = evidence.github_actions || evidence.githubActions || evidence.github || evidence;
const runId = github.run_id || github.runId || github.github_run_id || github.actions_run_id;
const commitSha = github.commit_sha || github.commitSha || github.head_sha || github.headSha;
const conclusion = github.conclusion || github.status || github.github_conclusion;
const artifacts = (github.artifacts || github.artifact_names || [])
  .map((artifact) => typeof artifact === "string" ? artifact : artifact?.name)
  .filter(Boolean);

if (!allowDeferred) {
  if (!runId) failures.push("missing GitHub Actions run id");
  if (!commitSha) failures.push("missing GitHub Actions commit SHA");
  if (!/^(success|succeeded|passed)$/i.test(String(conclusion || ""))) failures.push("GitHub Actions conclusion must be success/passed");
  if (artifacts.length === 0) failures.push("missing GitHub Actions artifact names");
}

const report = {
  ok: failures.length === 0 || allowDeferred,
  appDir,
  allowDeferred,
  run_id: runId || null,
  commit_sha: commitSha || null,
  conclusion: conclusion || null,
  artifacts,
  failures,
};
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
if (!report.ok) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}
console.log(JSON.stringify(report));
