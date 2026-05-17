#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
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

function safeRelativeAppDir(appDir) {
  const normalized = String(appDir || "").replace(/\\/g, "/");
  if (!normalized || normalized === ".") throw new Error("app_dir must be a relative checkout directory, not current directory");
  if (isAbsolute(normalized)) throw new Error("app_dir must be relative");
  if (normalized.split("/").includes("..")) throw new Error("app_dir must not contain traversal");
  return normalized;
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: options.timeout || 120000,
  });
  if (result.status !== 0) {
    const message = `${result.stderr || result.stdout || command} failed with status ${result.status}`;
    throw new Error(redactUrl(message).slice(0, 1000));
  }
  return (result.stdout || "").trim();
}

function runAllowFailure(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: options.cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: options.timeout || 120000,
  });
}

function remoteBranchExists(repoUrl, authArgs, branch) {
  const result = runAllowFailure("git", [...authArgs, "ls-remote", "--exit-code", "--heads", repoUrl, branch]);
  return result.status === 0 && Boolean((result.stdout || "").trim());
}

const repoUrl = argValue("--repo-url", process.env.UX_REPO_URL || "");
const baseBranch = argValue("--base-branch", process.env.UX_BASE_BRANCH || "main");
const runBranch = argValue("--run-branch", process.env.UX_RUN_BRANCH || "ux-studio/manual");
const appDir = safeRelativeAppDir(argValue("--app-dir", process.env.UX_APP_DIR || process.env.APP_DIR || "apps/existing-iphone-app"));
const outPath = argValue("--out", ".workflow/iphone-app-ux-studio/checkout.json");
const failures = [];

if (!repoUrl) failures.push("repo_url is required");
if (hasUrlCredentials(repoUrl)) failures.push("repo_url must not include credentials");
if (!baseBranch) failures.push("base_branch is required");
if (!runBranch || /{{|}}/.test(runBranch)) failures.push("run_branch must be concrete");

let sha = null;
let action = "none";
let checkoutSource = "base_branch";
try {
  if (failures.length === 0) {
    const authArgs = githubAuthArgs(repoUrl);
    const fullAppDir = resolve(appDir);
    const hasRemoteRunBranch = remoteBranchExists(repoUrl, authArgs, runBranch);
    const cloneBranch = hasRemoteRunBranch ? runBranch : baseBranch;
    const checkoutRef = hasRemoteRunBranch ? `origin/${runBranch}` : `origin/${baseBranch}`;
    checkoutSource = hasRemoteRunBranch ? "run_branch" : "base_branch";

    if (existsSync(appDir) && !existsSync(`${appDir}/.git`)) {
      const entries = readdirSync(appDir).filter((entry) => entry !== ".DS_Store");
      if (entries.length > 0) throw new Error("app_dir exists but is not a git checkout");
    }

    if (!existsSync(`${appDir}/.git`)) {
      mkdirSync(dirname(fullAppDir), { recursive: true });
      run("git", [...authArgs, "clone", "--branch", cloneBranch, "--depth", "1", repoUrl, appDir]);
      action = "cloned";
    } else {
      run("git", [...authArgs, "fetch", "origin", baseBranch, "--depth", "1"], { cwd: appDir });
      if (hasRemoteRunBranch) {
        run("git", [...authArgs, "fetch", "origin", `refs/heads/${runBranch}:refs/remotes/origin/${runBranch}`, "--depth", "1"], {
          cwd: appDir,
        });
      }
      action = "updated";
    }

    run("git", ["checkout", "-B", runBranch, checkoutRef], { cwd: appDir });
    sha = run("git", ["rev-parse", "HEAD"], { cwd: appDir });
  }
} catch (error) {
  failures.push(error.message);
}

const report = {
  ok: failures.length === 0,
  action,
  repo_url: redactUrl(repoUrl),
  base_branch: baseBranch,
  run_branch: runBranch,
  checkout_source: checkoutSource,
  app_dir: appDir,
  sha,
  failures,
};

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);
if (!report.ok) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}
console.log(JSON.stringify(report));
