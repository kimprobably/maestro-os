#!/usr/bin/env node
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

const report = {
  ok: failures.length === 0,
  VERDICT: failures.length === 0 ? "APPROVED" : "REJECTED",
  stage,
  candidates_dir: candidatesDir,
  candidate_count,
  minimum_candidates: minimumCandidates,
  minimum_eval_score,
  rubric,
  scores,
  selected: best,
  failures,
};

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exit(1);
