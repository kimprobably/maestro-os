#!/usr/bin/env node
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const parentWorkflow = "workflows/iphone-app-factory/iterate-existing-app-features.fabro";
const daytonaConfig = "workflows/iphone-app-factory/iterate-existing-app-features.daytona.toml";
const waketaskConfig = "workflows/iphone-app-factory/iterate-existing-app-features.waketask.railway.toml";
const childWorkflows = [
  "feature-workflow-preflight-stage.fabro",
  "feature-context-intake-stage.fabro",
  "feature-research-stage.fabro",
  "feature-existing-app-audit-stage.fabro",
  "feature-spec-stage.fabro",
  "feature-implementation-plan-stage.fabro",
  "feature-implementation-stage.fabro",
  "feature-validation-stage.fabro",
  "feature-publish-postmortem-stage.fabro",
];

function read(path) {
  assert.ok(existsSync(path), `Expected ${path} to exist`);
  return readFileSync(path, "utf8");
}

test("existing-app feature parent workflow calls reusable child workflows", () => {
  const graph = read(parentWorkflow);
  for (const child of childWorkflows) {
    assert.match(graph, new RegExp(`stack\\.child_workflow="./${child.replaceAll(".", "\\.")}"`));
  }
  for (const node of [
    "feature_workflow_preflight",
    "context_intake_child",
    "research_child",
    "existing_app_audit_child",
    "feature_spec_child",
    "implementation_plan_child",
    "implementation_child",
    "validation_child",
    "publish_postmortem_child",
  ]) {
    assert.ok(graph.includes(node), `missing parent node ${node}`);
  }
  assert.match(graph, /context_intake_child -> research_child \[condition="outcome=succeeded"\]/);
  assert.match(graph, /research_child -> existing_app_audit_child \[condition="outcome=succeeded"\]/);
  assert.match(graph, /existing_app_audit_child -> feature_spec_child \[condition="outcome=succeeded"\]/);
});

test("parent workflow repair edges are unconditional fallbacks behind success routes", () => {
  const graph = read(parentWorkflow);
  for (const [source, successTarget] of [
    ["feature_workflow_preflight", "context_intake_child"],
    ["context_intake_child", "research_child"],
    ["research_child", "existing_app_audit_child"],
    ["existing_app_audit_child", "feature_spec_child"],
    ["feature_spec_child", "implementation_plan_child"],
    ["implementation_plan_child", "implementation_child"],
    ["implementation_child", "validation_child"],
    ["validation_child", "publish_postmortem_child"],
    ["publish_postmortem_child", "exit"],
  ]) {
    assert.match(graph, new RegExp(`${source} -> ${successTarget} \\[condition="outcome=succeeded"\\]`));
  }
  for (const label of [
    "Fix Workflow/Environment",
    "Fix Context",
    "Research Context Fix",
    "Audit Context Fix",
    "Fix Feature Spec",
    "Fix Mapping",
    "Fix Implementation",
    "Fix Validation Failures",
    "Complete Handoff/Postmortem",
  ]) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    assert.match(
      graph,
      new RegExp(`\\[label="${escaped}"\\]`),
      `${label} must be modeled as a fallback edge`,
    );
  }
});

test("generic feature workflows do not hardcode WakeTask specifics", () => {
  for (const file of [parentWorkflow, ...childWorkflows.map((child) => `workflows/iphone-app-factory/${child}`)]) {
    const graph = read(file);
    assert.doesNotMatch(graph, /WakeTask|waketask|task_alarm|mission_task_picker/);
    assert.match(graph, /existing-app-feature/);
    assert.match(graph, /no secrets|do not print environment variables/i);
  }
});

test("feature workflow stages use deterministic gates", () => {
  const expected = {
    "feature-context-intake-stage.fabro": "feature-context-gate.mjs",
    "feature-research-stage.fabro": "feature-research-gate.mjs",
    "feature-existing-app-audit-stage.fabro": "existing-app-audit-gate.mjs",
    "feature-spec-stage.fabro": "feature-spec-gate.mjs",
    "feature-implementation-plan-stage.fabro": "feature-implementation-plan-gate.mjs",
    "feature-implementation-stage.fabro": "feature-implementation-coverage-gate.mjs",
    "feature-validation-stage.fabro": "ci-trigger-gate.mjs",
    "feature-publish-postmortem-stage.fabro": "feature-postmortem-gate.mjs",
  };
  for (const [workflow, gate] of Object.entries(expected)) {
    const graph = read(`workflows/iphone-app-factory/${workflow}`);
    assert.ok(graph.includes(gate), `${workflow} missing ${gate}`);
  }
  const implementation = read("workflows/iphone-app-factory/feature-implementation-stage.fabro");
  assert.match(implementation, /empty-action-gate\.mjs/);
});

test("feature workflow preflight is feature-specific and does not require UX Studio auth", () => {
  const preflight = read("workflows/iphone-app-factory/feature-workflow-preflight-stage.fabro");
  assert.doesNotMatch(preflight, /ux-studio-preflight\.mjs/);
  assert.match(preflight, /feature-workflow-preflight\.mjs/);
});

test("feature run configs target Railway and Daytona network access", () => {
  for (const configPath of [daytonaConfig, waketaskConfig]) {
    const config = read(configPath);
    assert.match(config, /graph = "iterate-existing-app-features\.fabro"/);
    assert.match(config, /https:\/\/fabro-maestro-production\.up\.railway\.app\/api\/v1/);
    assert.match(config, /\[run\.sandbox\.daytona\](?:(?!\n\[)[\s\S])*\bnetwork\s*=\s*"allow_all"/);
    assert.doesNotMatch(config, /localhost|127\.0\.0\.1/);
  }
});

test("WakeTask specifics live only in context and run config", () => {
  const config = read(waketaskConfig);
  const context = read("contexts/iphone-app-factory/waketask/feature-context.md");
  const pack = JSON.parse(read("contexts/iphone-app-factory/waketask/feature-pack.json"));
  assert.match(config, /mission_task_picker/);
  assert.match(context, /task-based alarm/);
  assert.deepEqual(pack.required_capabilities, [
    "mission_task_picker",
    "dismiss_blocking_mission_engine",
    "live_alarm_challenge",
    "loud_ramping_randomized_sounds",
    "completion_streak_share",
  ]);
});

test("feature prompts and gates exist", () => {
  for (const prompt of [
    "feature-context-intake.md",
    "feature-research-synthesis.md",
    "feature-existing-app-audit.md",
    "feature-spec.md",
    "feature-implementation-plan.md",
    "feature-implementation.md",
    "feature-validation-review.md",
    "feature-postmortem.md",
  ]) {
    read(`prompts/iphone-app-factory/${prompt}`);
  }
  for (const script of [
    "feature-context-gate.mjs",
    "feature-research-gate.mjs",
    "existing-app-audit-gate.mjs",
    "feature-spec-gate.mjs",
    "feature-implementation-plan-gate.mjs",
    "feature-implementation-coverage-gate.mjs",
    "empty-action-gate.mjs",
    "ci-trigger-gate.mjs",
    "feature-postmortem-gate.mjs",
  ]) {
    read(`scripts/iphone-app-factory/${script}`);
  }
});
