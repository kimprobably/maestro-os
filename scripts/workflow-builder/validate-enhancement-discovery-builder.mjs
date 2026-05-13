#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const required = [
  "workflows/app-feedback/discover-enhancement.fabro",
  "workflows/app-feedback/discover-enhancement.consumer-radar.toml",
  "scripts/app-feedback/analyze-enhancement-capabilities.mjs",
  "scripts/app-feedback/evaluate-enhancement-artifact.mjs",
  "scripts/app-feedback/materialize-enhancement-workflow.mjs",
  "scripts/app-feedback/live-source-preflight.mjs",
  "scripts/app-feedback/promptfoo-workflow-quality.mjs",
  "scripts/app-feedback/validate-enhancement-discovery.mjs",
  "scripts/app-feedback/publish-enhancement-discovery-handoff.mjs",
  "evals/workflow-quality/enhancement-discovery.yaml",
  "evals/workflow-quality/datasets/enhancement-discovery-golden.jsonl",
  "evals/workflow-quality/baselines/enhancement-discovery-spec.json",
  "evals/workflow-quality/baselines/enhancement-discovery-architecture.json",
  "evals/workflow-quality/baselines/enhancement-discovery-workflow.json",
  "prompts/app-feedback/spec-candidate-a.md",
  "prompts/app-feedback/spec-candidate-b.md",
  "prompts/app-feedback/spec-candidate-c.md",
  "prompts/app-feedback/architecture-candidate-a.md",
  "prompts/app-feedback/architecture-candidate-b.md",
  "prompts/app-feedback/workflow-candidate-a.md",
  "prompts/app-feedback/workflow-candidate-b.md",
  "prompts/app-feedback/eval-consensus.md",
  "prompts/app-feedback/simplification-plan.md",
  "docs/ENHANCEMENT-DISCOVERY-WORKFLOW.md",
];

const missing = required.filter((file) => !existsSync(file));
const workflow = existsSync(required[0]) ? readFileSync(required[0], "utf8") : "";
const toml = existsSync(required[1]) ? readFileSync(required[1], "utf8") : "";
const evaluator = existsSync(required[3]) ? readFileSync(required[3], "utf8") : "";
const materializer = existsSync(required[4]) ? readFileSync(required[4], "utf8") : "";
const docsPath = "docs/ENHANCEMENT-DISCOVERY-WORKFLOW.md";
const docs = existsSync(docsPath) ? readFileSync(docsPath, "utf8") : "";
const prompts = required
  .filter((file) => file.startsWith("prompts/") && existsSync(file))
  .map((file) => readFileSync(file, "utf8"))
  .join("\n");

const workflowMarkers = [
  "capability_audit",
  "spec_fanout",
  "spec_eval_fanout",
  "spec_eval_consensus",
  "architecture_fanout",
  "architecture_eval_consensus",
  "workflow_fanout",
  "workflow_eval_consensus",
  "materialize_enhancement_workflow",
  "validate_enhancement_workflow",
  "run_generated_enhancement_workflow",
  "simplification_plan",
  "final_eval_fanout",
  "final_eval_consensus",
];
const missingWorkflowMarkers = workflowMarkers.filter((marker) => !workflow.includes(marker));

const configMarkers = [
  "eval_driven_development",
  "test_driven_development",
  "minimum_spec_candidates",
  "minimum_architecture_candidates",
  "minimum_workflow_candidates",
  "minimum_eval_score",
  "max_eval_regression",
  "require_simplification",
];
const missingConfigMarkers = configMarkers.filter(
  (marker) => !workflow.includes(marker) && !toml.includes(marker),
);

const evalMarkers = ["rubric", "pairwise", "non-cheating", "acceptance gates", "simplification"];
const missingEvalMarkers = evalMarkers.filter(
  (marker) => !prompts.includes(marker) && !evaluator.includes(marker) && !docs.includes(marker),
);

const lineageMarkers = [
  "dataset-version",
  "prompt-version",
  "rubric-version",
  "judge-model",
  "baseline",
  "max-regression",
  "promptfoo_workflow_quality",
];
const missingLineageMarkers = lineageMarkers.filter(
  (marker) => !workflow.includes(marker) && !evaluator.includes(marker) && !docs.includes(marker),
);

const generatedWorkflowMarkers = [
  "workflows/consumer-radar/live-enrichment.fabro",
  "live_data_gate",
  "real_mode",
  "allow_fixture_fallback",
  "APIFY_TOKEN",
  "simplification",
];
const missingGeneratedWorkflowMarkers = generatedWorkflowMarkers.filter(
  (marker) => !materializer.includes(marker),
);

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
const leaks = leakPattern.test(workflow + toml + evaluator + materializer + docs + prompts);

const report = {
  ok:
    missing.length === 0 &&
    missingWorkflowMarkers.length === 0 &&
    missingConfigMarkers.length === 0 &&
    missingEvalMarkers.length === 0 &&
    missingLineageMarkers.length === 0 &&
    missingGeneratedWorkflowMarkers.length === 0 &&
    !leaks,
  missing,
  missing_workflow_markers: missingWorkflowMarkers,
  missing_config_markers: missingConfigMarkers,
  missing_eval_markers: missingEvalMarkers,
  missing_lineage_markers: missingLineageMarkers,
  missing_generated_workflow_markers: missingGeneratedWorkflowMarkers,
  leaks,
};

mkdirSync(".workflow/workflow-builder", { recursive: true });
writeFileSync(
  ".workflow/workflow-builder/enhancement-discovery-validation.json",
  `${JSON.stringify(report, null, 2)}\n`,
);
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exit(1);
