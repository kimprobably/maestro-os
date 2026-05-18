#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error("Missing value for " + name);
  return value;
}

const plansDir = resolve(argValue("--plans", ".workflow/consumer-radar-live-enrichment/plans"));
const minimumCandidates = Number(argValue("--minimum-candidates", "2"));
if (!Number.isFinite(minimumCandidates) || minimumCandidates < 1) {
  throw new Error("minimum candidates must be a positive number");
}

function planFiles() {
  if (!existsSync(plansDir)) return [];
  return readdirSync(plansDir)
    .filter((file) => file.endsWith(".md"))
    .map((file) => join(plansDir, file))
    .filter((file) => readFileSync(file, "utf8").trim().length > 0);
}

const fallbackPlans = [
  {
    file: "source-first-fallback.md",
    title: "Source-First Live Enrichment Plan",
    body: `
# Source-First Live Enrichment Plan

## Scope
Build live discovery that starts from App Store and Apify source evidence, then projects that evidence into Consumer Radar rows.

## Live Data Path
- Use Apify App Store discovery or Apple Search/RSS as the first source for fast-growing USA iPhone productivity, wellness, health, fitness, positivity, and screen-time apps.
- Use Apple/iTunes review feeds to capture review samples and product feedback.
- Use Apify TikTok and Instagram actors to collect example content, creator/content strategy, and social proof.

## Acceptance Gates
- fanout: keep at least two candidate plans before implementation.
- gate: strict live-data gate requires real-mode counts for live apps, review samples, and social examples.
- retry: failed gates loop to implementation with concrete findings.
- eval-driven: score workflow and data quality with Promptfoo/local fallback reports.
- test-driven: add deterministic tests around parsing, provenance, and fixture rejection.
- simplification: remove duplicate adapters and consolidate provenance helpers after native checks.
`,
  },
  {
    file: "product-surface-fallback.md",
    title: "Product-Surface Live Enrichment Plan",
    body: `
# Product-Surface Live Enrichment Plan

## Scope
Expose the live enrichment work in the app so a user can see more apps, reviews, example content, and whether each signal is live or fixture-backed.

## Product Surface
- Add a fetch-more control for expanding the candidate set beyond the biggest category apps.
- Surface raw review samples, review themes, and requested improvements on the selected app detail panel.
- Surface TikTok/Instagram example content with source, platform, hook/caption, and live scrape provenance.

## Acceptance Gates
- fanout: preserve multiple plan candidates before implementation.
- gate: fail real mode when evidence is missing or fixture-backed.
- retry: native, live-data, qlty, Promptfoo, and review gates route back to implementation or simplification.
- eval-driven: use local eval reports and lineage to decide approval.
- test-driven: verify endpoints, UI markers, and live provenance shapes.
- simplification: simplify UI state and source adapters after the data path works.
`,
  },
];

mkdirSync(plansDir, { recursive: true });
const before = planFiles();
const created = [];
let index = 0;
while (planFiles().length < minimumCandidates && index < fallbackPlans.length) {
  const fallback = fallbackPlans[index];
  const target = join(plansDir, fallback.file);
  if (!existsSync(target)) {
    writeFileSync(target, fallback.body.trim() + "\n");
    created.push(basename(target));
  }
  index += 1;
}

const after = planFiles();
const report = {
  ok: after.length >= minimumCandidates,
  plans_dir: plansDir,
  minimum_candidates: minimumCandidates,
  before_count: before.length,
  after_count: after.length,
  created,
  candidates: after.map((file) => basename(file)),
};

const outPath = ".workflow/consumer-radar-live-enrichment/ensure-plan-candidates.json";
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exit(1);
