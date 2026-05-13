#!/usr/bin/env node
import { existsSync, rmSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { dirname } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../..");
const outDir = resolve(repoRoot, ".workflow/test-consumer-radar-builder");

rmSync(outDir, { recursive: true, force: true });

const result = spawnSync(process.execPath, [
  "scripts/workflow-builder/materialize-consumer-radar.mjs",
  "--output-root",
  outDir,
  "--mode",
  "test"
], {
  cwd: repoRoot,
  encoding: "utf8"
});

if (result.status !== 0) {
  process.stderr.write(result.stderr);
  process.stdout.write(result.stdout);
  process.exit(result.status ?? 1);
}

const requiredFiles = [
  "specs/consumer-app-radar/spec.md",
  "workflows/consumer-radar/build-consumer-app-radar.fabro",
  "workflows/consumer-radar/build-consumer-app-radar.toml",
  "scripts/consumer-radar/generate-app.mjs",
  "scripts/consumer-radar/openrouter-review.mjs",
  "scripts/consumer-radar/promptfoo-or-fallback.mjs",
  "evals/consumer-app-radar-quality.yaml",
  ".workflow/workflow-builder/consumer-radar-report.json"
];

for (const file of requiredFiles) {
  const fullPath = resolve(outDir, file);
  if (!existsSync(fullPath)) throw new Error(`missing generated file: ${file}`);
}

const workflow = readFileSync(
  resolve(outDir, "workflows/consumer-radar/build-consumer-app-radar.fabro"),
  "utf8"
);
const toml = readFileSync(
  resolve(outDir, "workflows/consumer-radar/build-consumer-app-radar.toml"),
  "utf8"
);
const spec = readFileSync(resolve(outDir, "specs/consumer-app-radar/spec.md"), "utf8");

for (const text of [
  "Spec Kitty",
  "review_fanout",
  "qlty_gate",
  "promptfoo_gate",
  "moonshotai/kimi-k2.6",
  "qwen/qwen3.6-plus",
  "deepseek/deepseek-v4"
]) {
  if (!workflow.includes(text) && !spec.includes(text)) {
    throw new Error(`missing expected workflow/spec marker: ${text}`);
  }
}

if (workflow.includes("/Users/") || toml.includes("/Users/")) {
  throw new Error("generated workflow must be repository-relative");
}
if (/apify_api_|sk-or-v1-|xoxb-|xapp-/.test(workflow + toml + spec)) {
  throw new Error("generated artifacts must not contain raw secrets");
}
if (!toml.includes('[run.sandbox.env]') || !toml.includes('{{ env.APIFY_TOKEN }}')) {
  throw new Error("generated run config must inject APIFY_TOKEN by env reference");
}

console.log(JSON.stringify({
  ok: true,
  output_root: outDir,
  files: requiredFiles.length
}, null, 2));
