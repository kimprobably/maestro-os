#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { writeNormalizedResult } from "../evals/eval-lib.mjs";

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`Missing value for ${name}`);
  return value;
}

function booleanArg(name, fallback) {
  return String(argValue(name, String(fallback))).toLowerCase() === "true";
}

const config = argValue("--config", "evals/iphone-app-factory/prompt-quality.yaml");
const registryPath = argValue("--registry", "evals/iphone-app-factory/prompt-registry.json");
const outPath = resolve(argValue("--out", ".workflow/iphone-app-factory/evals/prompt-quality.json"));
const normalizedOutPath = resolve(argValue(
  "--normalized-out",
  `reports/evals/${process.env.FABRO_RUN_ID || "local"}/iphone-factory.prompt-quality.json`,
));
const allowFallback = booleanArg("--allow-fallback", true);
const acceptedRiskPromptfooFailure = booleanArg("--accepted-risk-promptfoo-failure", false);
const legacyAllowPromptfooFallbackRequested = booleanArg("--allow-promptfoo-fallback", false);
const allowPromptfooFallback = acceptedRiskPromptfooFailure;
const skipPromptfoo = booleanArg("--skip-promptfoo", false);
const timeoutMs = Number(process.env.PROMPTFOO_MAX_EVAL_TIME_MS || "120000");

function writeReport(report) {
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
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
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]{12,}/gi, "Bearer [redacted]");

  for (const key of ["OPENROUTER_API_KEY", "OPENAI_API_KEY"]) {
    const secret = process.env[key];
    if (!secret) continue;
    text = text.replaceAll(secret, "[redacted]");
  }
  return text;
}

function minimalPromptfooEnv() {
  const env = {};
  for (const key of ["PATH", "HOME", "TMPDIR", "TEMP", "USER", "LOGNAME", "SHELL", "SystemRoot", "COMSPEC"]) {
    if (process.env[key]) env[key] = process.env[key];
  }
  env.OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
  env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY || "";
  env.OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || "https://openrouter.ai/api/v1";
  env.PROMPTFOO_DISABLE_TELEMETRY = "1";
  env.PROMPTFOO_MAX_EVAL_TIME_MS = String(timeoutMs);
  env.CI = process.env.CI || "1";
  return env;
}

function promptfooCommandCheck() {
  if (skipPromptfoo) return { available: false, reason: "skipped by --skip-promptfoo" };
  const result = spawnSync("promptfoo", ["--version"], {
    encoding: "utf8",
    env: minimalPromptfooEnv(),
    timeout: 15000,
  });
  if (result.error) return { available: false, reason: result.error.code || result.error.message };
  if (result.status !== 0) return { available: false, reason: "promptfoo --version failed" };
  return { available: true, version: redactString(result.stdout || result.stderr).trim().split("\n")[0] };
}

function readPromptfooSummary() {
  const promptfooOutPath = resolve(".workflow/iphone-app-factory/evals/promptfoo-output.json");
  if (!existsSync(promptfooOutPath)) return { promptfoo_failures: [], critical_gaps: [] };

  try {
    const payload = readJson(promptfooOutPath);
    const results = Array.isArray(payload?.results?.results) ? payload.results.results : [];
    const promptfooFailures = results
      .filter((result) => result?.success === false)
      .map((result) => ({
        score: result.score ?? null,
        failure_reason: result.failureReason ?? null,
        grading_reason: result.gradingResult?.reason ?? null,
        component_failures: (result.gradingResult?.componentResults || [])
          .filter((component) => component?.pass === false)
          .map((component) => component.reason)
          .filter(Boolean),
      }));
    const text = JSON.stringify(promptfooFailures);
    const criticalGaps = [];
    if (/secret|credential|redaction/i.test(text)) criticalGaps.push("secret_redaction_mechanics");
    if (/Appium|XCUITest|deferral|simulator/i.test(text)) criticalGaps.push("appium_xcuitest_deferral_policy");
    if (/deterministic|gate|skipping testing|release criteria/i.test(text)) criticalGaps.push("deterministic_gate_enforcement");
    if (/fan.?in|review|blocking|VERDICT/i.test(text)) criticalGaps.push("review_fan_in_integrity");
    return { promptfoo_failures: promptfooFailures, critical_gaps: [...new Set(criticalGaps)] };
  } catch (error) {
    return {
      promptfoo_failures: [{ failure_reason: "could not parse promptfoo output", grading_reason: error.message }],
      critical_gaps: ["promptfoo_output_parse_failure"],
    };
  }
}

const registry = readJson(registryPath);
const fallbackFailures = [];
const configText = existsSync(config) ? readFileSync(config, "utf8") : "";
const goldenPath = "evals/iphone-app-factory/datasets/prompt-quality-golden.jsonl";
const goldenCases = existsSync(goldenPath)
  ? readFileSync(goldenPath, "utf8").split("\n").filter(Boolean).map((line) => JSON.parse(line))
  : [];
const secretPatterns = [
  /sk-or-v1-/,
  /xoxb-/,
  /xapp-/,
  /lin_api_/,
  /dtn_[a-f0-9]/i,
  /apify_api_/,
];

if (registry.workflow !== "iphone-app-factory") fallbackFailures.push("registry workflow mismatch");
if (!registry.dataset_version) fallbackFailures.push("registry missing dataset_version");
if (!registry.rubric_version) fallbackFailures.push("registry missing rubric_version");
if (!Array.isArray(registry.prompts) || registry.prompts.length < 20) fallbackFailures.push("registry missing prompt inventory");
if (!configText.includes("golden_case_results")) fallbackFailures.push("promptfoo config must require golden_case_results");
if (!configText.includes("accepted_risk")) fallbackFailures.push("promptfoo config must require accepted_risk=false");
if (!configText.includes("JSON.parse(output)")) fallbackFailures.push("promptfoo config must enforce parseable structured JSON");
for (const id of [
  "waketask-control-plane",
  "waketask-hosted-ios-evidence",
  "waketask-artifacts-metadata",
  "waketask-review-fan-in",
]) {
  if (!goldenCases.some((entry) => entry.id === id)) fallbackFailures.push(`golden dataset missing ${id}`);
}

const promptFiles = readdirSync("prompts/iphone-app-factory")
  .filter((name) => name.endsWith(".md"))
  .map((name) => `prompts/iphone-app-factory/${name}`)
  .sort();
const registeredPaths = new Set((registry.prompts || []).map((entry) => entry.path));
for (const promptFile of promptFiles) {
  if (!registeredPaths.has(promptFile)) fallbackFailures.push(`prompt registry missing ${promptFile}`);
}

for (const entry of registry.prompts || []) {
  if (!existsSync(entry.path)) {
    fallbackFailures.push(`missing prompt ${entry.path}`);
    continue;
  }
  const text = readFileSync(entry.path, "utf8");
  if (text.trim().length < 100) fallbackFailures.push(`${entry.path} is too thin`);
  for (const marker of entry.must_include || []) {
    if (!text.includes(marker)) fallbackFailures.push(`${entry.path} missing marker ${marker}`);
  }
  for (const pattern of secretPatterns) {
    if (pattern.test(text)) fallbackFailures.push(`${entry.path} appears to contain a secret pattern`);
  }
}

const workflowText = readdirSync("workflows/iphone-app-factory")
  .filter((name) => name.endsWith(".fabro"))
  .map((name) => `workflows/iphone-app-factory/${name}`)
  .map((path) => readFileSync(path, "utf8"))
  .join("\n");
for (const entry of registry.prompts || []) {
  if (!workflowText.includes(entry.path)) {
    const basename = entry.path.split("/").pop();
    if (!workflowText.includes(basename)) fallbackFailures.push(`workflow does not reference ${entry.path}`);
  }
}

let promptfooResult = null;
const promptfooMissingEnv = [];
if (!skipPromptfoo && !process.env.OPENROUTER_API_KEY) promptfooMissingEnv.push("OPENROUTER_API_KEY");
const promptfooCheck = promptfooCommandCheck();
if (promptfooCheck.available && promptfooMissingEnv.length === 0) {
  promptfooResult = spawnSync(
    "promptfoo",
    ["eval", "-c", config, "--no-progress-bar"],
    {
      encoding: "utf8",
      env: minimalPromptfooEnv(),
      timeout: timeoutMs + 15000,
    },
  );
}

const promptfooOk = Boolean(promptfooResult && promptfooResult.status === 0);
const fallbackOk = fallbackFailures.length === 0;
const promptfooFailed = Boolean(promptfooResult && promptfooResult.status !== 0);
const promptfooUnavailable = !promptfooResult;
const promptfooUnavailableReason = promptfooMissingEnv.length > 0
  ? `missing environment keys: ${promptfooMissingEnv.join(", ")}`
  : promptfooCheck.available
    ? null
    : promptfooCheck.reason;
const promptfooSummary = promptfooResult ? readPromptfooSummary() : { promptfoo_failures: [], critical_gaps: [] };
const ok = fallbackOk && (promptfooOk || allowPromptfooFallback);
const promptfooWaiverAccepted = !promptfooOk && fallbackOk && acceptedRiskPromptfooFailure;
const promptfooWaiver = promptfooWaiverAccepted
  ? {
      waiver_id: `iphone-factory.prompt-quality:${process.env.FABRO_RUN_ID || "local"}:accepted-risk-promptfoo-failure`,
      accepted_by: process.env.USER || process.env.LOGNAME || "operator",
      reason: "--accepted-risk-promptfoo-failure was supplied for this run",
      risk_statement: "The primary Promptfoo runner did not pass, so prompt quality is accepted only with explicit risk.",
      review_by: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      compensating_control: "Deterministic prompt registry, marker coverage, and golden dataset fallback checks passed.",
    }
  : null;
const report = {
  ok,
  registry_path: registryPath,
  dataset_version: registry.dataset_version,
  rubric_version: registry.rubric_version,
  prompt_count: Array.isArray(registry.prompts) ? registry.prompts.length : 0,
  prompt_file_count: promptFiles.length,
  promptfoo_attempted: Boolean(promptfooResult),
  promptfoo_ok: promptfooOk,
  promptfoo_status: promptfooResult ? promptfooResult.status : null,
  promptfoo_available: promptfooCheck.available,
  promptfoo_version: promptfooCheck.version || null,
  promptfoo_missing_env: promptfooMissingEnv,
  promptfoo_unavailable_reason: promptfooUnavailable ? promptfooUnavailableReason : null,
  promptfoo_stdout_excerpt: promptfooResult ? redactString(promptfooResult.stdout).slice(-3000) : "",
  promptfoo_stderr_excerpt: promptfooResult ? redactString(promptfooResult.stderr).slice(-3000) : "",
  allow_promptfoo_fallback: allowPromptfooFallback,
  legacy_allow_promptfoo_fallback_requested: legacyAllowPromptfooFallbackRequested,
  accepted_risk_promptfoo_failure: acceptedRiskPromptfooFailure,
  skip_promptfoo: skipPromptfoo,
  fallback_used: !promptfooOk,
  allow_fallback: allowFallback,
  fallback_ok: fallbackOk,
  fallback_failures: fallbackFailures,
  promptfoo_failures: promptfooSummary.promptfoo_failures,
  critical_gaps: promptfooSummary.critical_gaps,
};

writeReport(report);
writeNormalizedResult(normalizedOutPath, {
  eval_id: "iphone-factory.prompt-quality",
  level: "workflow",
  runner: "promptfoo",
  workflow: "iphone-app-factory",
  runner_status: promptfooOk ? "passed" : promptfooFailed ? "failed" : "skipped",
  fallback_status: promptfooOk ? "not_used" : fallbackOk ? "passed" : "failed",
  waiver_status: promptfooWaiverAccepted ? "accepted" : "none",
  score: promptfooOk ? 1 : promptfooFailed ? 0 : null,
  artifact_uris: [outPath, config],
  metadata: {
    promptfoo_status: report.promptfoo_status,
    fallback_failures: fallbackFailures,
    promptfoo_missing_env: promptfooMissingEnv,
    accepted_risk_promptfoo_failure: acceptedRiskPromptfooFailure,
    ...(promptfooWaiver ? { waiver: promptfooWaiver } : {}),
  },
});
if (!ok) process.exit(1);
