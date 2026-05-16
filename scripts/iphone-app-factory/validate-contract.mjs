#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";

const workflow = "workflows/iphone-app-factory/build-iphone-app.fabro";
const failures = [];

function requireFile(path) {
  if (!existsSync(path)) {
    failures.push(`missing ${path}`);
    return "";
  }
  return readFileSync(path, "utf8");
}

const graph = requireFile(workflow);
const buildHaystack = `${graph}\n${requireFile("workflows/iphone-app-factory/build-iphone-app.toml")}\n${requireFile("workflows/iphone-app-factory/build-iphone-app.daytona.toml")}`;
for (const token of [
  "research_fanout",
  "run_input_gate",
  "research_evidence_gate",
  "prompt_quality_gate",
  "spec_fanout",
  "fidelity=\"truncate\"",
  "spec_cross_critique",
  "spec_red_team",
  "spec_kitty_gate",
  "architecture_fanout",
  "boilerplate_gate",
  "implementation_review_fanout",
  "implementation_review_gate",
  "prompt_context_budget_gate",
  "final_prompt_context_budget_gate",
  "quality_contract_gate",
  "macos_ci_gate",
  "ai_ui_explorer",
  "appium_gate",
  "app_store_gate",
  "artifact_metadata_gate",
  "final_review_fanout",
  "join_policy=\"wait_all\"",
  ".spec              { provider: openrouter",
  ".architecture      { provider: openrouter",
  ".review            { provider: openrouter",
  ".verify            { provider: openrouter",
  ".security          { provider: openrouter",
  "#spec_kimi         { provider: openrouter",
  "#spec_deepseek     { provider: openrouter",
  "MOBBIN_EMAIL",
  "MOBBIN_PASSWORD",
  "never print environment variables",
  "environment dump commands"
]) {
  if (!buildHaystack.includes(token)) failures.push(`workflow missing ${token}`);
}

for (const token of ["provider: anthropic", "claude-sonnet-4-5"]) {
  if (graph.includes(token)) failures.push(`workflow must not depend on unavailable Claude CLI route: ${token}`);
}

const promptDir = "prompts/iphone-app-factory";
for (const prompt of [
  "research-app-store.md",
  "research-reddit.md",
  "research-competitors.md",
  "research-design-patterns.md",
  "spec-candidate.md",
  "spec-cross-critique.md",
  "spec-consensus.md",
  "architecture-consensus.md",
  "boilerplate-setup.md",
  "review-implementation-correctness.md",
  "review-implementation-tests.md",
  "review-implementation-security.md",
  "review-implementation-boilerplate.md",
  "review-implementation-consensus.md",
  "ai-ui-explorer.md",
  "app-store-hardening.md",
  "final-consensus.md"
]) {
  requireFile(`${promptDir}/${prompt}`);
}

for (const evalFile of [
  "evals/iphone-app-factory/prompt-registry.json",
  "evals/iphone-app-factory/datasets/prompt-quality-golden.jsonl",
  "evals/iphone-app-factory/prompt-quality.yaml",
]) {
  requireFile(evalFile);
}

for (const script of [
  "bootstrap.mjs",
  "run-input-gate.mjs",
  "promptfoo-prompt-quality.mjs",
  "spec-gate.mjs",
  "boilerplate-contract-gate.mjs",
  "phase-evidence-gate.mjs",
  "quality-contract-gate.mjs",
  "ios-ci-gate.mjs",
  "appium-report-gate.mjs",
  "app-store-hardening-gate.mjs",
  "prompt-context-budget-gate.mjs",
  "artifact-metadata-gate.mjs",
  "research-evidence-gate.mjs",
  "publish-handoff.mjs"
]) {
  requireFile(`scripts/iphone-app-factory/${script}`);
}

const uxWorkflow = "workflows/iphone-app-factory/iterate-existing-app-ux.fabro";
const uxGraph = requireFile(uxWorkflow);
const uxDaytona = requireFile("workflows/iphone-app-factory/iterate-existing-app-ux.daytona.toml");
for (const token of [
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
]) {
  if (!uxGraph.includes(token)) failures.push(`UX studio workflow missing ${token}`);
}
for (const fanout of ["research_fanout", "design_direction_fanout", "final_review_fanout"]) {
  const fanoutNodePattern = new RegExp(`${fanout}\\s*\\[[^\\]]*join_policy="wait_all"`, "s");
  if (!fanoutNodePattern.test(uxGraph)) {
    failures.push(`UX studio workflow ${fanout} missing join_policy="wait_all"`);
  }
}
if (!/\[run\.sandbox\.daytona\](?:(?!\n\[)[\s\S])*\bnetwork\s*=\s*"allow_all"/.test(uxDaytona)) {
  failures.push(`UX studio Daytona config missing network = "allow_all" under [run.sandbox.daytona]`);
}
if (!/https:\/\/fabro-maestro-production\.up\.railway\.app\/api\/v1/.test(uxGraph)) {
  failures.push("UX studio workflow must preflight against Railway-hosted Fabro");
}
if (!/FABRO_SERVER\s*=\s*"https:\/\/fabro-maestro-production\.up\.railway\.app\/api\/v1"/.test(uxDaytona)) {
  failures.push("UX studio Daytona config must set FABRO_SERVER to Railway-hosted Fabro");
}
if (/script="[^"]*{{\s*inputs\./s.test(uxGraph) || /{{\s*inputs\./.test(uxGraph)) {
  failures.push("UX studio workflow scripts must not interpolate raw Fabro inputs");
}
for (const prompt of [
  "ux-baseline-screenshot-capture.md",
  "ux-implement-visual-system.md",
  "ux-implement-screen-flows.md",
]) {
  if (!uxGraph.includes(`run-codex-prompt.mjs --prompt prompts/iphone-app-factory/${prompt}`)) {
    failures.push(`UX studio workflow must run Codex CLI for ${prompt}`);
  }
}
if (/provider:\s*openai/.test(uxGraph) || /provider:\s*anthropic;\s*model:\s*claude-sonnet/.test(uxGraph)) {
  failures.push("UX studio workflow must not require non-configured Railway LLM providers for file-writing stages");
}
for (const prompt of [
    "ux-existing-app-intake.md",
    "ux-baseline-screenshot-capture.md",
    "ux-competitor-flow-research.md",
    "ux-mobbin-mcp-research.md",
    "ux-pageflows-research.md",
    "ux-apple-hig-research.md",
    "ux-behavioral-research.md",
    "ux-design-opportunity-synthesis.md",
    "ux-design-direction-candidate.md",
    "ux-design-cross-critique.md",
    "ux-design-tournament-consensus.md",
    "ux-screen-spec.md",
    "ux-implementation-plan.md",
    "ux-implement-visual-system.md",
    "ux-implement-screen-flows.md",
    "ux-verify-phase.md",
    "ux-screenshot-evidence-review.md",
    "ux-review-ux-quality.md",
    "ux-review-accessibility.md",
    "ux-final-consensus.md",
    "ux-postmortem-learning-capture.md",
]) {
  requireFile(`${promptDir}/${prompt}`);
}
for (const script of [
    "ux-studio-preflight.mjs",
    "checkout-existing-app.mjs",
    "run-codex-prompt.mjs",
    "design-corpus.mjs",
    "reference-pack-gate.mjs",
    "ios-screenshot-manifest-gate.mjs",
    "design-tournament-gate.mjs",
    "ux-postmortem-gate.mjs",
    "ux-final-review-gate.mjs",
  ]) {
  requireFile(`scripts/iphone-app-factory/${script}`);
}

if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ ok: true, workflow }));
