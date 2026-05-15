#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const RAILWAY_WEB_URL = "https://fabro-maestro-production.up.railway.app";
const RAILWAY_API_URL = `${RAILWAY_WEB_URL}/api/v1`;

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`Missing value for ${name}`);
  return value;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function normalizeApiUrl(value) {
  const trimmed = String(value || RAILWAY_API_URL).replace(/\/+$/, "");
  if (trimmed.endsWith("/api/v1")) return trimmed;
  return `${trimmed}/api/v1`;
}

function webUrlFromApi(apiUrl) {
  return apiUrl.replace(/\/api\/v1$/, "");
}

function isLocalUrl(url) {
  return /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?(\/|$)/i.test(url);
}

function envPresent(name) {
  return Boolean(process.env[name] && !String(process.env[name]).includes("{{"));
}

function checkEnvGroups(groups) {
  const missing = [];
  const present = [];
  for (const group of groups) {
    const keys = Array.isArray(group) ? group : [group];
    if (keys.some(envPresent)) {
      present.push(keys.join(" or "));
    } else {
      missing.push(keys.join(" or "));
    }
  }
  return { missing, present };
}

function runGit(args) {
  const result = spawnSync("git", args, { encoding: "utf8" });
  return {
    ok: result.status === 0,
    status: result.status,
    stdout: (result.stdout || "").trim(),
    stderr: (result.stderr || "").trim(),
  };
}

function gitReport() {
  const branch = runGit(["branch", "--show-current"]);
  const upstream = runGit(["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"]);
  const dirty = runGit([
    "status",
    "--porcelain",
    "--",
    "workflows",
    "scripts",
    "prompts",
    "evals",
    "docs/FABRO-MCP-SETUP.md",
    "docs/IPHONE-APP-FACTORY-WORKFLOW.md",
    "docs/FABRO-RUN-LEDGER.md",
    "hermes/run-ledger",
    "hermes/skills/fabro-babysitter/SKILL.md",
    "hermes/distribution/maestro-operator/skills/fabro-babysitter/SKILL.md",
  ]);
  return {
    branch: branch.stdout || null,
    upstream: upstream.ok ? upstream.stdout : null,
    has_upstream: upstream.ok,
    dirty_paths: dirty.stdout ? dirty.stdout.split("\n").filter(Boolean) : [],
    git_available: branch.ok,
  };
}

async function fetchJson(url, token) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      signal: controller.signal,
    });
    const text = await response.text();
    return {
      ok: response.ok,
      status: response.status,
      body: text ? JSON.parse(text) : null,
    };
  } catch (error) {
    return { ok: false, status: null, error: error.message };
  } finally {
    clearTimeout(timeout);
  }
}

function workflowRegistryContains(payload, expectedWorkflow) {
  return JSON.stringify(payload || {}).includes(expectedWorkflow);
}

const apiUrl = normalizeApiUrl(argValue("--server", process.env.FABRO_SERVER || RAILWAY_API_URL));
const webUrl = String(argValue("--web-url", process.env.FABRO_WEB_URL || webUrlFromApi(apiUrl))).replace(/\/+$/, "");
const expectedWorkflow = argValue("--expected-workflow", "build-iphone-app");
const allowLocal = hasFlag("--allow-local");
const skipNetwork = hasFlag("--skip-network");
const skipGit = hasFlag("--skip-git");
const jsonOnly = hasFlag("--json");

const envGroups = [
  "FABRO_DEV_TOKEN",
  "OPENROUTER_API_KEY",
  "APIFY_TOKEN",
  ["GITHUB_TOKEN", "GH_TOKEN"],
  ["CLAUDE_CODE_OAUTH_TOKEN", "CLAUDE_CODE_CREDENTIALS_JSON_BASE64"],
  "CODEX_AUTH_JSON_BASE64",
  "MOBBIN_EMAIL",
  "MOBBIN_PASSWORD",
];

const failures = [];
const checks = {};
if (!allowLocal && (isLocalUrl(apiUrl) || isLocalUrl(webUrl))) {
  failures.push("FABRO_SERVER points at local Fabro; Railway is required for shared runs");
}
if (apiUrl !== RAILWAY_API_URL && !allowLocal) {
  failures.push(`FABRO_SERVER must be ${RAILWAY_API_URL} unless --allow-local is set`);
}

const env = checkEnvGroups(envGroups);
if (env.missing.length > 0) {
  failures.push(`missing environment keys: ${env.missing.join(", ")}`);
}
checks.env = { missing: env.missing, present_count: env.present.length };

if (!skipGit) {
  checks.git = gitReport();
  if (!checks.git.git_available) failures.push("git is not available");
  if (!checks.git.has_upstream) failures.push("current branch has no upstream");
  if (checks.git.dirty_paths.length > 0) {
    failures.push("workflow/script/prompt/doc changes are not committed and pushed");
  }
}

if (!skipNetwork) {
  const token = process.env.FABRO_DEV_TOKEN || "";
  checks.health = await fetchJson(`${webUrl}/health`, null);
  checks.system_info = await fetchJson(`${apiUrl}/system/info`, token);
  checks.settings = await fetchJson(`${apiUrl}/settings`, token);
  checks.workflows = await fetchJson(`${apiUrl}/workflows`, token);

  if (!checks.health.ok) failures.push(`Railway health check failed for ${webUrl}/health`);
  if (!checks.system_info.ok) failures.push("Fabro system info check failed");
  if (!checks.settings.ok) failures.push("Fabro settings check failed");
  if (!checks.workflows.ok) failures.push("Fabro workflows check failed");
  if (checks.workflows.ok && !workflowRegistryContains(checks.workflows.body, expectedWorkflow)) {
    failures.push(`Fabro workflow registry does not include ${expectedWorkflow}`);
  }
  const settingsText = JSON.stringify(checks.settings.body || {});
  if (checks.settings.ok && !settingsText.includes("github")) {
    failures.push("Fabro GitHub integration was not visible in settings");
  }
}

const report = {
  ok: failures.length === 0,
  server: apiUrl,
  web_url: webUrl,
  expected_workflow: expectedWorkflow,
  allow_local: allowLocal,
  skipped: {
    network: skipNetwork,
    git: skipGit,
  },
  checks,
  failures,
};

const output = JSON.stringify(report, null, 2);
console.log(output);
if (!report.ok) process.exit(1);
