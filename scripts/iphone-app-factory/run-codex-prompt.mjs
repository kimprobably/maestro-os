#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { homedir } from "node:os";

function argValue(name, fallback = null) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`Missing value for ${name}`);
  return value;
}

function secretQueryParameterName(name) {
  let decoded = String(name).replace(/\+/g, " ");
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    decoded = String(name);
  }
  const normalized = decoded
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return normalized
    .split("_")
    .some((part) => ["auth", "authorization", "credential", "key", "password", "secret", "signature", "token"].includes(part));
}

function redactString(value) {
  let text = String(value || "")
    .replace(/\b([a-z][a-z0-9+.-]*:\/\/)([^/?#\s"'<>@]+@)/gi, "$1[redacted]@")
    .replace(/([?#&])([^=&#\s]+)=([^&#\s]*)/g, (match, separator, name) => {
      if (!secretQueryParameterName(name)) return match;
      return `${separator}${name}=[redacted]`;
    })
    .replace(/sk-or-v1-[A-Za-z0-9_-]+/g, "[redacted]")
    .replace(/xox[baprs]-[A-Za-z0-9-]+/g, "[redacted]")
    .replace(/xapp-[A-Za-z0-9-]+/g, "[redacted]")
    .replace(/lin_api_[A-Za-z0-9_-]+/g, "[redacted]")
    .replace(/apify_api_[A-Za-z0-9_-]+/g, "[redacted]")
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]{12,}/gi, "Bearer [redacted]")
    .replace(
      /\b(?:api[_-]?key|secret|password|passwd|token|access[_-]?token|refresh[_-]?token|client[_-]?secret)\b\s*[:=]\s*["']?[A-Za-z0-9_./+=:@-]{8,}/gi,
      "[redacted]",
    );

  for (const key of [
    "OPENROUTER_API_KEY",
    "OPENAI_API_KEY",
    "CODEX_AUTH_JSON_BASE64",
    "CODEX_MCP_CREDENTIALS_JSON_BASE64",
    "CLAUDE_CODE_OAUTH_TOKEN",
    "CLAUDE_CODE_CREDENTIALS_JSON_BASE64",
    "GITHUB_TOKEN",
    "GH_TOKEN",
    "APIFY_TOKEN",
    "MOBBIN_EMAIL",
    "MOBBIN_PASSWORD",
  ]) {
    const secret = process.env[key];
    if (!secret) continue;
    text = text.replaceAll(secret, "[redacted]");
  }
  return text;
}

function envValueForInput(name, fallback) {
  if (secretInputName(name)) return "[redacted]";
  const envName = name.replace(/[^a-zA-Z0-9]+/g, "_").toUpperCase();
  return process.env[`UX_${envName}`] || process.env[envName] || fallback || "";
}

function secretInputName(name) {
  return /(^|_)(auth|authorization|credential|key|password|secret|signature|token|cookie|session|oauth|private)(_|$)/i.test(
    String(name || ""),
  );
}

function renderPrompt(raw) {
  return raw.replace(
    /\{\{\s*inputs\.([a-zA-Z0-9_]+)\s*\|\s*default\(\s*(["'])(.*?)\2\s*\)\s*\}\}/g,
    (_match, name, _quote, fallback) => envValueForInput(name, fallback),
  );
}

function writeReport(path, report) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(report, null, 2)}\n`);
}

function codexAuthPath() {
  const codexHome = process.env.CODEX_HOME || join(process.env.HOME || homedir(), ".codex");
  return join(codexHome, "auth.json");
}

function installCodexAuthFromEnv() {
  const encoded = process.env.CODEX_AUTH_JSON_BASE64 || "";
  if (!encoded || encoded.includes("{{") || encoded.includes("}}")) return false;
  const raw = Buffer.from(encoded, "base64").toString("utf8");
  JSON.parse(raw);
  const authPath = codexAuthPath();
  mkdirSync(dirname(authPath), { recursive: true });
  writeFileSync(authPath, raw, { mode: 0o600 });
  return true;
}

function installCodexMcpCredentialsFromEnv() {
  const encoded = process.env.CODEX_MCP_CREDENTIALS_JSON_BASE64 || "";
  if (!encoded || encoded.includes("{{") || encoded.includes("}}")) return false;
  const decoded = Buffer.from(encoded, "base64").toString("utf8");
  JSON.parse(decoded);
  const codexHome = process.env.CODEX_HOME || join(process.env.HOME || homedir(), ".codex");
  mkdirSync(codexHome, { recursive: true });
  writeFileSync(join(codexHome, ".credentials.json"), decoded, { mode: 0o600 });
  return true;
}

function wantsMobbinMcp(stageName) {
  return String(process.env.UX_USE_MOBBIN_MCP || "true").toLowerCase() !== "false"
    && /mobbin/i.test(stageName || "");
}

function ensureCodexMobbinMcp(stageName) {
  if (!wantsMobbinMcp(stageName)) {
    return { configured: false, skipped: true, status: null };
  }
  const mcpConfig = ["-c", "mcp_oauth_credentials_store=\"file\""];
  const add = spawnSync("codex", [...mcpConfig, "mcp", "add", "mobbin", "--url", "https://api.mobbin.com/mcp"], {
    encoding: "utf8",
    timeout: 30000,
    stdio: ["ignore", "pipe", "pipe"],
  });
  const list = spawnSync("codex", [...mcpConfig, "mcp", "list"], {
    encoding: "utf8",
    timeout: 15000,
    stdio: ["ignore", "pipe", "pipe"],
  });
  const text = `${list.stdout || ""}\n${list.stderr || ""}`;
  return {
    configured: /mobbin/i.test(text),
    skipped: false,
    status: list.status,
    add_status: add.status,
  };
}

const promptPath = resolve(argValue("--prompt"));
const stage = argValue("--stage", "codex-prompt");
const model = argValue("--model", "gpt-5.3-codex");
const outPath = resolve(argValue("--out", `.workflow/iphone-app-ux-studio/codex/${stage}.json`));
const renderedPromptPath = resolve(argValue("--rendered-prompt-out", `.workflow/iphone-app-ux-studio/codex/${stage}.prompt.md`));
const lastMessagePath = resolve(argValue("--last-message-out", `.workflow/iphone-app-ux-studio/codex/${stage}.last-message.md`));
const timeoutMs = Number(argValue("--timeout-ms", process.env.CODEX_EXEC_TIMEOUT_MS || "3600000"));
const maxBuffer = Number(argValue("--max-buffer", process.env.CODEX_EXEC_MAX_BUFFER || `${100 * 1024 * 1024}`));

const failures = [];
let codexAuthInstalled = false;
let codexMcpCredentialsInstalled = false;
let codexMobbinMcp = { configured: false, skipped: true, status: null };
if (!existsSync(promptPath)) failures.push(`missing prompt file: ${promptPath}`);
try {
  codexAuthInstalled = installCodexAuthFromEnv();
} catch {
  failures.push("CODEX_AUTH_JSON_BASE64 could not be installed");
}
try {
  codexMcpCredentialsInstalled = installCodexMcpCredentialsFromEnv();
} catch {
  failures.push("CODEX_MCP_CREDENTIALS_JSON_BASE64 could not be installed");
}
try {
  codexMobbinMcp = ensureCodexMobbinMcp(stage);
  if (!codexMobbinMcp.skipped && !codexMobbinMcp.configured) failures.push("Mobbin MCP could not be configured for Codex CLI");
} catch {
  failures.push("Mobbin MCP setup failed for Codex CLI");
}

let renderedPrompt = "";
if (failures.length === 0) {
  renderedPrompt = renderPrompt(readFileSync(promptPath, "utf8"));
  const header = [
    "You are running inside a Daytona/Fabro worker for the iPhone App UX Studio workflow.",
    `Stage: ${stage}`,
    `App directory: ${process.env.APP_DIR || process.env.UX_APP_DIR || "apps/generated-iphone-app"}`,
    "Do not print secrets or environment values. Use repository files and evidence artifacts for state.",
    "",
  ].join("\n");
  renderedPrompt = `${header}${renderedPrompt}`;
  mkdirSync(dirname(renderedPromptPath), { recursive: true });
  writeFileSync(renderedPromptPath, renderedPrompt);
}

let result = null;
if (failures.length === 0) {
  const args = [
    "exec",
    "--skip-git-repo-check",
    "--dangerously-bypass-approvals-and-sandbox",
    "-c",
    "mcp_oauth_credentials_store=\"file\"",
    "--model",
    model,
    "--cd",
    process.cwd(),
    "--output-last-message",
    lastMessagePath,
    "-",
  ];
  result = spawnSync("codex", args, {
    input: renderedPrompt,
    encoding: "utf8",
    timeout: timeoutMs,
    maxBuffer,
    stdio: ["pipe", "pipe", "pipe"],
  });

  if (result.error) failures.push(`codex exec failed: ${result.error.code || result.error.message}`);
  if (result.status !== 0) failures.push(`codex exec exited with status ${result.status}`);
  if (result.signal) failures.push(`codex exec terminated by signal ${result.signal}`);
}

const report = {
  ok: failures.length === 0,
  stage,
  model,
  prompt_path: promptPath,
  rendered_prompt_path: renderedPromptPath,
  last_message_path: lastMessagePath,
  status: result ? result.status : null,
  signal: result ? result.signal || null : null,
  stdout_excerpt: result ? redactString(result.stdout).slice(-3000) : "",
  stderr_excerpt: result ? redactString(result.stderr).slice(-3000) : "",
  codex_auth_installed: codexAuthInstalled,
  codex_mcp_credentials_installed: codexMcpCredentialsInstalled,
  codex_mobbin_mcp: codexMobbinMcp,
  failures,
};

writeReport(outPath, report);

if (!report.ok) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(report));
