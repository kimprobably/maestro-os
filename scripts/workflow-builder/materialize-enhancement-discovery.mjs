#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`Missing value for ${name}`);
  return value;
}

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../..");
const outputRoot = resolve(argValue("--output-root", "."));
const mode = argValue("--mode", "write");

function write(relativePath, content) {
  const fullPath = resolve(outputRoot, relativePath);
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, content.endsWith("\n") ? content : `${content}\n`);
}

function copy(relativePath) {
  const source = resolve(repoRoot, relativePath);
  if (!existsSync(source)) throw new Error(`missing source support file: ${relativePath}`);
  write(relativePath, readFileSync(source, "utf8"));
}

const generatedFiles = [
  "workflows/app-feedback/discover-enhancement.fabro",
  "workflows/app-feedback/discover-enhancement.consumer-radar.toml",
  "scripts/app-feedback/analyze-enhancement-capabilities.mjs",
  "scripts/app-feedback/evaluate-enhancement-artifact.mjs",
  "scripts/app-feedback/materialize-enhancement-workflow.mjs",
  "scripts/app-feedback/live-source-preflight.mjs",
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
  "prompts/app-feedback/live-enrichment-implementation.md",
  "prompts/app-feedback/live-enrichment-plan-a.md",
  "prompts/app-feedback/live-enrichment-plan-b.md",
  "docs/ENHANCEMENT-DISCOVERY-WORKFLOW.md",
];

for (const file of generatedFiles) copy(file);

const report = {
  ok: true,
  mode,
  generated_at: new Date().toISOString(),
  workflow: "workflows/app-feedback/discover-enhancement.fabro",
  run_config: "workflows/app-feedback/discover-enhancement.consumer-radar.toml",
  generated_files: generatedFiles,
  workflow_contract: {
    eval_driven_development: true,
    test_driven_development: true,
    minimum_spec_candidates: 3,
    minimum_architecture_candidates: 2,
    minimum_workflow_candidates: 2,
    minimum_eval_score: 0.78,
    require_simplification: true,
  },
  next:
    "Run workflows/app-feedback/discover-enhancement.consumer-radar.toml to generate and validate the app-specific live-enrichment workflow.",
};

write(
  ".workflow/workflow-builder/enhancement-discovery-report.json",
  JSON.stringify(report, null, 2),
);
console.log(JSON.stringify(report, null, 2));
