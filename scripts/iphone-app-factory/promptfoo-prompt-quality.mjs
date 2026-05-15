#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";

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
const allowFallback = booleanArg("--allow-fallback", true);
const acceptedRiskPromptfooFailure = booleanArg("--accepted-risk-promptfoo-failure", false);
const allowPromptfooFallback = acceptedRiskPromptfooFailure || booleanArg("--allow-promptfoo-fallback", false);
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

const workflowText = existsSync("workflows/iphone-app-factory/build-iphone-app.fabro")
  ? readFileSync("workflows/iphone-app-factory/build-iphone-app.fabro", "utf8")
  : "";
for (const entry of registry.prompts || []) {
  if (!workflowText.includes(entry.path)) {
    const basename = entry.path.split("/").pop();
    if (!workflowText.includes(basename)) fallbackFailures.push(`workflow does not reference ${entry.path}`);
  }
}

const promptfooAvailable = !skipPromptfoo && spawnSync("sh", ["-lc", "command -v npx >/dev/null 2>&1"], {
  encoding: "utf8",
}).status === 0;

let promptfooResult = null;
if (promptfooAvailable) {
  promptfooResult = spawnSync(
    "sh",
    ["-lc", `npx -y promptfoo@latest eval -c ${JSON.stringify(config)} --no-progress-bar`],
    {
      encoding: "utf8",
      env: {
        ...process.env,
        OPENAI_API_KEY: process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY || "",
        OPENAI_BASE_URL: process.env.OPENAI_BASE_URL || "https://openrouter.ai/api/v1",
        PROMPTFOO_DISABLE_TELEMETRY: "1",
      },
      timeout: timeoutMs + 15000,
    },
  );
}

const promptfooOk = Boolean(promptfooResult && promptfooResult.status === 0);
const fallbackOk = fallbackFailures.length === 0;
const promptfooFailed = Boolean(promptfooResult && promptfooResult.status !== 0);
const promptfooUnavailable = !promptfooResult;
const promptfooSummary = readPromptfooSummary();
const ok = fallbackOk && (!promptfooUnavailable || allowFallback) && (!promptfooFailed || allowPromptfooFallback);
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
  promptfoo_stdout_excerpt: promptfooResult ? promptfooResult.stdout.slice(-3000) : "",
  promptfoo_stderr_excerpt: promptfooResult ? promptfooResult.stderr.slice(-3000) : "",
  allow_promptfoo_fallback: allowPromptfooFallback,
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
if (!ok) process.exit(1);
