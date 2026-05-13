#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`Missing value for ${name}`);
  return value;
}

function numericArg(name, fallback) {
  const parsed = Number(argValue(name, String(fallback)));
  if (!Number.isFinite(parsed)) throw new Error(`Invalid numeric value for ${name}`);
  return parsed;
}

const stage = argValue("--stage", "spec");
const candidatesDir = resolve(argValue("--candidates", ".workflow/enhancement-discovery/spec-candidates"));
const outPath = resolve(argValue("--out", `.workflow/enhancement-discovery/evals/${stage}-contract.json`));
const minimumCandidates = numericArg("--minimum-candidates", stage === "spec" ? 3 : 2);
const minimum_eval_score = numericArg("--minimum-eval-score", 0.78);
const datasetPath = argValue("--dataset", "");
const datasetVersion = argValue("--dataset-version", `${stage}-dataset-v0`);
const promptVersion = argValue("--prompt-version", `${stage}-prompt-v0`);
const rubricVersion = argValue("--rubric-version", `${stage}-rubric-v0`);
const judgeModel = argValue("--judge-model", "deterministic-marker-v1");
const baselinePath = argValue("--baseline", "");
const maxRegression = numericArg("--max-regression", 1);

const stageRubrics = {
  spec: [
    "acceptance",
    "non-cheating",
    "test-driven",
    "eval-driven",
    "data source",
    "simplification",
  ],
  architecture: [
    "files",
    "data flow",
    "boundary",
    "test-driven",
    "eval-driven",
    "simplification",
  ],
  workflow: [
    "fanout",
    "gate",
    "retry",
    "eval-driven",
    "test-driven",
    "simplification",
  ],
};

const rubric = stageRubrics[stage] || stageRubrics.spec;
const candidateFiles = existsSync(candidatesDir)
  ? readdirSync(candidatesDir)
      .filter((file) => file.endsWith(".md"))
      .sort()
      .map((file) => resolve(candidatesDir, file))
  : [];

const scores = candidateFiles.map((file) => {
  const body = readFileSync(file, "utf8").toLowerCase();
  const hits = rubric.filter((marker) => body.includes(marker)).length;
  const score = Math.round((hits / rubric.length) * 100) / 100;
  return {
    file,
    score,
    hits,
    possible: rubric.length,
    missing: rubric.filter((marker) => !body.includes(marker)),
  };
});

const best = scores.slice().sort((a, b) => b.score - a.score)[0] || null;
const candidate_count = scores.length;
const failures = [];
if (candidate_count < minimumCandidates) {
  failures.push(`expected at least ${minimumCandidates} ${stage} candidates, found ${candidate_count}`);
}
if (!best || best.score < minimum_eval_score) {
  failures.push(`best ${stage} score is below minimum_eval_score ${minimum_eval_score}`);
}

function sha256File(path) {
  if (!path) return null;
  if (!existsSync(path)) return null;
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function readBaseline(path) {
  if (!path || !existsSync(path)) return null;
  const parsed = JSON.parse(readFileSync(path, "utf8"));
  const score = Number(parsed.score ?? parsed.selected?.score ?? parsed.baseline?.score);
  if (!Number.isFinite(score)) return null;
  return {
    path,
    score,
    dataset_version: parsed.dataset_version ?? parsed.lineage?.dataset_version ?? null,
    rubric_version: parsed.rubric_version ?? parsed.lineage?.rubric_version ?? null,
  };
}

const resolvedDatasetPath = datasetPath ? resolve(datasetPath) : "";
const datasetSha256 = sha256File(resolvedDatasetPath);
if (datasetPath && !datasetSha256) failures.push(`dataset not found for lineage: ${datasetPath}`);

const baselineInput = readBaseline(baselinePath ? resolve(baselinePath) : "");
const baseline = baselineInput
  ? {
      ...baselineInput,
      delta: best ? Math.round((best.score - baselineInput.score) * 10000) / 10000 : null,
      max_regression: maxRegression,
    }
  : null;
if (baseline && typeof baseline.delta === "number" && baseline.delta < -maxRegression) {
  failures.push(
    `${stage} regression ${baseline.delta} exceeds max regression ${maxRegression} from baseline ${baseline.score}`,
  );
}

const report = {
  ok: failures.length === 0,
  VERDICT: failures.length === 0 ? "APPROVED" : "REJECTED",
  stage,
  lineage: {
    dataset_path: datasetPath || null,
    dataset_version: datasetVersion,
    dataset_sha256: datasetSha256,
    prompt_version: promptVersion,
    rubric_version: rubricVersion,
    judge_model: judgeModel,
    evaluator_version: "enhancement-artifact-evaluator-v1",
    generated_at: new Date().toISOString(),
  },
  candidates_dir: candidatesDir,
  candidate_count,
  minimum_candidates: minimumCandidates,
  minimum_eval_score,
  rubric,
  scores,
  selected: best,
  baseline,
  failures,
};

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exit(1);
