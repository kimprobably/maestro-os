#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`Missing value for ${name}`);
  return value;
}

function numericArg(name, fallback) {
  const value = Number(argValue(name, String(fallback)));
  if (!Number.isFinite(value)) throw new Error(`Invalid numeric value for ${name}`);
  return value;
}

const stage = argValue("--stage", "spec");
const dir = resolve(argValue("--dir", `.workflow/enhancement-discovery/${stage}-candidates`));
const minimum = numericArg("--minimum", stage === "spec" ? 3 : 2);
const outPath = resolve(argValue("--out", `.workflow/enhancement-discovery/evals/${stage}-candidate-ensure.json`));

const templates = {
  spec: [
    {
      name: "fallback-data-truth.md",
      body: `# Fallback Spec Candidate: Data Truth

Fallback provenance: generated because one or more model candidate branches did not produce artifacts.

This spec requires acceptance gates, non-cheating live evidence, test-driven checks, eval-driven scoring, data source provenance, and simplification.

It should reject note-only fixture disclosure when the request requires real source behavior.
`,
    },
    {
      name: "fallback-product-ux.md",
      body: `# Fallback Spec Candidate: Product UX

Fallback provenance: generated because one or more model candidate branches did not produce artifacts.

This spec requires acceptance gates for visible reviews, example content, add-more-apps behavior, non-cheating real-mode failures, test-driven checks, eval-driven scoring, data source provenance, and simplification.
`,
    },
    {
      name: "fallback-workflow-first.md",
      body: `# Fallback Spec Candidate: Workflow First

Fallback provenance: generated because one or more model candidate branches did not produce artifacts.

This spec requires acceptance gates, non-cheating checks, test-driven contract tests, eval-driven rubric scoring, data source proof, pairwise candidate comparison, and simplification before final review.
`,
    },
  ],
  architecture: [
    {
      name: "fallback-smallest-surface.md",
      body: `# Fallback Architecture Candidate: Smallest Surface

Fallback provenance: generated because one or more model architecture branches did not produce artifacts.

The architecture names files, data flow, module boundary decisions, test-driven gates, eval-driven gates, and simplification criteria.
`,
    },
    {
      name: "fallback-source-pipeline.md",
      body: `# Fallback Architecture Candidate: Source Pipeline

Fallback provenance: generated because one or more model architecture branches did not produce artifacts.

The architecture defines source adapter files, data flow, persistence boundary, test-driven gates, eval-driven gates, and simplification criteria.
`,
    },
  ],
  workflow: [
    {
      name: "fallback-direct-enhancement.md",
      body: `# Fallback Workflow Candidate: Direct Enhancement

Fallback provenance: generated because one or more model workflow branches did not produce artifacts.

The workflow requires fanout, deterministic gate checks, retry paths, eval-driven scoring, test-driven checks, live-data non-cheating gates, and simplification.
`,
    },
    {
      name: "fallback-generated-subworkflow.md",
      body: `# Fallback Workflow Candidate: Generated Subworkflow

Fallback provenance: generated because one or more model workflow branches did not produce artifacts.

The workflow requires parent-child fanout, live-data gate checks, retry paths, eval-driven scoring, test-driven checks, handoff artifacts, and simplification.
`,
    },
  ],
};

mkdirSync(dir, { recursive: true });
const existingBefore = readdirSync(dir).filter((file) => file.endsWith(".md")).sort();
const generated = [];
const candidates = templates[stage] || templates.spec;
let index = 0;
while (existingBefore.length + generated.length < minimum) {
  const template = candidates[index % candidates.length];
  const file = resolve(dir, template.name);
  if (!existsSync(file)) {
    writeFileSync(file, template.body.endsWith("\n") ? template.body : `${template.body}\n`);
    generated.push(template.name);
  }
  index += 1;
  if (index > candidates.length * 3) break;
}

const existingAfter = readdirSync(dir).filter((file) => file.endsWith(".md")).sort();
const report = {
  ok: existingAfter.length >= minimum,
  stage,
  dir,
  minimum,
  existing_count: existingBefore.length,
  generated_count: generated.length,
  existing_before: existingBefore,
  generated,
  candidate_count: existingAfter.length,
  candidates: existingAfter,
  files: existingAfter,
  fallback_generated: generated.length > 0,
  fallback_provenance: generated.length > 0,
};

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exit(1);
