#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
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

const config = argValue("--config", "evals/workflow-quality/enhancement-discovery.yaml");
const outPath = resolve(argValue("--out", ".workflow/enhancement-discovery/evals/promptfoo-workflow-quality.json"));
const normalizedOutPath = resolve(argValue(
  "--normalized-out",
  `reports/evals/${process.env.FABRO_RUN_ID || "local"}/enhancement-discovery.workflow-quality.json`,
));
const allowFallback = booleanArg("--allow-fallback", true);
const timeoutMs = Number(process.env.PROMPTFOO_MAX_EVAL_TIME_MS || "120000");

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

function writeReport(report) {
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
}

const promptfooAvailable = spawnSync("sh", ["-lc", "command -v npx >/dev/null 2>&1"], {
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

const contractReportPaths = [
  ".workflow/enhancement-discovery/evals/spec-contract.json",
  ".workflow/enhancement-discovery/evals/architecture-contract.json",
  ".workflow/enhancement-discovery/evals/workflow-contract.json",
];
const contractReports = contractReportPaths.map((path) => readJson(path)).filter(Boolean);
const generatedValidation = readJson(".workflow/enhancement-discovery/generated-workflow-validation.json");

const fallbackFailures = [];
if (contractReports.length < 3) fallbackFailures.push("missing contract eval reports");
for (const report of contractReports) {
  if (!report.ok) fallbackFailures.push(`${report.stage} contract eval rejected`);
  if (!report.lineage?.dataset_sha256) fallbackFailures.push(`${report.stage} missing dataset lineage`);
  if (!report.baseline || typeof report.baseline.delta !== "number") {
    fallbackFailures.push(`${report.stage} missing baseline delta`);
  }
}
if (!generatedValidation?.ok) fallbackFailures.push("generated workflow validation did not pass");

const promptfooOk = Boolean(promptfooResult && promptfooResult.status === 0);
const promptfooFailed = Boolean(promptfooResult && promptfooResult.status !== 0);
const fallbackOk = fallbackFailures.length === 0;
const ok = promptfooOk || (allowFallback && fallbackOk);
const report = {
  ok,
  promptfoo_attempted: Boolean(promptfooResult),
  promptfoo_status: promptfooResult ? promptfooResult.status : null,
  promptfoo_stdout_excerpt: promptfooResult ? promptfooResult.stdout.slice(-3000) : "",
  promptfoo_stderr_excerpt: promptfooResult ? promptfooResult.stderr.slice(-3000) : "",
  fallback_used: !promptfooOk,
  fallback_ok: fallbackOk,
  fallback_failures: fallbackFailures,
  contract_reports: contractReports.map((row) => ({
    stage: row.stage,
    score: row.selected?.score,
    dataset_version: row.lineage?.dataset_version,
    rubric_version: row.lineage?.rubric_version,
    baseline_delta: row.baseline?.delta,
    verdict: row.VERDICT,
  })),
};

writeReport(report);
writeNormalizedResult(normalizedOutPath, {
  eval_id: "enhancement-discovery.workflow-quality",
  level: "workflow",
  runner: "promptfoo",
  workflow: "enhancement-discovery",
  runner_status: promptfooOk ? "passed" : promptfooFailed ? "failed" : "skipped",
  fallback_status: promptfooOk ? "not_used" : fallbackOk ? "passed" : "failed",
  waiver_status: "none",
  score: promptfooOk ? 1 : promptfooFailed ? 0 : null,
  artifact_uris: [outPath, ...contractReportPaths],
  metadata: {
    promptfoo_status: report.promptfoo_status,
    fallback_failures: fallbackFailures,
  },
});
if (!ok) process.exit(1);
