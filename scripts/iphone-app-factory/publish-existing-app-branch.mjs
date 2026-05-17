#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";

function argValue(name, fallback = null) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`Missing value for ${name}`);
  return value;
}

function redactUrl(value) {
  try {
    const url = new URL(value);
    url.username = "";
    url.password = "";
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return String(value || "").replace(/\/\/[^/@\s]+@/g, "//[redacted]@");
  }
}

function hasUrlCredentials(value) {
  try {
    const url = new URL(value);
    return Boolean(url.username || url.password);
  } catch {
    return false;
  }
}

function safeRelativeAppDir(appDir) {
  const normalized = String(appDir || "").replace(/\\/g, "/");
  if (!normalized || normalized === ".") throw new Error("app_dir must be a relative checkout directory, not current directory");
  if (isAbsolute(normalized)) throw new Error("app_dir must be relative");
  if (normalized.split("/").includes("..")) throw new Error("app_dir must not contain traversal");
  return normalized;
}

function safeGitRef(value) {
  return /^[A-Za-z0-9._/-]+$/.test(value || "") && !String(value).includes("..") && !String(value).endsWith("/");
}

function githubAuthArgs(value) {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";
  if (!token) return [];

  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.hostname !== "github.com") return [];
  } catch {
    return [];
  }

  const credential = Buffer.from(`x-access-token:${token}`, "utf8").toString("base64");
  return ["-c", `http.https://github.com/.extraheader=AUTHORIZATION: basic ${credential}`];
}

function sanitizeOutput(value) {
  return redactUrl(String(value || "").replace(/AUTHORIZATION:\s*basic\s+[A-Za-z0-9+/=]+/gi, "AUTHORIZATION: basic [redacted]"));
}

function runGit(appDir, args, options = {}) {
  const result = spawnSync("git", args, {
    cwd: appDir,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: options.timeout || 120000,
  });
  if (options.allowFailure) return result;
  if (result.status !== 0) {
    const output = sanitizeOutput(result.stderr || result.stdout || "git failed");
    throw new Error(output.slice(0, 1000));
  }
  return (result.stdout || "").trim();
}

function remoteUrl(appDir, fallback) {
  const origin = runGit(appDir, ["remote", "get-url", "origin"], { allowFailure: true });
  if (origin.status === 0 && origin.stdout.trim()) return origin.stdout.trim();
  return fallback;
}

function remoteSha(appDir, authArgs, remote, branch) {
  const result = runGit(appDir, [...authArgs, "ls-remote", remote, `refs/heads/${branch}`], { allowFailure: true });
  if (result.status !== 0 || !result.stdout.trim()) return null;
  return result.stdout.trim().split(/\s+/)[0] || null;
}

function configuredGitIdentity(appDir) {
  const email = runGit(appDir, ["config", "--get", "user.email"], { allowFailure: true });
  const name = runGit(appDir, ["config", "--get", "user.name"], { allowFailure: true });
  if (email.status !== 0 || !email.stdout.trim()) {
    runGit(appDir, ["config", "user.email", "fabro-ux-studio@users.noreply.github.com"]);
  }
  if (name.status !== 0 || !name.stdout.trim()) {
    runGit(appDir, ["config", "user.name", "Fabro UX Studio"]);
  }
}

const repoUrlArg = argValue("--repo-url", process.env.UX_REPO_URL || "");
const appDir = safeRelativeAppDir(argValue("--app-dir", process.env.UX_APP_DIR || process.env.APP_DIR || "apps/existing-iphone-app"));
const runBranch = argValue("--run-branch", process.env.UX_RUN_BRANCH || "ux-studio/manual");
const outPath = argValue("--out", ".workflow/iphone-app-ux-studio/publish-existing-app-branch.json");
const remote = argValue("--remote", "origin");
const message = argValue("--message", "Apply WakeTask UX Studio iteration");
const failures = [];
const appPath = resolve(appDir);

if (repoUrlArg && hasUrlCredentials(repoUrlArg)) failures.push("repo_url must not include credentials");
if (!safeGitRef(runBranch)) failures.push("run_branch contains unsafe characters");
if (!existsSync(`${appDir}/.git`)) failures.push(`missing git checkout at ${appDir}`);

let action = "none";
let statusBefore = "";
let commitSha = null;
let pushedSha = null;
let repoUrl = repoUrlArg;

try {
  if (failures.length === 0) {
    repoUrl = remoteUrl(appDir, repoUrlArg);
    if (!repoUrl) throw new Error("missing origin remote and repo_url");
    const authArgs = githubAuthArgs(repoUrl);

    statusBefore = runGit(appDir, ["status", "--porcelain=v1"]);
    if (!statusBefore.trim()) {
      action = "no_changes";
      commitSha = runGit(appDir, ["rev-parse", "HEAD"]);
      pushedSha = remoteSha(appDir, authArgs, remote, runBranch);
    } else {
      configuredGitIdentity(appDir);
      runGit(appDir, ["add", "-A"]);
      const hasCachedDiff = runGit(appDir, ["diff", "--cached", "--quiet"], { allowFailure: true });
      if (hasCachedDiff.status === 0) {
        action = "no_changes";
        commitSha = runGit(appDir, ["rev-parse", "HEAD"]);
      } else {
        runGit(appDir, ["commit", "-m", message], { timeout: 180000 });
        commitSha = runGit(appDir, ["rev-parse", "HEAD"]);
        runGit(appDir, [...authArgs, "push", remote, `HEAD:refs/heads/${runBranch}`], { timeout: 180000 });
        pushedSha = remoteSha(appDir, authArgs, remote, runBranch);
        action = "committed_and_pushed";
        if (pushedSha !== commitSha) {
          throw new Error(`pushed branch ${runBranch} does not match local commit`);
        }
      }
    }
  }
} catch (error) {
  failures.push(sanitizeOutput(error.message));
}

const changedPaths = statusBefore
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean)
  .map((line) => line.slice(3));

const report = {
  ok: failures.length === 0,
  action,
  app_dir: appDir,
  app_path: appPath,
  repo_url: redactUrl(repoUrl),
  run_branch: runBranch,
  changed_file_count: changedPaths.length,
  changed_paths: changedPaths.slice(0, 200),
  commit_sha: commitSha,
  pushed_sha: pushedSha,
  pushed: Boolean(commitSha && pushedSha && commitSha === pushedSha),
  failures,
};

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);
if (!report.ok) {
  console.error(JSON.stringify({ ...report, changed_paths: report.changed_paths.slice(0, 50) }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify(report));
