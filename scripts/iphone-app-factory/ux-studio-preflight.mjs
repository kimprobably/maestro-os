#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const RAILWAY_WEB_URL = "https://fabro-maestro-production.up.railway.app";
const RAILWAY_API_URL = `${RAILWAY_WEB_URL}/api/v1`;
const REPORT_PATH = ".workflow/iphone-app-ux-studio/preflight.json";

const REQUIRED_TOOLS = ["node", "npm", "gh", "fabro", "codex", "claude", "promptfoo", "qlty"];
const NETWORK_TARGETS = [
  "https://api.github.com/rate_limit",
  "https://apps.apple.com/",
  "https://developer.apple.com/design/human-interface-guidelines/",
  "https://mobbin.com/mcp",
  "https://api.mobbin.com/mcp",
  "https://pageflows.com/",
  "https://www.reddit.com/",
];

const ENV_GROUPS = [
  ["OPENROUTER_API_KEY"],
  ["APIFY_TOKEN"],
  ["GITHUB_TOKEN", "GH_TOKEN"],
  ["CLAUDE_CODE_OAUTH_TOKEN", "CLAUDE_CODE_CREDENTIALS_JSON_BASE64"],
  ["CODEX_AUTH_JSON_BASE64"],
  ["MOBBIN_EMAIL"],
  ["MOBBIN_PASSWORD"],
];

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
  const trimmed = String(value || RAILWAY_API_URL).trim();
  try {
    const url = scrubUrlForUse(trimmed);
    const path = url.pathname.replace(/\/+$/, "");
    url.pathname = path.endsWith("/api/v1") ? path : `${path}/api/v1`;
    return url.toString();
  } catch {
    const withoutQueryOrHash = trimmed.split(/[?#]/, 1)[0].replace(/\/+$/, "");
    if (withoutQueryOrHash.endsWith("/api/v1")) return withoutQueryOrHash;
    return `${withoutQueryOrHash}/api/v1`;
  }
}

function webUrlFromApi(apiUrl) {
  return apiUrl.replace(/\/api\/v1$/, "");
}

function normalizeWebUrl(value) {
  const trimmed = String(value || RAILWAY_WEB_URL).trim();
  try {
    const url = scrubUrlForUse(trimmed);
    const path = url.pathname.replace(/\/+$/, "");
    url.pathname = path || "/";
    const sanitized = url.toString();
    if (url.pathname === "/") return sanitized.replace(/\/(?=[?#]|$)/, "");
    return sanitized.replace(/\/+$/, "");
  } catch {
    return trimmed.split(/[?#]/, 1)[0].replace(/\/+$/, "");
  }
}

function scrubUrlForUse(value) {
  const url = new URL(value);
  url.username = "";
  url.password = "";
  url.search = "";
  url.hash = "";
  return url;
}

function hostnameFor(url) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function isLocalUrl(url) {
  const host = hostnameFor(url);
  return host === "localhost" || host === "127.0.0.1";
}

function isRailwayFabroUrl(url) {
  return hostnameFor(url) === "fabro-maestro-production.up.railway.app";
}

function sanitizedUrlForReport(value) {
  try {
    const url = scrubUrlForUse(value);
    const raw = String(value);
    const hadRootTrailingSlash = url.pathname === "/" && raw.replace(/[?#].*$/, "").endsWith("/");
    const sanitized = url.toString();
    if (url.pathname === "/" && !hadRootTrailingSlash) {
      return sanitized.replace(/\/(?=[?#]|$)/, "");
    }
    return sanitized;
  } catch {
    return "[invalid-url]";
  }
}

function envPresent(name) {
  const value = process.env[name] || "";
  return Boolean(value && !value.includes("{{") && !value.includes("}}"));
}

function checkEnvGroups(groups) {
  const missing = [];
  const present = [];
  for (const group of groups) {
    if (group.some(envPresent)) {
      present.push(group.join(" or "));
    } else {
      missing.push(group.join(" or "));
    }
  }
  return { missing, present_count: present.length };
}

function run(command, args = [], options = {}) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    timeout: options.timeout || 30000,
    stdio: ["ignore", "pipe", "pipe"],
  });
  return {
    ok: result.status === 0,
    status: result.status,
    stdout: (result.stdout || "").trim(),
    stderr: (result.stderr || "").trim(),
    error: result.error ? result.error.message : null,
  };
}

function toolReport() {
  const checks = {};
  for (const tool of REQUIRED_TOOLS) {
    const result = run(tool, ["--version"], { timeout: 15000 });
    checks[tool] = {
      ok: result.ok,
      status: result.status,
      version: result.ok ? result.stdout.split("\n")[0].slice(0, 120) : null,
      error: result.ok ? null : result.error || result.stderr.split("\n")[0].slice(0, 160) || "command failed",
    };
  }
  return checks;
}

function gitReport() {
  const branch = run("git", ["branch", "--show-current"], { timeout: 15000 });
  const upstream = run("git", ["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"], { timeout: 15000 });
  return {
    git_available: branch.ok,
    branch: branch.stdout || null,
    has_upstream: upstream.ok,
    upstream: upstream.ok ? upstream.stdout : null,
  };
}

async function fetchStatus(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url, {
      redirect: "manual",
      signal: controller.signal,
      headers: {
        "user-agent": "maestro-ux-studio-preflight/1.0",
      },
    });
    return {
      url,
      ok: response.status >= 200 && response.status < 500,
      status: response.status,
      redirected: response.status >= 300 && response.status < 400,
    };
  } catch (error) {
    return {
      url,
      ok: false,
      status: null,
      error: error.message,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function networkReport() {
  const checks = [];
  for (const target of NETWORK_TARGETS) {
    checks.push(await fetchStatus(target));
  }
  return checks;
}

function mobbinMcpReport() {
  const result = run("claude", ["mcp", "list"], { timeout: 15000 });
  if (!result.ok) {
    return {
      mobbin_mcp_configured: false,
      mobbin_mcp_authorized: false,
      mobbin_mcp_check: {
        ok: false,
        status: result.status,
      },
    };
  }

  const output = `${result.stdout}\n${result.stderr}`;
  const hasMobbin = /mobbin/i.test(output);
  const hasUnauthorized = /(unauthori[sz]ed|not authorized|login required|oauth required|needs auth)/i.test(output);
  return {
    mobbin_mcp_configured: hasMobbin,
    mobbin_mcp_authorized: hasMobbin && !hasUnauthorized,
    mobbin_mcp_check: {
      ok: true,
      status: result.status,
    },
  };
}

function writeReport(report) {
  mkdirSync(join(process.cwd(), ".workflow/iphone-app-ux-studio"), { recursive: true });
  writeFileSync(join(process.cwd(), REPORT_PATH), `${JSON.stringify(report, null, 2)}\n`);
}

function printReport(report) {
  console.log(JSON.stringify(report, null, 2));
}

const allowLocal = hasFlag("--allow-local");
const skipNetwork = hasFlag("--skip-network");
const skipTools = hasFlag("--skip-tools");
const skipGit = hasFlag("--skip-git");
const skipMobbinMcp = hasFlag("--skip-mobbin-mcp");
const useMobbinMcp = String(argValue("--use-mobbin-mcp", process.env.UX_USE_MOBBIN_MCP || "true")).toLowerCase() !== "false";

const apiUrl = normalizeApiUrl(argValue("--server", process.env.FABRO_SERVER || RAILWAY_API_URL));
const webUrl = normalizeWebUrl(argValue("--web-url", process.env.FABRO_WEB_URL || webUrlFromApi(apiUrl)));
const failures = [];
const checks = {};

if (!allowLocal && (isLocalUrl(apiUrl) || isLocalUrl(webUrl))) {
  failures.push("FABRO_SERVER points at local Fabro; Railway-hosted Fabro is required unless --allow-local is set");
}
if (!allowLocal && (!isRailwayFabroUrl(apiUrl) || !isRailwayFabroUrl(webUrl))) {
  failures.push("FABRO_SERVER must use the Railway-hosted Fabro URL unless --allow-local is set");
}

const envGroups = useMobbinMcp
  ? ENV_GROUPS
  : ENV_GROUPS.filter((group) => !group.some((key) => key.startsWith("MOBBIN_")));
checks.env = checkEnvGroups(envGroups);
if (checks.env.missing.length > 0) {
  failures.push(`missing environment keys: ${checks.env.missing.join(", ")}`);
}

checks.mobbin_mcp_configured = false;
checks.mobbin_mcp_authorized = false;
checks.mobbin_mcp_check = { ok: false, skipped: true };
if (!skipTools) {
  checks.tools = toolReport();
  for (const [tool, result] of Object.entries(checks.tools)) {
    if (!result.ok) failures.push(`missing required tool: ${tool}`);
  }
}

if (useMobbinMcp && !skipMobbinMcp) {
  Object.assign(checks, mobbinMcpReport());
}

if (!skipGit) {
  checks.git = gitReport();
  if (!checks.git.git_available) failures.push("git is not available");
  if (!checks.git.has_upstream) failures.push("current branch has no upstream");
}

if (!skipNetwork) {
  checks.network = await networkReport();
  for (const target of checks.network) {
    if (!target.ok) failures.push(`network target failed: ${target.url}`);
  }
}

const report = {
  ok: failures.length === 0,
  server: sanitizedUrlForReport(apiUrl),
  web_url: sanitizedUrlForReport(webUrl),
  allow_local: allowLocal,
  skipped: {
    network: skipNetwork,
    tools: skipTools,
    git: skipGit,
    mobbin_mcp: skipMobbinMcp || !useMobbinMcp,
  },
  checks,
  failures,
};

writeReport(report);
printReport(report);
if (!report.ok) process.exit(1);
