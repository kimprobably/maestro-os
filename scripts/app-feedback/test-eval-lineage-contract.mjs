#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../..");
const workDir = resolve(repoRoot, ".workflow/test-eval-lineage-contract");
const candidatesDir = resolve(workDir, "candidates");
const passingOut = resolve(workDir, "passing-report.json");
const baselinePath = resolve(workDir, "baseline.json");
const regressionOut = resolve(workDir, "regression-report.json");
const datasetPath = "evals/workflow-quality/datasets/enhancement-discovery-golden.jsonl";

rmSync(workDir, { recursive: true, force: true });
mkdirSync(candidatesDir, { recursive: true });

writeFileSync(
  resolve(candidatesDir, "candidate-a.md"),
  [
    "# Candidate A",
    "This spec defines acceptance gates, non-cheating criteria, test-driven checks, eval-driven scoring, and simplification.",
    "It uses pairwise comparison and records dataset lineage.",
  ].join("\n"),
);
writeFileSync(
  resolve(candidatesDir, "candidate-b.md"),
  [
    "# Candidate B",
    "This spec covers acceptance, non-cheating behavior, test-driven gates, eval-driven gates, and simplification.",
    "It should pass the rubric and become reproducible through lineage.",
  ].join("\n"),
);
writeFileSync(
  baselinePath,
  JSON.stringify(
    {
      score: 0.95,
      dataset_version: "workflow-quality-v1",
      rubric_version: "enhancement-discovery-rubric-v1",
    },
    null,
    2,
  ),
);

const commonArgs = [
  "scripts/app-feedback/evaluate-enhancement-artifact.mjs",
  "--stage",
  "spec",
  "--candidates",
  candidatesDir,
  "--minimum-candidates",
  "2",
  "--minimum-eval-score",
  "0.75",
  "--dataset",
  datasetPath,
  "--dataset-version",
  "workflow-quality-v1",
  "--prompt-version",
  "app-feedback-spec-candidates-v1",
  "--rubric-version",
  "enhancement-discovery-rubric-v1",
  "--judge-model",
  "deterministic-marker-v1",
  "--baseline",
  baselinePath,
];

const passing = spawnSync(
  process.execPath,
  [...commonArgs, "--out", passingOut, "--max-regression", "0.20"],
  { cwd: repoRoot, encoding: "utf8" },
);
if (passing.status !== 0) {
  process.stderr.write(passing.stderr);
  process.stdout.write(passing.stdout);
  process.exit(passing.status ?? 1);
}

if (!existsSync(passingOut)) throw new Error("passing eval report was not written");
const passingReport = JSON.parse(readFileSync(passingOut, "utf8"));

for (const key of [
  "dataset_path",
  "dataset_version",
  "dataset_sha256",
  "prompt_version",
  "rubric_version",
  "judge_model",
]) {
  if (!passingReport.lineage || !passingReport.lineage[key]) {
    throw new Error(`lineage missing ${key}`);
  }
}
if (passingReport.baseline?.score !== 0.95) throw new Error("baseline score not recorded");
if (typeof passingReport.baseline?.delta !== "number") throw new Error("baseline delta not recorded");
if (!passingReport.ok || passingReport.VERDICT !== "APPROVED") {
  throw new Error("passing report should be approved");
}

const regression = spawnSync(
  process.execPath,
  [...commonArgs, "--out", regressionOut, "--max-regression", "0.01"],
  { cwd: repoRoot, encoding: "utf8" },
);
if (regression.status === 0) throw new Error("regression gate should fail when delta exceeds max regression");
if (!existsSync(regressionOut)) throw new Error("regression eval report was not written");
const regressionReport = JSON.parse(readFileSync(regressionOut, "utf8"));
if (regressionReport.ok || regressionReport.VERDICT !== "REJECTED") {
  throw new Error("regression report should be rejected");
}
if (!regressionReport.failures.some((failure) => failure.includes("regression"))) {
  throw new Error("regression failure should mention regression");
}

console.log(
  JSON.stringify(
    {
      ok: true,
      passing_score: passingReport.selected.score,
      baseline_delta: passingReport.baseline.delta,
      regression_status: regression.status,
    },
    null,
    2,
  ),
);
