#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const RAILWAY_WEB_URL = "https://fabro-maestro-production.up.railway.app";
const RAILWAY_API_URL = `${RAILWAY_WEB_URL}/api/v1`;
const REPORT_PATH = ".workflow/existing-app-feature/preflight/workflow-preflight.json";

function argValue(name, fallback = "") {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`Missing value for ${name}`);
  return value;
}

function normalizeApiUrl(value) {
  const trimmed = String(value || RAILWAY_API_URL).replace(/\/+$/, "");
  return trimmed.endsWith("/api/v1") ? trimmed : `${trimmed}/api/v1`;
}

function webUrlFromApi(apiUrl) {
  return apiUrl.replace(/\/api\/v1$/, "");
}

function hostnameFor(url) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function isRailwayFabroUrl(url) {
  return hostnameFor(url) === "fabro-maestro-production.up.railway.app";
}

function isLocalUrl(url) {
  const hostname = hostnameFor(url);
  return hostname === "localhost" || hostname === "127.0.0.1";
}

function envPresent(name) {
  const value = process.env[name] || "";
  return Boolean(value && !value.includes("{{") && !value.includes("}}"));
}

function groupPresent(group) {
  return group.some(envPresent);
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

function parseList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

async function fetchHealth(webUrl) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${webUrl}/health`, { signal: controller.signal });
    const text = await response.text();
    return { ok: response.ok, status: response.status, body_excerpt: text.slice(0, 120) };
  } catch (error) {
    return { ok: false, status: null, error: error.message };
  } finally {
    clearTimeout(timeout);
  }
}

function contextReport(contextPaths) {
  const checks = [];
  const failures = [];
  const warnings = [];
  for (const contextPath of contextPaths) {
    const absoluteLocal = contextPath.startsWith("/Users/") || contextPath.startsWith("/home/");
    const exists = existsSync(contextPath);
    const check = {
      path: contextPath,
      exists,
      repo_relative: !contextPath.startsWith("/"),
      png_count: 0,
      manifest_present: false,
      manifest_valid: false,
    };
    if (absoluteLocal) failures.push(`context path must be repo-relative: ${contextPath}`);
    if (!exists) failures.push(`missing context path: ${contextPath}`);
    if (exists && contextPath.includes("screenshots")) {
      const files = readdirSync(contextPath);
      check.png_count = files.filter((file) => file.toLowerCase().endsWith(".png")).length;
      check.manifest_present = existsSync(join(contextPath, "manifest.json"));
      if (check.manifest_present) {
        try {
          JSON.parse(readFileSync(join(contextPath, "manifest.json"), "utf8"));
          check.manifest_valid = true;
        } catch {
          failures.push(`invalid screenshot manifest: ${contextPath}/manifest.json`);
        }
      }
      if (check.png_count === 0) warnings.push(`screenshot context has no PNG files: ${contextPath}`);
      if (!check.manifest_present) warnings.push(`screenshot context has no manifest: ${contextPath}`);
    }
    checks.push(check);
  }
  if (contextPaths.length === 0) warnings.push("FEATURE_CONTEXT_PATHS is empty; downstream stages must rely on repository defaults");
  return { checks, failures, warnings };
}

async function fetchGithubCredentialStatus(name, token, repo) {
  if (!token || token.includes("{{") || token.includes("}}")) {
    return { name, present: false, ok: false, status: null, endpoint: null };
  }
  const endpoint = repo
    ? `https://api.github.com/repos/${repo}/actions/workflows/ios-quality.yml`
    : "https://api.github.com/user";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(endpoint, {
      signal: controller.signal,
      headers: {
        accept: "application/vnd.github+json",
        authorization: `Bearer ${token}`,
        "user-agent": "maestro-feature-workflow-preflight/1.0",
      },
    });
    return {
      name,
      present: true,
      ok: response.ok,
      status: response.status,
      endpoint: repo ? "repo_actions_workflow" : "user",
    };
  } catch (error) {
    return {
      name,
      present: true,
      ok: false,
      status: null,
      endpoint: repo ? "repo_actions_workflow" : "user",
      error: error.message,
    };
  } finally {
    clearTimeout(timeout);
  }
}

const apiUrl = normalizeApiUrl(argValue("--server", process.env.FABRO_SERVER || RAILWAY_API_URL));
const webUrl = webUrlFromApi(apiUrl);
const contextPaths = parseList(argValue("--context-paths", process.env.FEATURE_CONTEXT_PATHS || ""));
const useMobbinMcp = String(argValue("--use-mobbin-mcp", process.env.UX_USE_MOBBIN_MCP || "true")).toLowerCase() !== "false";
const githubRepo = githubRepoFromUrl(process.env.FEATURE_GITHUB_REPO || process.env.UX_REPO_URL || "");
const failures = [];
const warnings = [];

if (isLocalUrl(apiUrl) || !isRailwayFabroUrl(apiUrl)) {
  failures.push("feature workflow must use Railway-hosted Fabro");
}

const requiredFiles = [
  "workflows/iphone-app-factory/iterate-existing-app-features.fabro",
  "workflows/iphone-app-factory/feature-context-intake-stage.fabro",
  "workflows/iphone-app-factory/feature-research-stage.fabro",
  "workflows/iphone-app-factory/feature-existing-app-audit-stage.fabro",
  "workflows/iphone-app-factory/feature-spec-stage.fabro",
  "workflows/iphone-app-factory/feature-implementation-plan-stage.fabro",
  "workflows/iphone-app-factory/feature-implementation-stage.fabro",
  "workflows/iphone-app-factory/feature-validation-stage.fabro",
  "workflows/iphone-app-factory/feature-publish-postmortem-stage.fabro",
];
for (const file of requiredFiles) {
  if (!existsSync(file)) failures.push(`missing workflow file: ${file}`);
}

const contexts = contextReport(contextPaths);
failures.push(...contexts.failures);
warnings.push(...contexts.warnings);

const credentialGroups = {
  openrouter: [["OPENROUTER_API_KEY"]],
  github: [["GITHUB_TOKEN", "GH_TOKEN"]],
  codex: [["CODEX_AUTH_JSON_BASE64"]],
  apify: [["APIFY_TOKEN"]],
  claude: [["CLAUDE_CODE_OAUTH_TOKEN", "CLAUDE_CODE_CREDENTIALS_JSON_BASE64"]],
  mobbin_mcp: [["CODEX_MCP_CREDENTIALS_JSON_BASE64"]],
};
const credentialPresence = {};
for (const [name, groups] of Object.entries(credentialGroups)) {
  credentialPresence[name] = groups.some(groupPresent);
}
if (useMobbinMcp && !credentialPresence.mobbin_mcp) {
  warnings.push("CODEX_MCP_CREDENTIALS_JSON_BASE64 is not present; Mobbin MCP research should record a gap and use durable screenshots/design corpus instead of failing preflight");
}

const githubCredentialChecks = await Promise.all(
  ["GITHUB_TOKEN", "GH_TOKEN"].map((name) => fetchGithubCredentialStatus(name, process.env[name] || "", githubRepo)),
);
if (!credentialPresence.github) {
  failures.push("GITHUB_TOKEN or GH_TOKEN is required for app branch publishing and GitHub Actions validation");
}
for (const check of githubCredentialChecks) {
  if (check.present && !check.ok) {
    failures.push(`${check.name} failed GitHub credential validation with status ${check.status || "error"}`);
  }
}

const health = await fetchHealth(webUrl);
if (!health.ok) failures.push(`Railway Fabro health check failed: ${webUrl}/health`);

const report = {
  ok: failures.length === 0,
  artifact: REPORT_PATH,
  log: ".workflow/existing-app-feature/preflight/workflow-preflight.log",
  gate: "feature-workflow-contract",
  next_action: "context-intake-child",
  failure_classification: failures.length ? "workflow-preflight" : "none",
  server: apiUrl,
  web_url: webUrl,
  use_mobbin_mcp: useMobbinMcp,
  checks: {
    health,
    contexts: contexts.checks,
    credential_presence: credentialPresence,
    github_credentials: githubCredentialChecks,
  },
  warnings,
  failures,
};

mkdirSync(dirname(REPORT_PATH), { recursive: true });
writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exit(1);
