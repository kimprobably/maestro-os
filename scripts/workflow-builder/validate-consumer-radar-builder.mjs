#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";

const required = [
  "specs/consumer-app-radar/spec.md",
  ".fabro/project.toml",
  "workflows/consumer-radar/build-consumer-app-radar.fabro",
  "workflows/consumer-radar/build-consumer-app-radar.toml",
  "scripts/consumer-radar/generate-app.mjs",
  "scripts/consumer-radar/assert-product-surface.mjs",
  "scripts/consumer-radar/openrouter-review.mjs",
  "scripts/consumer-radar/promptfoo-or-fallback.mjs",
  "evals/consumer-app-radar-quality.yaml",
];
const missing = required.filter((file) => !existsSync(file));
const project = existsSync(required[1])
  ? readFileSync(required[1], "utf8")
  : "";
const workflow = existsSync(required[2])
  ? readFileSync(required[2], "utf8")
  : "";
const toml = existsSync(required[3]) ? readFileSync(required[3], "utf8") : "";
const hasMarkers = [
  "review_fanout",
  "product_surface_gate",
  "qlty_gate",
  "promptfoo_gate",
  "Spec Kitty",
  "moonshotai/kimi-k2.6",
  "qwen/qwen3.6-plus",
  "deepseek/deepseek-v4",
].every(
  (text) =>
    workflow.includes(text) ||
    toml.includes(text) ||
    readFileSync(required[0], "utf8").includes(text),
);
const hasProjectEnv =
  project.includes("[run.sandbox.env]") &&
  project.includes("{{ env.APIFY_TOKEN }}") &&
  project.includes("{{ env.OPENROUTER_API_KEY }}") &&
  project.includes("{{ env.OPENAI_API_KEY }}") &&
  project.includes("{{ env.CLAUDE_CODE_OAUTH_TOKEN }}") &&
  project.includes("{{ env.CLAUDE_CODE_CREDENTIALS_JSON_BASE64 }}") &&
  project.includes('network = "allow_all"') &&
  project.includes("[llm.providers.openrouter]") &&
  project.includes('adapter = "openai_compatible"');
const leaks = /apify_api_|sk-or-v1-|xoxb-|xapp-/.test(
  project + workflow + toml,
);
const report = {
  ok: missing.length === 0 && hasMarkers && hasProjectEnv && !leaks,
  missing,
  has_markers: hasMarkers,
  has_project_env: hasProjectEnv,
  leaks,
};
mkdirSync(".workflow/workflow-builder", { recursive: true });
writeFileSync(
  ".workflow/workflow-builder/validation.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exit(1);
