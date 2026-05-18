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

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

const appDir = argValue("--app-dir", "apps/generated-consumer-app-radar");
const generatedWorkflow = argValue("--generated-workflow", "workflows/consumer-radar/live-enrichment.fabro");
const outPath = resolve(argValue("--out", ".workflow/enhancement-discovery/handoff.json"));

const handoff = {
  ok: true,
  app_dir: appDir,
  generated_workflow: generatedWorkflow,
  generated_workflow_exists: existsSync(generatedWorkflow),
  capability_audit: readJson(".workflow/enhancement-discovery/capability-audit.json"),
  spec_eval: readJson(".workflow/enhancement-discovery/evals/spec-contract.json"),
  architecture_eval: readJson(".workflow/enhancement-discovery/evals/architecture-contract.json"),
  workflow_eval: readJson(".workflow/enhancement-discovery/evals/workflow-contract.json"),
  validation: readJson(".workflow/enhancement-discovery/generated-workflow-validation.json"),
  simplification_plan: existsSync(".workflow/enhancement-discovery/simplification-plan.md")
    ? ".workflow/enhancement-discovery/simplification-plan.md"
    : null,
  next: "Run the generated live-enrichment workflow with execute_generated_workflow=true after reviewing the selected spec, architecture, and workflow eval reports.",
  generated_at: new Date().toISOString(),
};

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `${JSON.stringify(handoff, null, 2)}\n`);
console.log(JSON.stringify(handoff, null, 2));
