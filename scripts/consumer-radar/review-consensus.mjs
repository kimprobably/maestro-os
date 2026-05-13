#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error("Missing value for " + name);
  return value;
}

const reviewDir = argValue("--reviews", ".workflow/consumer-radar/reviews");
const output = argValue("--output", ".workflow/consumer-radar/review-consensus.json");
const reviews = existsSync(reviewDir)
  ? readdirSync(reviewDir).filter((file) => file.endsWith(".json")).map((file) => JSON.parse(readFileSync(join(reviewDir, file), "utf8")))
  : [];
const active = reviews.filter((row) => !row.skipped);
const parsed = active.map((row) => row.parsed).filter(Boolean);
const scores = parsed.map((row) => Number(row.score)).filter((score) => Number.isFinite(score));
const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
const blockers = parsed.flatMap((row) => row.findings || []).filter((finding) => /blocker|critical|high/i.test(String(finding.severity)));
const report = {
  ok: blockers.length === 0,
  verdict: blockers.length === 0 ? "APPROVE" : "REVISE",
  review_count: reviews.length,
  active_review_count: active.length,
  skipped_review_count: reviews.length - active.length,
  average_model_score: avg == null ? null : Number(avg.toFixed(2)),
  blockers,
  note: active.length === 0 ? "All model reviews skipped; deterministic gates are authoritative for this run." : "Consensus synthesized from available OpenRouter reviews."
};
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exit(1);
