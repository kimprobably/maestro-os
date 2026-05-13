#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const required = [
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
];

const missing = required.filter((file) => !existsSync(file));
const workflow = existsSync(required[1]) ? readFileSync(required[1], "utf8") : "";
const toml = existsSync(required[2]) ? readFileSync(required[2], "utf8") : "";
const adapter = existsSync(required[6]) ? readFileSync(required[6], "utf8") : "";
const gate = existsSync(required[7]) ? readFileSync(required[7], "utf8") : "";
const docs = existsSync(required[9]) ? readFileSync(required[9], "utf8") : "";

const markers = [
  "parse_feedback",
  "spec_kitty_feedback_gate",
  "apply_enhancement",
  "feedback_acceptance_gate",
  "review_fanout",
  "moonshotai/kimi-k2.6",
  "qwen/qwen3.6-plus",
  "deepseek/deepseek-v4",
  "target_adapter",
  "consumer-radar",
];
const missingMarkers = markers.filter((marker) => !workflow.includes(marker) && !toml.includes(marker));

const adapterMarkers = [
  "growthHypothesis",
  "reviewSamples",
  "exampleContent",
  "addCustomApp",
  "categoryLeader",
  "Fixture-backed hypothesis",
];
const missingAdapterMarkers = adapterMarkers.filter((marker) => !adapter.includes(marker) && !gate.includes(marker));

const leaks = /apify_api_|sk-or-v1-|xoxb-|xapp-|lin_api_|dtn_/.test(
  workflow + toml + adapter + gate + docs,
);

const report = {
  ok: missing.length === 0 && missingMarkers.length === 0 && missingAdapterMarkers.length === 0 && !leaks,
  missing,
  missing_markers: missingMarkers,
  missing_adapter_markers: missingAdapterMarkers,
  leaks,
};

mkdirSync(".workflow/workflow-builder", { recursive: true });
writeFileSync(
  ".workflow/workflow-builder/app-feedback-validation.json",
  `${JSON.stringify(report, null, 2)}\n`,
);
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exit(1);
