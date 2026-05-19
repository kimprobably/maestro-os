#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const RAILWAY_WEB_URL = "https://fabro-maestro-production.up.railway.app";
const RAILWAY_API_URL = `${RAILWAY_WEB_URL}/api/v1`;
const REPORT_PATH = ".workflow/object-proof-program/preflight/workflow-preflight.json";

function argValue(name, fallback = "") {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`Missing value for ${name}`);
  return value;
}

function parseList(value) {
  return String(value || "")
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
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

function envPresent(name) {
  const value = process.env[name] || "";
  return Boolean(value && !value.includes("{{") && !value.includes("}}"));
}

function groupPresent(keys) {
  return keys.some(envPresent);
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
  const failures = [];
  const warnings = [];
  const checks = [];
  for (const contextPath of contextPaths) {
    const exists = existsSync(contextPath);
    const check = {
      path: contextPath,
      exists,
      repo_relative: !contextPath.startsWith("/"),
      png_count: 0,
      manifest_present: false,
      manifest_valid: false,
    };
    if (contextPath.startsWith("/")) failures.push(`context path must be repo-relative: ${contextPath}`);
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
      } else {
        warnings.push(`screenshot context has no manifest: ${contextPath}`);
      }
    }
    checks.push(check);
  }
  if (contextPaths.length === 0) warnings.push("object-proof context paths are empty");
  return { failures, warnings, checks };
}

const apiUrl = normalizeApiUrl(argValue("--server", process.env.FABRO_SERVER || RAILWAY_API_URL));
const webUrl = webUrlFromApi(apiUrl);
const contextPaths = parseList(argValue("--context-paths", process.env.OBJECT_PROOF_CONTEXT_PATHS || process.env.FEATURE_CONTEXT_PATHS || ""));
const failures = [];
const warnings = [];

if (hostnameFor(apiUrl) !== "fabro-maestro-production.up.railway.app") {
  failures.push("object proof program must use Railway-hosted Fabro");
}
if (["localhost", "127.0.0.1"].includes(hostnameFor(apiUrl))) {
  failures.push("object proof program must not target local Fabro");
}

const requiredFiles = [
  "workflows/iphone-app-factory/waketask-object-proof-program.fabro",
  "workflows/iphone-app-factory/waketask-object-proof-program.railway.toml",
  "workflows/iphone-app-factory/object-proof-program-preflight-stage.fabro",
  "workflows/iphone-app-factory/object-proof-program-spec-stage.fabro",
  "workflows/iphone-app-factory/object-proof-barcode-stage.fabro",
  "workflows/iphone-app-factory/object-proof-barcode-learning-stage.fabro",
  "workflows/iphone-app-factory/object-proof-preset-vision-stage.fabro",
  "workflows/iphone-app-factory/object-proof-preset-vision-learning-stage.fabro",
  "workflows/iphone-app-factory/object-proof-same-object-stage.fabro",
  "workflows/iphone-app-factory/object-proof-same-object-learning-stage.fabro",
  "workflows/iphone-app-factory/object-proof-publish-postmortem-stage.fabro",
  "prompts/iphone-app-factory/object-proof-program-spec.md",
  "prompts/iphone-app-factory/object-proof-stage-implementation.md",
  "prompts/iphone-app-factory/object-proof-stage-learning.md",
  "prompts/iphone-app-factory/object-proof-program-final-postmortem.md",
  "scripts/iphone-app-factory/test-object-proof-program-workflow-contract.mjs",
  "scripts/iphone-app-factory/object-proof-program-preflight.mjs",
  "scripts/iphone-app-factory/object-proof-program-spec-gate.mjs",
  "scripts/iphone-app-factory/object-proof-stage-gate.mjs",
  "scripts/iphone-app-factory/object-proof-learning-gate.mjs",
  "scripts/iphone-app-factory/object-proof-final-gate.mjs",
  "docs/IPHONE-APP-OBJECT-PROOF-PROGRAM-WORKFLOW.md",
];
for (const file of requiredFiles) {
  if (!existsSync(file)) failures.push(`missing required object proof file: ${file}`);
}

const contexts = contextReport(contextPaths);
failures.push(...contexts.failures);
warnings.push(...contexts.warnings);

const credentialPresence = {
  openrouter: groupPresent(["OPENROUTER_API_KEY"]),
  github: groupPresent(["GITHUB_TOKEN", "GH_TOKEN"]),
  codex: groupPresent(["CODEX_AUTH_JSON_BASE64"]),
  claude: groupPresent(["CLAUDE_CODE_OAUTH_TOKEN", "CLAUDE_CODE_CREDENTIALS_JSON_BASE64"]),
  mobbin_mcp: groupPresent(["CODEX_MCP_CREDENTIALS_JSON_BASE64"]),
};
if (!credentialPresence.github) warnings.push("GitHub token not present; final branch publish may fail");
if (!credentialPresence.codex) failures.push("CODEX_AUTH_JSON_BASE64 is required for implementation stages");

const health = await fetchHealth(webUrl);
if (!health.ok) failures.push(`Railway Fabro health check failed: ${webUrl}/health`);

const report = {
  ok: failures.length === 0,
  artifact: REPORT_PATH,
  gate: "object-proof-program-preflight",
  next_action: "program-spec-child",
  failure_classification: failures.length ? "workflow-preflight" : "none",
  server: apiUrl,
  web_url: webUrl,
  stages: ["barcode", "preset_vision", "same_object"],
  checks: {
    health,
    contexts: contexts.checks,
    credential_presence: credentialPresence,
  },
  warnings,
  failures,
};

mkdirSync(dirname(REPORT_PATH), { recursive: true });
writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exit(1);
