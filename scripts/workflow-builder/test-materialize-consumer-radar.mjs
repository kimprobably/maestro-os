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

const result = spawnSync(
  process.execPath,
  [
    "scripts/workflow-builder/materialize-consumer-radar.mjs",
    "--output-root",
    outDir,
    "--mode",
    "test",
  ],
  {
    cwd: repoRoot,
    encoding: "utf8",
  },
);

if (result.status !== 0) {
  process.stderr.write(result.stderr);
  process.stdout.write(result.stdout);
  process.exit(result.status ?? 1);
}

const requiredFiles = [
  "specs/consumer-app-radar/spec.md",
  ".fabro/project.toml",
  "workflows/consumer-radar/build-consumer-app-radar.fabro",
  "workflows/consumer-radar/build-consumer-app-radar.toml",
  "scripts/consumer-radar/generate-app.mjs",
  "scripts/consumer-radar/assert-product-surface.mjs",
  "scripts/consumer-radar/openrouter-review.mjs",
  "scripts/consumer-radar/promptfoo-or-fallback.mjs",
  "evals/consumer-app-radar-quality.yaml",
  ".workflow/workflow-builder/consumer-radar-report.json",
];

for (const file of requiredFiles) {
  const fullPath = resolve(outDir, file);
  if (!existsSync(fullPath)) throw new Error(`missing generated file: ${file}`);
}

const workflow = readFileSync(
  resolve(outDir, "workflows/consumer-radar/build-consumer-app-radar.fabro"),
  "utf8",
);
const toml = readFileSync(
  resolve(outDir, "workflows/consumer-radar/build-consumer-app-radar.toml"),
  "utf8",
);
const project = readFileSync(resolve(outDir, ".fabro/project.toml"), "utf8");
const spec = readFileSync(
  resolve(outDir, "specs/consumer-app-radar/spec.md"),
  "utf8",
);
const dataSourceSmoke = readFileSync(
  resolve(outDir, "scripts/consumer-radar/data-source-smoke.mjs"),
  "utf8",
);
const generateApp = readFileSync(
  resolve(outDir, "scripts/consumer-radar/generate-app.mjs"),
  "utf8",
);
const productSurfaceGate = readFileSync(
  resolve(outDir, "scripts/consumer-radar/assert-product-surface.mjs"),
  "utf8",
);
const openRouterReview = readFileSync(
  resolve(outDir, "scripts/consumer-radar/openrouter-review.mjs"),
  "utf8",
);
const reviewConsensus = readFileSync(
  resolve(outDir, "scripts/consumer-radar/review-consensus.mjs"),
  "utf8",
);
const promptfooGate = readFileSync(
  resolve(outDir, "scripts/consumer-radar/promptfoo-or-fallback.mjs"),
  "utf8",
);
const promptfooConfig = readFileSync(
  resolve(outDir, "evals/consumer-app-radar-quality.yaml"),
  "utf8",
);
const qltyGate = readFileSync(
  resolve(outDir, "scripts/consumer-radar/qlty-gate.mjs"),
  "utf8",
);
const artifactGate = readFileSync(
  resolve(outDir, "scripts/consumer-radar/validate-build-artifacts.mjs"),
  "utf8",
);

for (const text of [
  "Spec Kitty",
  "prepare_review_reports",
  "review_fanout",
  "qlty_gate",
  "promptfoo_gate",
  "product_surface_gate",
  "moonshotai/kimi-k2.6",
  "qwen/qwen3.6-plus",
  "deepseek/deepseek-v4",
]) {
  if (!workflow.includes(text) && !spec.includes(text)) {
    throw new Error(`missing expected workflow/spec marker: ${text}`);
  }
}

if (
  workflow.includes("/Users/") ||
  toml.includes("/Users/") ||
  project.includes("/Users/")
) {
  throw new Error("generated workflow must be repository-relative");
}
if (/apify_api_|sk-or-v1-|xoxb-|xapp-/.test(workflow + toml + project + spec)) {
  throw new Error("generated artifacts must not contain raw secrets");
}
if (
  !project.includes("[run.sandbox.env]") ||
  !project.includes("${{ secrets.APIFY_TOKEN }}") ||
  !project.includes("${{ secrets.OPENROUTER_API_KEY }}")
) {
  throw new Error(
    "generated project config must inject sandbox secrets by vault reference",
  );
}
if (
  !project.includes('network = "allow_all"') ||
  !project.includes('name = "maestro-code-factory-v5"') ||
  !project.includes('MAESTRO_AGENT_STATE_DIR = "/home/daytona/agent-state"') ||
  !project.includes("[[run.sandbox.daytona.volumes]]") ||
  !project.includes("fabro --version")
) {
  throw new Error(
    "generated project config must define the shared Daytona code-factory environment",
  );
}
if (toml.includes("[run.sandbox.daytona.snapshot]")) {
  throw new Error(
    "generated workflow should inherit the shared Daytona snapshot from .fabro/project.toml",
  );
}
for (const text of [
  "real_mode",
  "allow_fixture_fallback",
  "allow_quality_fallback",
  "minimum_active_reviews",
]) {
  if (!workflow.includes(text) && !toml.includes(text)) {
    throw new Error(
      `generated workflow must include strict mode marker: ${text}`,
    );
  }
}
if (
  !dataSourceSmoke.includes("env_injected_by_fabro") ||
  !dataSourceSmoke.includes("realMode") ||
  !dataSourceSmoke.includes("process.exit(1)")
) {
  throw new Error(
    "data source smoke must verify Fabro env injection and fail in real mode",
  );
}
if (
  !openRouterReview.includes("realMode") ||
  !openRouterReview.includes("process.exit(realMode ? 1 : 0)") ||
  !openRouterReview.includes("OPENROUTER_API_KEY unavailable")
) {
  throw new Error(
    "OpenRouter review must support real-mode hard failure for missing credentials",
  );
}
if (
  !openRouterReview.includes("source_excerpts") ||
  !openRouterReview.includes("do not claim an endpoint or file is missing")
) {
  throw new Error(
    "OpenRouter review must include generated source context for model reviewers",
  );
}
if (
  !openRouterReview.includes("response.text()") ||
  !openRouterReview.includes("payload_text_excerpt")
) {
  throw new Error(
    "OpenRouter review must capture raw response text for empty or invalid provider payloads",
  );
}
if (
  !reviewConsensus.includes("minimumActiveReviews") ||
  !reviewConsensus.includes("active.length < minimumActiveReviews") ||
  !reviewConsensus.includes(".fabro/scratch") ||
  !reviewConsensus.includes("refs/heads/fabro/run/parallel")
) {
  throw new Error(
    "review consensus must fail when all model reviews are skipped and collect parallel branch artifacts",
  );
}
if (
  !workflow.includes("reports/consumer-radar/reviews") ||
  workflow.includes("--reviews .workflow/consumer-radar/reviews")
) {
  throw new Error(
    "parallel review artifacts must be written to a tracked reports path, not ignored .workflow",
  );
}
if (
  !workflow.includes(
    "rm -rf reports/consumer-radar/reviews reports/consumer-radar/review-consensus.json",
  )
) {
  throw new Error(
    "workflow must clear inherited review reports before parallel review fanout",
  );
}
if (!reviewConsensus.includes("reports/consumer-radar/reviews")) {
  throw new Error(
    "review consensus must read tracked review artifacts from reports/consumer-radar/reviews",
  );
}
if (
  !promptfooGate.includes("allowFallback") ||
  !promptfooGate.includes("Promptfoo failed in real mode")
) {
  throw new Error("promptfoo gate must make fallback opt-in in real mode");
}
if (
  !promptfooGate.includes("PROMPTFOO_EVAL_TIMEOUT_MS") ||
  !promptfooGate.includes("PROMPTFOO_MAX_EVAL_TIME_MS")
) {
  throw new Error(
    "promptfoo gate must bound request and total eval runtime for CI",
  );
}
if (
  !promptfooGate.includes(
    "reports/consumer-radar/quality/promptfoo-report.json",
  )
) {
  throw new Error("promptfoo gate must write a tracked quality report");
}
if (
  !promptfooConfig.includes("apps_fixture") ||
  !promptfooConfig.includes("covered_signals") ||
  !promptfooConfig.includes("defaultTest") ||
  !promptfooConfig.includes(
    "file://../apps/generated-consumer-app-radar/fixtures/apps.json",
  ) ||
  !promptfooConfig.includes("evaluateOptions")
) {
  throw new Error(
    "promptfoo config must evaluate the generated fixture data with explicit CI bounds",
  );
}
if (
  !qltyGate.includes("allowFallback") ||
  !qltyGate.includes("Qlty unavailable in real mode")
) {
  throw new Error("qlty gate must make unavailable qlty opt-in in real mode");
}
if (
  !qltyGate.includes("qlty fmt --all --no-progress --no-upgrade-check") ||
  !qltyGate.includes("strictMode")
) {
  throw new Error("qlty gate must format before strict real-mode checks");
}
if (!qltyGate.includes("reports/consumer-radar/quality/qlty-report.json")) {
  throw new Error("qlty gate must write a tracked quality report");
}
if (
  !artifactGate.includes("reports/consumer-radar/quality/native-checks.json") ||
  !artifactGate.includes("reports/consumer-radar/quality/promptfoo-report.json") ||
  !artifactGate.includes("product_surface_ok")
) {
  throw new Error("artifact gate must require tracked quality reports");
}
for (const text of [
  "src/summary.js",
  "src/sources/social.js",
  "src/snapshots.js",
  "src/evidence.js",
  "Growth Signals",
  "Review Pain",
  "Social Strategy",
  "renderSummary",
  "renderSourceStatus",
  "investigationAngles",
  "weeklySnapshots",
  "id=\"search\"",
  "id=\"category\"",
  "id=\"sort\"",
  "id=\"summary\"",
  "id=\"source-status\"",
  ".kpi-grid",
  ".toolbar",
  ".app-table",
  ".opportunity-grid",
  "/api/summary",
  "buildSummary",
]) {
  if (!generateApp.includes(text)) {
    throw new Error(
      `generated app must include richer product surface marker: ${text}`,
    );
  }
}
for (const text of [
  "Access-Control-Allow-Origin",
  "allowedModes",
  "Fixture apps unavailable",
]) {
  if (!generateApp.includes(text)) {
    throw new Error(
      `generated app must address review hardening marker: ${text}`,
    );
  }
}
if (
  !productSurfaceGate.includes("weeklySnapshots") ||
  !productSurfaceGate.includes("investigationAngles") ||
  !productSurfaceGate.includes("id=\"search\"")
) {
  throw new Error(
    "product surface gate must enforce dashboard controls, evidence, and investigation angles",
  );
}
if (
  !artifactGate.includes("minimum_apps") ||
  !artifactGate.includes("minimum_reports")
) {
  throw new Error("artifact gate must enforce richer artifact thresholds");
}
if (
  !generateApp.includes("requestedAppDir") ||
  generateApp.includes("app_dir: appDir")
) {
  throw new Error(
    "generated app build manifest must avoid absolute sandbox paths",
  );
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
