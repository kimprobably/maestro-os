#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const appDir = process.argv[2] || "apps/generated-consumer-app-radar";
mkdirSync(".workflow/consumer-radar", { recursive: true });

let promptfoo = spawnSync("sh", ["-lc", "command -v npx >/dev/null 2>&1"], { encoding: "utf8" }).status === 0;
let promptfooResult = null;
if (promptfoo) {
  promptfooResult = spawnSync("sh", ["-lc", "npx -y promptfoo@latest eval -c evals/consumer-app-radar-quality.yaml --no-progress-bar"], {
    encoding: "utf8",
    timeout: 240000
  });
}

const appsPath = appDir + "/fixtures/apps.json";
const apps = existsSync(appsPath) ? JSON.parse(readFileSync(appsPath, "utf8")) : [];
const fallbackAssertions = [
  { name: "has_three_apps", passed: apps.length >= 3 },
  { name: "has_social_strategy", passed: apps.every((app) => Array.isArray(app.socialStrategy) && app.socialStrategy.length > 0) },
  { name: "has_review_themes", passed: apps.every((app) => Array.isArray(app.reviewThemes) && app.reviewThemes.length > 0) },
  { name: "has_feature_requests", passed: apps.every((app) => Array.isArray(app.featureRequests) && app.featureRequests.length > 0) }
];

const report = {
  ok: fallbackAssertions.every((row) => row.passed),
  promptfoo_attempted: Boolean(promptfooResult),
  promptfoo_status: promptfooResult ? promptfooResult.status : null,
  promptfoo_stdout_excerpt: promptfooResult ? promptfooResult.stdout.slice(-3000) : "",
  promptfoo_stderr_excerpt: promptfooResult ? promptfooResult.stderr.slice(-3000) : "",
  fallback_assertions: fallbackAssertions
};
writeFileSync(".workflow/consumer-radar/promptfoo-report.json", JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exit(1);
