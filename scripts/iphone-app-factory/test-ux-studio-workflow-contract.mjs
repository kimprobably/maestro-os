#!/usr/bin/env node
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const workflowPath = "workflows/iphone-app-factory/iterate-existing-app-ux.fabro";
const daytonaPath = "workflows/iphone-app-factory/iterate-existing-app-ux.daytona.toml";

const requiredWorkflowTokens = [
  "remote_environment_preflight",
  "checkout_existing_app",
  "existing_app_intake",
  "baseline_screenshot_capture",
  "design_corpus_preflight",
  "retrieve_existing_references",
  "reference_gap_analysis",
  "research_fanout",
  "competitor_flow_research",
  "app_store_review_mining",
  "mobbin_mcp_research",
  "pageflows_research",
  "apple_hig_research",
  "behavioral_ux_research",
  "design_opportunity_synthesis",
  "design_direction_fanout",
  "calm_accountability_direction",
  "hard_wake_direction",
  "gamified_streak_direction",
  "minimal_native_direction",
  "design_cross_critique",
  "design_tournament_consensus",
  "screen_ux_spec",
  "implementation_plan_gate",
  "implement_visual_system",
  "verify_visual_system",
  "gate_visual_system",
  "implement_screen_flows",
  "verify_screen_flows",
  "gate_screen_flows",
  "screenshot_evidence_gate",
  "appium_exploratory_gate",
  "ios_quality_gate",
  "final_review_fanout",
  "ux_quality_review",
  "accessibility_review",
  "ux_final_review_gate",
  "postmortem_learning_capture",
];

const requiredFanouts = [
  "research_fanout",
  "design_direction_fanout",
  "final_review_fanout",
];

const requiredPromptFiles = [
  "prompts/iphone-app-factory/ux-existing-app-intake.md",
  "prompts/iphone-app-factory/ux-baseline-screenshot-capture.md",
  "prompts/iphone-app-factory/ux-competitor-flow-research.md",
  "prompts/iphone-app-factory/ux-mobbin-mcp-research.md",
  "prompts/iphone-app-factory/ux-pageflows-research.md",
  "prompts/iphone-app-factory/ux-apple-hig-research.md",
  "prompts/iphone-app-factory/ux-behavioral-research.md",
  "prompts/iphone-app-factory/ux-design-opportunity-synthesis.md",
  "prompts/iphone-app-factory/ux-design-direction-candidate.md",
  "prompts/iphone-app-factory/ux-design-cross-critique.md",
  "prompts/iphone-app-factory/ux-design-tournament-consensus.md",
  "prompts/iphone-app-factory/ux-screen-spec.md",
  "prompts/iphone-app-factory/ux-implementation-plan.md",
  "prompts/iphone-app-factory/ux-implement-visual-system.md",
  "prompts/iphone-app-factory/ux-implement-screen-flows.md",
  "prompts/iphone-app-factory/ux-verify-phase.md",
  "prompts/iphone-app-factory/ux-screenshot-evidence-review.md",
  "prompts/iphone-app-factory/ux-review-ux-quality.md",
  "prompts/iphone-app-factory/ux-review-accessibility.md",
  "prompts/iphone-app-factory/ux-final-consensus.md",
  "prompts/iphone-app-factory/ux-postmortem-learning-capture.md",
];

const requiredScriptFiles = [
  "scripts/iphone-app-factory/ux-studio-preflight.mjs",
  "scripts/iphone-app-factory/checkout-existing-app.mjs",
  "scripts/iphone-app-factory/run-codex-prompt.mjs",
  "scripts/iphone-app-factory/design-corpus.mjs",
  "scripts/iphone-app-factory/reference-pack-gate.mjs",
  "scripts/iphone-app-factory/ios-screenshot-manifest-gate.mjs",
  "scripts/iphone-app-factory/design-tournament-gate.mjs",
  "scripts/iphone-app-factory/ux-postmortem-gate.mjs",
  "scripts/iphone-app-factory/ux-final-review-gate.mjs",
];

function assertFileExists(path) {
  assert.ok(existsSync(path), `Expected ${path} to exist for UX studio workflow contract`);
}

function assertFilesExist(paths, label) {
  const missing = paths.filter((path) => !existsSync(path));
  assert.deepEqual(missing, [], `Missing ${label} for UX studio workflow contract`);
}

function readRequiredFile(path) {
  assertFileExists(path);
  return readFileSync(path, "utf8");
}

test("UX studio workflow files exist", () => {
  assertFilesExist([workflowPath, daytonaPath], "workflow files");
});

test("UX studio workflow contains required stages and gates", () => {
  const graph = readRequiredFile(workflowPath);
  for (const token of requiredWorkflowTokens) {
    assert.ok(graph.includes(token), `Expected ${workflowPath} to contain workflow token: ${token}`);
  }
});

test("UX studio fanouts wait for all branches", () => {
  const graph = readRequiredFile(workflowPath);
  for (const fanout of requiredFanouts) {
    const fanoutNodePattern = new RegExp(`${fanout}\\s*\\[[^\\]]*join_policy="wait_all"`, "s");
    assert.match(
      graph,
      fanoutNodePattern,
      `Expected ${fanout} in ${workflowPath} to declare join_policy="wait_all"`,
    );
  }
});

test("UX studio Daytona config allows network access", () => {
  const config = readRequiredFile(daytonaPath);
  assert.match(
    config,
    /\[run\.sandbox\.daytona\](?:(?!\n\[)[\s\S])*\bnetwork\s*=\s*"allow_all"/,
    `Expected ${daytonaPath} to set network = "allow_all" under [run.sandbox.daytona]`,
  );
});

test("UX studio workflow and Daytona config require Railway-hosted Fabro", () => {
  const graph = readRequiredFile(workflowPath);
  const config = readRequiredFile(daytonaPath);
  assert.match(graph, /https:\/\/fabro-maestro-production\.up\.railway\.app\/api\/v1/);
  assert.match(config, /fabro_server = "https:\/\/fabro-maestro-production\.up\.railway\.app\/api\/v1"/);
  assert.match(config, /FABRO_SERVER = "https:\/\/fabro-maestro-production\.up\.railway\.app\/api\/v1"/);
  assert.doesNotMatch(config, /{{\s*run\.id\s*}}/);
});

test("UX studio workflow scripts do not interpolate raw Fabro inputs", () => {
  const graph = readRequiredFile(workflowPath);
  assert.doesNotMatch(graph, /script="[^"]*{{\s*inputs\./s);
  assert.doesNotMatch(graph, /{{\s*inputs\./);
});

test("UX studio implementation stages use CLI file-writing agents", () => {
  const graph = readRequiredFile(workflowPath);
  assert.match(graph, /run-codex-prompt\.mjs --prompt prompts\/iphone-app-factory\/ux-baseline-screenshot-capture\.md/);
  assert.match(graph, /run-codex-prompt\.mjs --prompt prompts\/iphone-app-factory\/ux-implement-visual-system\.md/);
  assert.match(graph, /run-codex-prompt\.mjs --prompt prompts\/iphone-app-factory\/ux-implement-screen-flows\.md/);
  assert.doesNotMatch(graph, /provider:\s*openai/);
  assert.doesNotMatch(graph, /provider:\s*anthropic;\s*model:\s*claude-sonnet/);
});

test("UX studio prompt files exist", () => {
  assertFilesExist(requiredPromptFiles, "prompt files");
});

test("UX studio script files exist", () => {
  assertFilesExist(requiredScriptFiles, "script files");
});
