#!/usr/bin/env node
import { existsSync, readFileSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../..");
const outDir = resolve(repoRoot, ".workflow/test-enhancement-discovery-builder");

rmSync(outDir, { recursive: true, force: true });

const result = spawnSync(
  process.execPath,
  [
    "scripts/workflow-builder/materialize-enhancement-discovery.mjs",
    "--output-root",
    outDir,
    "--mode",
    "test",
  ],
  { cwd: repoRoot, encoding: "utf8" },
);

if (result.status !== 0) {
  process.stderr.write(result.stderr);
  process.stdout.write(result.stdout);
  process.exit(result.status ?? 1);
}

const requiredFiles = [
  "workflows/app-feedback/discover-enhancement.fabro",
  "workflows/app-feedback/discover-enhancement.consumer-radar.toml",
  "scripts/app-feedback/analyze-enhancement-capabilities.mjs",
  "scripts/app-feedback/evaluate-enhancement-artifact.mjs",
  "scripts/app-feedback/ensure-enhancement-candidates.mjs",
  "scripts/app-feedback/fabro-validate-compat.mjs",
  "scripts/app-feedback/materialize-enhancement-workflow.mjs",
  "scripts/app-feedback/live-source-preflight.mjs",
  "scripts/app-feedback/promptfoo-workflow-quality.mjs",
  "scripts/app-feedback/validate-enhancement-discovery.mjs",
  "scripts/app-feedback/publish-enhancement-discovery-handoff.mjs",
  "scripts/app-feedback/test-eval-lineage-contract.mjs",
  "scripts/workflow-builder/validate-enhancement-discovery-builder.mjs",
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
  ".workflow/workflow-builder/enhancement-discovery-report.json",
];

for (const file of requiredFiles) {
  if (!existsSync(resolve(outDir, file))) throw new Error(`missing generated file: ${file}`);
}

const workflow = readFileSync(
  resolve(outDir, "workflows/app-feedback/discover-enhancement.fabro"),
  "utf8",
);
const toml = readFileSync(
  resolve(outDir, "workflows/app-feedback/discover-enhancement.consumer-radar.toml"),
  "utf8",
);
const validator = readFileSync(
  resolve(outDir, "scripts/app-feedback/validate-enhancement-discovery.mjs"),
  "utf8",
);
const evaluator = readFileSync(
  resolve(outDir, "scripts/app-feedback/evaluate-enhancement-artifact.mjs"),
  "utf8",
);
const materializer = readFileSync(
  resolve(outDir, "scripts/app-feedback/materialize-enhancement-workflow.mjs"),
  "utf8",
);
const prompts = [
  "prompts/app-feedback/spec-candidate-a.md",
  "prompts/app-feedback/spec-candidate-b.md",
  "prompts/app-feedback/spec-candidate-c.md",
  "prompts/app-feedback/architecture-candidate-a.md",
  "prompts/app-feedback/architecture-candidate-b.md",
  "prompts/app-feedback/workflow-candidate-a.md",
  "prompts/app-feedback/workflow-candidate-b.md",
  "prompts/app-feedback/eval-consensus.md",
  "prompts/app-feedback/simplification-plan.md",
]
  .map((file) => readFileSync(resolve(outDir, file), "utf8"))
  .join("\n");

for (const marker of [
  "capability_audit",
  "spec_fanout",
  "spec_candidate_a",
  "spec_candidate_b",
  "spec_candidate_c",
  "spec_eval_contract",
  "spec_eval_model",
  "spec_eval_consensus",
  "ensure_spec_candidates",
  "architecture_fanout",
  "ensure_architecture_candidates",
  "architecture_eval_contract",
  "architecture_eval_consensus",
  "workflow_fanout",
  "ensure_workflow_candidates",
  "workflow_eval_contract",
  "workflow_eval_consensus",
  "materialize_enhancement_workflow",
  "validate_enhancement_workflow",
  "run_generated_enhancement_workflow",
  "simplification_plan",
  "final_eval_fanout",
  "final_eval_consensus",
  "promptfoo_workflow_quality",
  "fabro-validate-compat",
]) {
  if (!workflow.includes(marker)) throw new Error(`workflow missing marker: ${marker}`);
}

for (const forbidden of [
  "spec_eval_fanout -> spec_eval_contract",
  "spec_eval_contract -> spec_eval_join",
  "spec_eval_join -> spec_eval_consensus",
]) {
  if (workflow.includes(forbidden)) {
    throw new Error(`strict eval contract gate must not be masked by fanout: ${forbidden}`);
  }
}

for (const requiredEdge of [
  "spec_join -> ensure_spec_candidates",
  "ensure_spec_candidates -> spec_eval_contract",
  "spec_eval_contract -> spec_eval_model",
  "spec_eval_model -> spec_eval_consensus",
  "architecture_join -> ensure_architecture_candidates",
  "ensure_architecture_candidates -> architecture_eval_contract",
  "architecture_eval_contract -> architecture_eval_consensus [condition=\"outcome=succeeded\"]",
  "architecture_eval_contract -> architecture_fanout [label=\"Re-architect\"]",
  "workflow_join -> ensure_workflow_candidates",
  "ensure_workflow_candidates -> workflow_eval_contract",
  "workflow_eval_contract -> workflow_eval_consensus [condition=\"outcome=succeeded\"]",
  "workflow_eval_contract -> workflow_fanout [label=\"Re-workflow\"]",
]) {
  if (!workflow.includes(requiredEdge)) throw new Error(`missing strict eval edge: ${requiredEdge}`);
}

for (const marker of [
  "eval_driven_development",
  "test_driven_development",
  "minimum_spec_candidates",
  "minimum_architecture_candidates",
  "minimum_workflow_candidates",
  "minimum_eval_score",
  "max_eval_regression",
  "require_simplification",
]) {
  if (!toml.includes(marker) && !workflow.includes(marker)) {
    throw new Error(`config/workflow missing marker: ${marker}`);
  }
}

for (const marker of [
  "rubric",
  "pairwise",
  "non-cheating",
  "acceptance gates",
  "simplification",
]) {
  if (!prompts.includes(marker)) throw new Error(`prompts missing EDD marker: ${marker}`);
}

for (const marker of [
  "minimum_eval_score",
  "candidate_count",
  "scores",
  "lineage",
  "dataset_sha256",
  "baseline",
  "delta",
  "VERDICT",
  "REJECTED",
]) {
  if (!evaluator.includes(marker) && !validator.includes(marker)) {
    throw new Error(`evaluator/validator missing marker: ${marker}`);
  }
}

if (validator.includes("\"spec_eval_fanout\"")) {
  throw new Error("generated workflow validator must not require removed spec_eval_fanout marker");
}

for (const marker of [
  "ensure_spec_candidates",
  "spec_eval_contract",
  "spec_eval_model",
  "ensure_architecture_candidates",
  "architecture_eval_contract",
  "ensure_workflow_candidates",
  "workflow_eval_contract",
]) {
  if (!validator.includes(marker)) {
    throw new Error(`generated workflow validator missing strict eval marker: ${marker}`);
  }
}

for (const marker of [
  "workflows/consumer-radar/live-enrichment.fabro",
  "live_data_gate",
  "real_mode",
  "allow_fixture_fallback",
  "APIFY_TOKEN",
  "simplification",
]) {
  if (!materializer.includes(marker)) {
    throw new Error(`generated enhancement materializer missing marker: ${marker}`);
  }
}

if (/apify_api_|sk-or-v1-|xoxb-|xapp-|lin_api_|dtn_/.test(workflow + toml + validator + evaluator + materializer + prompts)) {
  throw new Error("generated enhancement discovery artifacts must not contain raw secrets");
}

console.log(
  JSON.stringify(
    {
      ok: true,
      output_root: outDir,
      files: requiredFiles.length,
    },
    null,
    2,
  ),
);
