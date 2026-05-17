#!/usr/bin/env node
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const repoRoot = resolve(import.meta.dirname, "..", "..");
const script = join(repoRoot, "scripts/iphone-app-factory/reference-pack-gate.mjs");
const researchRoot = ".workflow/iphone-app-ux-studio/research";

const baseRequiredArtifacts = [
  "existing-app-intake.md",
  "reference-gap-analysis.json",
  "design-opportunity-synthesis.md",
  "reference-pack.json",
];

const supplementalResearchArtifacts = [
  "competitor-flows.md",
  "app-store-review-mining.md",
  "mobbin-mcp-research.md",
  "pageflows-research.md",
  "apple-hig-research.md",
  "behavioral-ux-research.md",
];

const requiredArtifacts = [...baseRequiredArtifacts, ...supplementalResearchArtifacts];

const promptContracts = [
  {
    path: "prompts/iphone-app-factory/ux-existing-app-intake.md",
    artifacts: [`${researchRoot}/existing-app-intake.md`, `${researchRoot}/reference-gap-analysis.json`],
  },
  {
    path: "prompts/iphone-app-factory/ux-competitor-flow-research.md",
    artifacts: [`${researchRoot}/competitor-flows.md`],
  },
  {
    path: "prompts/iphone-app-factory/ux-app-store-review-mining.md",
    artifacts: [`${researchRoot}/app-store-review-mining.md`],
  },
  {
    path: "prompts/iphone-app-factory/ux-mobbin-mcp-research.md",
    artifacts: [`${researchRoot}/mobbin-mcp-research.md`],
  },
  {
    path: "prompts/iphone-app-factory/ux-pageflows-research.md",
    artifacts: [`${researchRoot}/pageflows-research.md`],
  },
  {
    path: "prompts/iphone-app-factory/ux-apple-hig-research.md",
    artifacts: [`${researchRoot}/apple-hig-research.md`],
  },
  {
    path: "prompts/iphone-app-factory/ux-behavioral-research.md",
    artifacts: [`${researchRoot}/behavioral-ux-research.md`],
  },
  {
    path: "prompts/iphone-app-factory/ux-design-opportunity-synthesis.md",
    artifacts: [`${researchRoot}/design-opportunity-synthesis.md`, `${researchRoot}/reference-pack.json`],
  },
];

function withTempResearch(fn) {
  const dir = mkdtempSync(join(tmpdir(), "reference-pack-gate-"));
  const root = join(dir, ".workflow/iphone-app-ux-studio/research");
  mkdirSync(root, { recursive: true });
  try {
    return fn(root);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function runGate(root, args = []) {
  return spawnSync(process.execPath, [script, "--root", root, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function writeArtifact(root, name, content = "## Source List\n- Public reference\n\n## Findings\nEvidence with no credentials.\n") {
  writeFileSync(join(root, name), content);
}

function writeRequiredArtifacts(root) {
  for (const artifact of requiredArtifacts.filter((name) => name !== "reference-pack.json")) {
    const content = artifact.endsWith(".json")
      ? `${JSON.stringify({ observations: [] }, null, 2)}\n`
      : "## Source Policy\nUse public sources only.\n\n## Source List\n- Public source\n\n## Findings\nNo secrets.\n";
    writeArtifact(root, artifact, content);
  }
}

function writeBaseArtifacts(root) {
  for (const artifact of baseRequiredArtifacts.filter((name) => name !== "reference-pack.json")) {
    const content = artifact.endsWith(".json")
      ? `${JSON.stringify({ observations: [] }, null, 2)}\n`
      : "## Source Policy\nUse public sources only.\n\n## Source List\n- Synthesized reference pack\n\n## Findings\nNo secrets.\n";
    writeArtifact(root, artifact, content);
  }
}

function reference(id, overrides = {}) {
  return {
    id,
    title: `Reference ${id}`,
    source: "app_store",
    category: "review_mining",
    screen_type: `screen-${id}`,
    what_to_adapt: "Adapt the underlying UX principle.",
    what_not_to_copy: "Do not clone proprietary layouts, copy, or visual identity.",
    ...overrides,
  };
}

function validReferencePack(overrides = {}) {
  const references = [
    reference("competitor-1", { category: "competitor_flow", source: "competitor", screen_type: "alarm-setup" }),
    reference("competitor-2", { category: "competitor_flow", source: "competitor", screen_type: "mission-builder" }),
    reference("competitor-3", { category: "competitor_flow", source: "competitor", screen_type: "wake-check" }),
    reference("competitor-4", { category: "competitor_flow", source: "competitor", screen_type: "streaks" }),
    reference("mobbin-1", { source: "mobbin", category: "pattern_library", screen_type: "onboarding" }),
    reference("mobbin-2", { source: "mobbin", category: "pattern_library", screen_type: "settings" }),
    reference("pageflows-1", { source: "pageflows", category: "pattern_library", screen_type: "paywall" }),
    reference("pageflows-2", { source: "page_flows", category: "pattern_library", screen_type: "accountability" }),
    reference("review-1", { source: "app_store", category: "review_mining", screen_type: "alarm-setup" }),
    reference("hig-1", { source: "apple_hig", category: "platform_guidance", screen_type: "wake-check" }),
    reference("behavior-1", { source: "behavioral_research", category: "behavioral_ux", screen_type: "accountability" }),
    reference("synthesis-1", { source: "synthesis", category: "opportunity", screen_type: "home" }),
  ];

  return {
    references,
    observations: [
      {
        id: "observation-1",
        what_to_adapt: "Use calm progressive setup before the alarm becomes urgent.",
        what_not_to_copy: "Do not duplicate any competitor screen or exact copy.",
      },
    ],
    screen_types: ["alarm-setup", "mission-builder", "wake-check", "streaks", "onboarding"],
    raw_assets: [
      { path: "assets/mobbin/alarm-setup.png", private_only: true },
      { path: "assets/pageflows/onboarding.png", private_only: true },
    ],
    ...overrides,
  };
}

function writeReferencePack(root, pack = validReferencePack()) {
  writeFileSync(join(root, "reference-pack.json"), `${JSON.stringify(pack, null, 2)}\n`);
}

function readReport(root) {
  return JSON.parse(readFileSync(join(root, "reference-pack-gate.json"), "utf8"));
}

test("Task 4 research prompts exist and name exact artifact outputs", () => {
  for (const contract of promptContracts) {
    const path = join(repoRoot, contract.path);
    assert.ok(existsSync(path), `Expected ${contract.path} to exist`);
    const text = readFileSync(path, "utf8");
    assert.match(text, /## Source Policy/);
    assert.match(text, /what_to_adapt/);
    assert.match(text, /what_not_to_copy/);
    assert.match(text, /Do not output secrets/i);
    assert.match(text, /Do not clone proprietary/i);
    for (const artifact of contract.artifacts) {
      assert.ok(text.includes(artifact), `Expected ${contract.path} to name ${artifact}`);
    }
  }
});

test("reference pack gate accepts a complete research reference pack", () => {
  withTempResearch((root) => {
    writeRequiredArtifacts(root);
    writeReferencePack(root);

    const result = runGate(root);

    assert.equal(result.status, 0, result.stderr);
    const report = readReport(root);
    assert.equal(report.ok, true);
    assert.equal(report.counts.total_references, 12);
    assert.equal(report.counts.competitor_flow_references, 4);
    assert.equal(report.counts.mobbin_or_pageflows_references, 4);
    assert.ok(report.counts.screen_types >= 5);
    assert.deepEqual(report.missing_supplemental_artifacts, []);
  });
});

test("reference pack gate accepts synthesized reference pack when fanout sidecars are not merged", () => {
  withTempResearch((root) => {
    writeBaseArtifacts(root);
    writeReferencePack(root);

    const result = runGate(root);

    assert.equal(result.status, 0, result.stderr);
    const report = readReport(root);
    assert.equal(report.ok, true);
    assert.equal(report.counts.total_references, 12);
    assert.deepEqual(report.missing_supplemental_artifacts.sort(), supplementalResearchArtifacts.toSorted());
  });
});

test("reference pack gate fails when a base durable artifact is missing", () => {
  withTempResearch((root) => {
    writeRequiredArtifacts(root);
    writeReferencePack(root);
    rmSync(join(root, "design-opportunity-synthesis.md"));

    const result = runGate(root);

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /missing design-opportunity-synthesis\.md/);
    assert.equal(readReport(root).ok, false);
  });
});

test("reference pack gate enforces reference counts and Mobbin or Page Flows coverage", () => {
  withTempResearch((root) => {
    writeRequiredArtifacts(root);
    const pack = validReferencePack({
      references: validReferencePack().references.slice(0, 7),
    });
    writeReferencePack(root, pack);

    const result = runGate(root);

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /at least 12 total references/);
    assert.match(result.stderr, /at least 4 Mobbin or Page Flows references/);
  });
});

test("reference pack gate skips Mobbin or Page Flows minimum when Mobbin MCP is disabled", () => {
  withTempResearch((root) => {
    writeRequiredArtifacts(root);
    const references = validReferencePack().references.map((item, index) => ({
      ...item,
      source: index < 4 ? "competitor" : "app_store",
      category: index < 4 ? "competitor_flow" : "review_mining",
    }));
    writeReferencePack(root, validReferencePack({ references }));

    const result = runGate(root, ["--use-mobbin-mcp", "false"]);

    assert.equal(result.status, 0, result.stderr);
    assert.equal(readReport(root).counts.mobbin_or_pageflows_references, 0);
  });
});

test("reference pack gate enforces screen type diversity and adaptation metadata", () => {
  withTempResearch((root) => {
    writeRequiredArtifacts(root);
    const lowDiversityReferences = validReferencePack().references.map((item, index) => ({
      ...item,
      screen_type: index % 2 === 0 ? "alarm-setup" : "wake-check",
    }));
    const pack = validReferencePack({
      references: lowDiversityReferences,
      screen_types: ["alarm-setup", "wake-check"],
      observations: [{ id: "missing-copy-guidance", what_to_adapt: "Keep the setup calm." }],
    });
    delete pack.references[0].what_not_to_copy;
    writeReferencePack(root, pack);

    const result = runGate(root);

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /at least 5 screen types/);
    assert.match(result.stderr, /references\[0\] missing what_not_to_copy/);
    assert.match(result.stderr, /observations\[0\] missing what_not_to_copy/);
  });
});

test("reference pack gate rejects non-private raw assets and credential-looking report values", () => {
  withTempResearch((root) => {
    writeRequiredArtifacts(root);
    writeArtifact(root, "competitor-flows.md", "## Source List\n- Public source\n\napi_key = sk-live-1234567890abcdef\n");
    const pack = validReferencePack({
      raw_assets: [{ path: "assets/competitor.png", private_only: false }],
    });
    writeReferencePack(root, pack);

    const result = runGate(root);

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /raw_assets\[0\] private_only must be true/);
    assert.match(result.stderr, /credential-looking value/);
  });
});
