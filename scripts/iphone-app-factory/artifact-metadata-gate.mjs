#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { basename, dirname, join, relative } from "node:path";

function argValue(name, fallback = null) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`Missing value for ${name}`);
  return value;
}

function booleanArg(name, fallback) {
  return String(argValue(name, String(fallback))).toLowerCase() === "true";
}

const appDir = process.argv[2] || "apps/generated-iphone-app";
const outPath = argValue("--out", ".workflow/iphone-app-factory/artifact-metadata-gate.json");
const requirePushed = booleanArg("--require-pushed", true);
const remote = argValue("--remote", "origin");
const metadataBranch = argValue("--metadata-branch", process.env.FABRO_METADATA_BRANCH || null);
const expectedSha = argValue("--commit-sha", process.env.FABRO_METADATA_COMMIT_SHA || null);
const failures = [];

function write(report) {
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);
}

function walkFiles(root, limit = 5000) {
  if (!existsSync(root)) return [];
  const files = [];
  const ignored = new Set([".git", "node_modules", ".build", "DerivedData", ".swiftpm"]);
  function walk(dir) {
    for (const name of readdirSync(dir)) {
      if (ignored.has(name)) continue;
      const path = join(dir, name);
      const stats = statSync(path);
      if (stats.isDirectory()) {
        walk(path);
      } else if (stats.isFile()) {
        files.push(relative(process.cwd(), path));
        if (files.length >= limit) return;
      }
    }
  }
  walk(root);
  return files;
}

function git(args) {
  const result = spawnSync("git", args, {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return {
    ok: result.status === 0,
    status: result.status,
    stdout: (result.stdout || "").trim(),
    stderr: (result.stderr || "").trim(),
  };
}

function currentBranch() {
  return metadataBranch || git(["branch", "--show-current"]).stdout || null;
}

function currentSha() {
  return expectedSha || git(["rev-parse", "HEAD"]).stdout || null;
}

function remoteShaFor(branch) {
  if (!branch) return null;
  const result = git(["ls-remote", remote, `refs/heads/${branch}`]);
  if (!result.ok || !result.stdout) return null;
  return result.stdout.split(/\s+/)[0] || null;
}

function workflowFiles(root) {
  return walkFiles(root).filter((path) => /\.(ya?ml)$/i.test(path));
}

const appFiles = walkFiles(appDir);
const appWorkflows = workflowFiles(join(appDir, ".github/workflows"));
const rootWorkflows = workflowFiles(".github/workflows");
const appIosReports = walkFiles(join(appDir, "reports/ios"));
const rootIosReports = walkFiles("reports/ios");
const iosReportNames = new Set([...appIosReports, ...rootIosReports].map((path) => basename(path)));

if (!/^apps\/[a-z0-9-]+-iphone$/.test(appDir)) failures.push("app_dir must match apps/<slug>-iphone");
if (appFiles.length === 0) failures.push(`missing generated app artifacts under ${appDir}`);
if (appWorkflows.length === 0) failures.push(`missing generated app GitHub Actions workflow under ${appDir}/.github/workflows`);
for (const requiredReport of ["ios-quality-report.json", "appium-exploratory-report.json"]) {
  if (!iosReportNames.has(requiredReport)) failures.push(`missing iOS report artifact ${requiredReport}`);
}

const branch = currentBranch();
const sha = currentSha();
const pushedSha = requirePushed ? remoteShaFor(branch) : null;
if (requirePushed) {
  if (!branch) failures.push("could not determine metadata/run branch");
  if (!sha) failures.push("could not determine local commit SHA");
  if (!pushedSha) failures.push(`metadata/run branch ${branch || "<unknown>"} is not visible on ${remote}`);
  if (sha && pushedSha && sha !== pushedSha) {
    failures.push(`metadata/run branch ${branch} is pushed, but remote SHA ${pushedSha} does not match local SHA ${sha}`);
  }
}

const report = {
  ok: failures.length === 0,
  app_dir: appDir,
  app_file_count: appFiles.length,
  app_artifact_sample: appFiles.slice(0, 50),
  app_github_workflows: appWorkflows,
  root_github_workflows: rootWorkflows,
  ios_reports: [...appIosReports, ...rootIosReports],
  metadata_push: {
    required: requirePushed,
    remote,
    branch,
    commit_sha: sha,
    remote_sha: pushedSha,
    ok: !requirePushed || Boolean(sha && pushedSha && sha === pushedSha),
  },
  failures,
};

write(report);
if (!report.ok) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}
console.log(JSON.stringify(report));
