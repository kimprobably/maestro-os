#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

function argValue(name, fallback = null) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`Missing value for ${name}`);
  return value;
}

const mode = argValue("--mode", "implementation");
const reviewsDir = argValue("--reviews-dir", ".workflow/iphone-app-factory/reviews");
const outPath = argValue("--out", `.workflow/iphone-app-factory/${mode}-review-fan-in-gate.json`);
const requiredByMode = {
  implementation: [
    "implementation-correctness.md",
    "implementation-tests.md",
    "implementation-security.md",
    "implementation-boilerplate.md",
  ],
  final: [
    "product-fidelity.md",
    "ios-architecture.md",
    "security-privacy.md",
    "code-quality.md",
    "release-readiness.md",
    "qa-evidence.md",
  ],
};
const required = (argValue("--required") || requiredByMode[mode]?.join(",") || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

if (required.length === 0) throw new Error(`No required reviews configured for mode ${mode}`);

const failures = [];
const reviews = [];

for (const fileName of required) {
  const path = join(reviewsDir, fileName);
  if (!existsSync(path)) {
    failures.push(`missing review artifact: ${path}`);
    reviews.push({ path, status: "missing" });
    continue;
  }

  const text = readFileSync(path, "utf8");
  const trimmed = text.trim();
  const verdict = trimmed.match(/VERDICT:\s*(APPROVED|REJECTED)/i)?.[1]?.toUpperCase() || null;
  const blockingMatches = [...trimmed.matchAll(/(?:^|\n)\s*-\s*blocking:|(?:^|\n)\s*blocking:/gi)].map((match) =>
    match[0].trim(),
  );
  const status = verdict === "REJECTED" || blockingMatches.length > 0 ? "rejected" : "approved";

  if (trimmed.length === 0) failures.push(`empty review artifact: ${path}`);
  if (!verdict) failures.push(`missing verdict line in review artifact: ${path}`);
  if (verdict === "REJECTED") failures.push(`review rejected: ${path}`);
  if (blockingMatches.length > 0) failures.push(`review contains blocking finding: ${path}`);

  reviews.push({
    path,
    status,
    verdict,
    bytes: Buffer.byteLength(text),
    blocking_count: blockingMatches.length,
  });
}

const report = {
  ok: failures.length === 0,
  mode,
  reviews_dir: reviewsDir,
  required,
  reviews,
  failures,
};

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);
if (!report.ok) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}
console.log(JSON.stringify(report));
