#!/usr/bin/env node
import { existsSync, readFileSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../..");
const outDir = resolve(repoRoot, ".workflow/test-app-feedback-builder");

rmSync(outDir, { recursive: true, force: true });

const result = spawnSync(
  process.execPath,
  [
    "scripts/workflow-builder/materialize-app-feedback-enhancement.mjs",
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
  "feedback/consumer-radar-product-feedback.md",
  "workflows/app-feedback/enhance-app-from-feedback.fabro",
  "workflows/app-feedback/enhance-app-from-feedback.consumer-radar.toml",
  "scripts/app-feedback/parse-feedback.mjs",
  "scripts/app-feedback/spec-kitty-feedback-gate.mjs",
  "scripts/app-feedback/apply-feedback-enhancement.mjs",
  "scripts/app-feedback/apply-consumer-radar-feedback.mjs",
  "scripts/app-feedback/assert-feedback-enhancement.mjs",
  "scripts/app-feedback/publish-feedback-handoff.mjs",
  "docs/APP-FEEDBACK-ENHANCEMENT-WORKFLOW.md",
  ".workflow/workflow-builder/app-feedback-enhancement-report.json",
];

for (const file of requiredFiles) {
  if (!existsSync(resolve(outDir, file))) throw new Error(`missing generated file: ${file}`);
}

const workflow = readFileSync(resolve(outDir, "workflows/app-feedback/enhance-app-from-feedback.fabro"), "utf8");
const toml = readFileSync(resolve(outDir, "workflows/app-feedback/enhance-app-from-feedback.consumer-radar.toml"), "utf8");
const parser = readFileSync(resolve(outDir, "scripts/app-feedback/parse-feedback.mjs"), "utf8");
const adapter = readFileSync(resolve(outDir, "scripts/app-feedback/apply-consumer-radar-feedback.mjs"), "utf8");
const gate = readFileSync(resolve(outDir, "scripts/app-feedback/assert-feedback-enhancement.mjs"), "utf8");

for (const text of [
  "parse_feedback",
  "spec_kitty_feedback_gate",
  "apply_enhancement",
  "feedback_acceptance_gate",
  "qlty_gate",
  "promptfoo_gate",
  "review_fanout",
  "review_consensus",
  "artifact_gate",
  "minimum_active_reviews",
]) {
  if (!workflow.includes(text) && !toml.includes(text)) {
    throw new Error(`missing workflow marker: ${text}`);
  }
}

for (const text of [
  "growth-evidence-provenance",
  "visible-review-samples",
  "emerging-not-biggest-ranking",
  "visible-example-content",
  "add-app-research-seed",
]) {
  if (!parser.includes(text)) throw new Error(`parser missing acceptance marker: ${text}`);
}

for (const text of [
  "growthHypothesis",
  "reviewSamples",
  "exampleContent",
  "addCustomApp",
  "categoryLeader",
  "Fixture-backed hypothesis",
]) {
  if (!adapter.includes(text) && !gate.includes(text)) {
    throw new Error(`adapter/gate missing marker: ${text}`);
  }
}

if (/apify_api_|sk-or-v1-|xoxb-|xapp-|lin_api_|dtn_/.test(workflow + toml + parser + adapter + gate)) {
  throw new Error("generated feedback workflow artifacts must not contain raw secrets");
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
