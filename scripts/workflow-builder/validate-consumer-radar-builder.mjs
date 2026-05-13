#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";

const required = [
  "specs/consumer-app-radar/spec.md",
  "workflows/consumer-radar/build-consumer-app-radar.fabro",
  "workflows/consumer-radar/build-consumer-app-radar.toml",
  "scripts/consumer-radar/generate-app.mjs",
  "scripts/consumer-radar/openrouter-review.mjs",
  "scripts/consumer-radar/promptfoo-or-fallback.mjs",
  "evals/consumer-app-radar-quality.yaml"
];
const missing = required.filter((file) => !existsSync(file));
const workflow = existsSync(required[1]) ? readFileSync(required[1], "utf8") : "";
const toml = existsSync(required[2]) ? readFileSync(required[2], "utf8") : "";
const hasMarkers = ["review_fanout", "qlty_gate", "promptfoo_gate", "Spec Kitty", "moonshotai/kimi-k2.6", "qwen/qwen3.6-plus", "deepseek/deepseek-v4"].every((text) => workflow.includes(text) || toml.includes(text) || readFileSync(required[0], "utf8").includes(text));
const leaks = /apify_api_|sk-or-v1-|xoxb-|xapp-/.test(workflow + toml);
const report = { ok: missing.length === 0 && hasMarkers && !leaks, missing, has_markers: hasMarkers, leaks };
mkdirSync(".workflow/workflow-builder", { recursive: true });
writeFileSync(".workflow/workflow-builder/validation.json", JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exit(1);
