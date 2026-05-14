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
for (const token of [
  "research_fanout",
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
  "quality_contract_gate",
  "macos_ci_gate",
  "ai_ui_explorer",
  "appium_gate",
  "app_store_gate",
  "final_review_fanout",
  "join_policy=\"wait_all\"",
  "MOBBIN_EMAIL",
  "MOBBIN_PASSWORD"
]) {
  const haystack = `${graph}\n${requireFile("workflows/iphone-app-factory/build-iphone-app.toml")}\n${requireFile("workflows/iphone-app-factory/build-iphone-app.daytona.toml")}`;
  if (!haystack.includes(token)) failures.push(`workflow missing ${token}`);
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
  "promptfoo-prompt-quality.mjs",
  "spec-gate.mjs",
  "boilerplate-contract-gate.mjs",
  "phase-evidence-gate.mjs",
  "quality-contract-gate.mjs",
  "ios-ci-gate.mjs",
  "appium-report-gate.mjs",
  "app-store-hardening-gate.mjs",
  "publish-handoff.mjs"
]) {
  requireFile(`scripts/iphone-app-factory/${script}`);
}

if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ ok: true, workflow }));
