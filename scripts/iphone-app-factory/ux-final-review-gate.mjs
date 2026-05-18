#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const DEFAULT_OUT = ".workflow/iphone-app-ux-studio/final-review-gate.json";
const REQUIRED_REVIEWS = [
  ".workflow/iphone-app-ux-studio/reviews/ux-quality.md",
  ".workflow/iphone-app-ux-studio/reviews/accessibility.md",
  ".workflow/iphone-app-factory/reviews/product-fidelity.md",
  ".workflow/iphone-app-factory/reviews/ios-architecture.md",
  ".workflow/iphone-app-factory/reviews/security-privacy.md",
  ".workflow/iphone-app-factory/reviews/release-readiness.md",
];

function argValue(name, fallback = null) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`Missing value for ${name}`);
  return value;
}

function secretFindings(text) {
  const patterns = [
    /\b(?:api[_-]?key|secret|password|passwd|token|access[_-]?token|refresh[_-]?token|client[_-]?secret)\b\s*[:=]\s*["']?[A-Za-z0-9_./+=:@-]{8,}/gi,
    /\bBearer\s+[A-Za-z0-9._~+/=-]{12,}/gi,
    /\b(?:sk|pk|rk|xox[baprs]|gh[pousr])-[A-Za-z0-9_-]{10,}/gi,
    /\bapify_api_[A-Za-z0-9_-]+/gi,
  ];
  return patterns.flatMap((pattern) => Array.from(text.matchAll(pattern), (match) => match[0]));
}

function reviewStatus(path) {
  if (!existsSync(path)) return { path, status: "missing", verdict: null, failures: [`missing review artifact: ${path}`] };

  const text = readFileSync(path, "utf8");
  const trimmed = text.trim();
  const verdict = trimmed.match(/VERDICT:\s*(APPROVED|REJECTED)/i)?.[1]?.toUpperCase() || null;
  const blockingMatches = [...trimmed.matchAll(/(?:^|\n)\s*-\s*blocking:|(?:^|\n)\s*blocking:/gi)].map((match) => match[0].trim());
  const secrets = secretFindings(text);
  const failures = [];

  if (!trimmed) failures.push(`empty review artifact: ${path}`);
  if (!verdict) failures.push(`missing verdict line in review artifact: ${path}`);
  if (verdict === "REJECTED") failures.push(`review rejected: ${path}`);
  if (blockingMatches.length > 0) failures.push(`review contains blocking finding: ${path}`);
  if (secrets.length > 0) failures.push(`secret-looking value found in review artifact: ${path}`);

  return {
    path,
    status: failures.length === 0 ? "approved" : "rejected",
    verdict,
    bytes: Buffer.byteLength(text),
    blocking_count: blockingMatches.length,
    secret_finding_count: secrets.length,
    failures,
  };
}

const outPath = argValue("--out", DEFAULT_OUT);
const required = (argValue("--required") || REQUIRED_REVIEWS.join(","))
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const reviews = required.map(reviewStatus);
const failures = reviews.flatMap((review) => review.failures);
const report = { ok: failures.length === 0, required, reviews, failures };

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);
if (!report.ok) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}
console.log(JSON.stringify(report));
