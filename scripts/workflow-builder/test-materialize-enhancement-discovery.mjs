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
  "scripts/app-feedback/materialize-enhancement-workflow.mjs",
  "scripts/app-feedback/validate-enhancement-discovery.mjs",
  "scripts/app-feedback/publish-enhancement-discovery-handoff.mjs",
  "scripts/workflow-builder/validate-enhancement-discovery-builder.mjs",
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
]) {
  if (!workflow.includes(marker)) throw new Error(`workflow missing marker: ${marker}`);
}

for (const marker of [
  "eval_driven_development",
  "test_driven_development",
  "minimum_spec_candidates",
  "minimum_architecture_candidates",
  "minimum_workflow_candidates",
  "minimum_eval_score",
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
  "VERDICT",
  "REJECTED",
]) {
  if (!evaluator.includes(marker) && !validator.includes(marker)) {
    throw new Error(`evaluator/validator missing marker: ${marker}`);
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
