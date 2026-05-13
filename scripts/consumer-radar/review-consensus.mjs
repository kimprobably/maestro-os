#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
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
const minimumActiveReviews = Number(argValue("--minimum-active-reviews", "1"));

function directReviewFiles(dir) {
  return existsSync(dir)
    ? readdirSync(dir).filter((file) => file.endsWith(".json")).map((file) => join(dir, file))
    : [];
}

function walkReviewFiles(dir, found = []) {
  if (!existsSync(dir)) return found;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      walkReviewFiles(fullPath, found);
    } else if (entry.isFile() && /\/\.workflow\/consumer-radar\/reviews\/[^/]+\.json$/.test(fullPath)) {
      found.push(fullPath);
    }
  }
  return found;
}

function readReview(file) {
  const review = JSON.parse(readFileSync(file, "utf8"));
  return { ...review, source: file, mtimeMs: statSync(file).mtimeMs };
}

const byReviewer = new Map();
for (const review of [
  ...directReviewFiles(reviewDir),
  ...walkReviewFiles(".fabro/scratch")
].map(readReview)) {
  const key = `${review.role || "unknown"}:${review.model || review.source}`;
  const existing = byReviewer.get(key);
  if (!existing || review.mtimeMs > existing.mtimeMs) byReviewer.set(key, review);
}

const reviews = [...byReviewer.values()];
const active = reviews.filter((row) => !row.skipped && row.ok !== false);
const parsed = active.map((row) => row.parsed).filter(Boolean);
const scores = parsed.map((row) => Number(row.score)).filter((score) => Number.isFinite(score));
const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
const blockers = parsed.flatMap((row) => row.findings || []).filter((finding) => /blocker|critical|high/i.test(String(finding.severity)));
const insufficientReviews = active.length < minimumActiveReviews;
const report = {
  ok: blockers.length === 0 && !insufficientReviews,
  verdict: blockers.length === 0 && !insufficientReviews ? "APPROVE" : "REVISE",
  review_count: reviews.length,
  active_review_count: active.length,
  minimum_active_reviews: minimumActiveReviews,
  skipped_review_count: reviews.length - active.length,
  failed_review_count: reviews.filter((row) => row.ok === false).length,
  review_sources: reviews.map((row) => row.source),
  average_model_score: avg == null ? null : Number(avg.toFixed(2)),
  blockers,
  hard_failures: insufficientReviews ? ["Not enough active OpenRouter reviews"] : [],
  note: active.length === 0 ? "All model reviews skipped; deterministic gates are authoritative for this run." : "Consensus synthesized from available OpenRouter reviews."
};
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exit(1);
