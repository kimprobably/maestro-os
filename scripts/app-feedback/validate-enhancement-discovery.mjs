#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`Missing value for ${name}`);
  return value;
}

function readIfExists(path) {
  return existsSync(path) ? readFileSync(path, "utf8") : "";
}

const workflowPath = resolve(argValue("--workflow", "workflows/app-feedback/discover-enhancement.fabro"));
const generatedWorkflowPath = resolve(argValue("--generated-workflow", "workflows/consumer-radar/live-enrichment.fabro"));
const outPath = resolve(argValue("--out", ".workflow/enhancement-discovery/generated-workflow-validation.json"));

const workflow = readIfExists(workflowPath);
const generatedWorkflow = readIfExists(generatedWorkflowPath);
const combined = `${workflow}\n${generatedWorkflow}`;

const requiredParentMarkers = [
  "capability_audit",
  "spec_fanout",
  "ensure_spec_candidates",
  "spec_eval_contract",
  "spec_eval_model",
  "spec_eval_consensus",
  "architecture_fanout",
  "ensure_architecture_candidates",
  "architecture_eval_contract",
  "architecture_eval_consensus",
  "workflow_fanout",
  "ensure_workflow_candidates",
  "workflow_eval_contract",
  "workflow_eval_consensus",
  "simplification_plan",
  "final_eval_fanout",
  "final_eval_consensus",
];
const requiredGeneratedMarkers = [
  "live_data_gate",
  "real_mode",
  "allow_fixture_fallback",
  "APIFY_TOKEN",
  "simplification",
  "review_fanout",
  "qlty_gate",
  "promptfoo_gate",
];

const missing = [
  ...requiredParentMarkers
    .filter((marker) => !workflow.includes(marker))
    .map((marker) => `parent workflow missing ${marker}`),
  ...requiredGeneratedMarkers
    .filter((marker) => !generatedWorkflow.includes(marker))
    .map((marker) => `generated workflow missing ${marker}`),
];
const leakPattern = new RegExp(
  [
    ["apify", "api", ""].join("_"),
    ["sk", "or", "v1", ""].join("-"),
    ["xo", "xb", ""].join(""),
    ["xa", "pp", ""].join(""),
    ["lin", "api", ""].join("_"),
    ["dt", "n", ""].join("_"),
  ].join("|"),
);
const leaks = leakPattern.test(combined);
if (leaks) missing.push("workflow artifacts contain raw secret-looking values");

const report = {
  ok: missing.length === 0,
  workflow: workflowPath,
  generated_workflow: generatedWorkflowPath,
  required_parent_markers: requiredParentMarkers,
  required_generated_markers: requiredGeneratedMarkers,
  missing,
  leaks,
};

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exit(1);
