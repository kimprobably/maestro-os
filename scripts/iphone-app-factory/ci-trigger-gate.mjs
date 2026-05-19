#!/usr/bin/env node
import { spawnSync } from "node:child_process";
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
const ghBin = process.env.GH_BIN || "gh";
const workflow = process.env.FEATURE_CI_WORKFLOW || "ios-quality.yml";
const timeoutSeconds = Number(process.env.FEATURE_CI_TIMEOUT_SECONDS || 60 * 60);
const pollSeconds = Number(process.env.FEATURE_CI_POLL_SECONDS || 15);

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    failures.push(`${path} is not valid JSON`);
    return {};
  }
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd || process.cwd(),
    env: options.env || githubCliEnv(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: options.timeout || 120000,
  });
  if (result.status !== 0) {
    const detail = [result.stderr, result.stdout].filter(Boolean).join("\n").trim();
    throw new Error(`${command} ${args.join(" ")} failed${detail ? `: ${detail}` : ""}`);
  }
  return result.stdout.trim();
}

function githubCliEnv() {
  const preferredToken = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";
  if (!preferredToken) return process.env;
  return {
    ...process.env,
    GITHUB_TOKEN: preferredToken,
    GH_TOKEN: preferredToken,
  };
}

function safeRef(value) {
  return typeof value === "string" && value.length > 0 && !/[\\\s~^:?*\[]/.test(value) && !value.includes("..");
}

function githubRepoFromUrl(value) {
  if (!value) return "";
  if (/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(value)) return value;
  const httpsMatch = value.match(/^https:\/\/github\.com\/([^/]+)\/([^/#?]+?)(?:\.git)?(?:[#?].*)?$/);
  if (httpsMatch) return `${httpsMatch[1]}/${httpsMatch[2]}`;
  const sshMatch = value.match(/^git@github\.com:([^/]+)\/(.+?)(?:\.git)?$/);
  if (sshMatch) return `${sshMatch[1]}/${sshMatch[2]}`;
  return "";
}

function currentBranch() {
  try {
    return run("git", ["branch", "--show-current"], { cwd: appDir, timeout: 30000 });
  } catch {
    return "";
  }
}

function remoteUrl() {
  try {
    return run("git", ["config", "--get", "remote.origin.url"], { cwd: appDir, timeout: 30000 });
  } catch {
    return "";
  }
}

function sleep(ms) {
  if (ms <= 0) return;
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function ghJson(args) {
  const text = run(ghBin, args, { timeout: 120000 });
  try {
    return text ? JSON.parse(text) : {};
  } catch (err) {
    throw new Error(`gh ${args.join(" ")} returned invalid JSON: ${err.message}`);
  }
}

function triggerGithubActions() {
  const repo = githubRepoFromUrl(process.env.FEATURE_GITHUB_REPO || process.env.UX_REPO_URL || remoteUrl());
  const branch = process.env.UX_RUN_BRANCH || process.env.GITHUB_REF_NAME || currentBranch();
  if (!repo) throw new Error("missing GitHub repo; set FEATURE_GITHUB_REPO or UX_REPO_URL");
  if (!safeRef(branch)) throw new Error("missing or unsafe GitHub run branch");

  run(ghBin, ["workflow", "run", workflow, "--repo", repo, "--ref", branch]);

  const deadline = Date.now() + Math.max(1, timeoutSeconds) * 1000;
  let selected = null;
  while (Date.now() <= deadline) {
    const runs = ghJson([
      "run",
      "list",
      "--repo",
      repo,
      "--workflow",
      workflow,
      "--branch",
      branch,
      "--limit",
      "10",
      "--json",
      "databaseId,headSha,status,conclusion,url,createdAt",
    ]);
    selected = Array.isArray(runs) ? runs.find((run) => run.databaseId || run.runNumber) : null;
    if (selected && String(selected.status || "").toLowerCase() === "completed") break;
    sleep(Math.max(0, pollSeconds) * 1000);
  }

  if (!selected) throw new Error("GitHub Actions run was not found after workflow dispatch");
  if (String(selected.status || "").toLowerCase() !== "completed") {
    throw new Error(`GitHub Actions run did not complete before timeout; latest status=${selected.status || "unknown"}`);
  }

  const runId = selected.databaseId || selected.runNumber;
  const artifactResponse = ghJson(["api", `repos/${repo}/actions/runs/${runId}/artifacts`]);
  const artifacts = (artifactResponse.artifacts || [])
    .map((artifact) => artifact?.name)
    .filter(Boolean);

  const evidence = {
    ok: /^(success|succeeded|passed)$/i.test(String(selected.conclusion || "")),
    github_actions: {
      run_id: String(runId),
      commit_sha: selected.headSha || null,
      conclusion: selected.conclusion || null,
      status: selected.status || null,
      url: selected.url || null,
      workflow,
      branch,
      repo,
      artifacts,
    },
  };
  mkdirSync(dirname(evidencePath), { recursive: true });
  writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
  return evidence;
}

let evidence = {};
if (existsSync(evidencePath)) {
  evidence = readJson(evidencePath);
} else {
  const appReport = join(appDir, "reports/ios/ios-quality-report.json");
  if (existsSync(appReport)) evidence = readJson(appReport);
  else if (!allowDeferred) {
    try {
      evidence = triggerGithubActions();
    } catch (err) {
      failures.push(err.message);
    }
  }
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
