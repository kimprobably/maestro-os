#!/usr/bin/env node
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const parentWorkflow = "workflows/iphone-app-factory/waketask-object-proof-program.fabro";
const railwayConfig = "workflows/iphone-app-factory/waketask-object-proof-program.railway.toml";
const runbook = "docs/IPHONE-APP-OBJECT-PROOF-PROGRAM-WORKFLOW.md";
const childWorkflows = [
  "object-proof-program-preflight-stage.fabro",
  "object-proof-program-spec-stage.fabro",
  "object-proof-barcode-stage.fabro",
  "object-proof-barcode-learning-stage.fabro",
  "object-proof-preset-vision-stage.fabro",
  "object-proof-preset-vision-learning-stage.fabro",
  "object-proof-same-object-stage.fabro",
  "object-proof-same-object-learning-stage.fabro",
  "object-proof-publish-postmortem-stage.fabro",
];

const stageCapabilities = {
  barcode: [
    "barcode_target_registration",
    "barcode_scan_camera_flow",
    "barcode_dismiss_blocking",
    "barcode_eval_coverage",
  ],
  preset_vision: [
    "preset_object_picker",
    "local_vision_classification",
    "photo_dismiss_blocking",
    "vision_eval_coverage",
  ],
  same_object: [
    "reference_object_registration",
    "same_object_matching",
    "reference_privacy_storage",
    "same_object_eval_coverage",
  ],
};

const requiredPrompts = [
  "object-proof-program-spec.md",
  "object-proof-stage-implementation.md",
  "object-proof-stage-learning.md",
  "object-proof-program-final-postmortem.md",
];

const requiredScripts = [
  "object-proof-program-preflight.mjs",
  "object-proof-program-spec-gate.mjs",
  "object-proof-stage-gate.mjs",
  "object-proof-learning-gate.mjs",
  "object-proof-final-gate.mjs",
];

function read(path) {
  assert.ok(existsSync(path), `Expected ${path} to exist`);
  return readFileSync(path, "utf8");
}

function assertNoLocalFabro(path) {
  const text = read(path);
  assert.doesNotMatch(text, /localhost|127\.0\.0\.1/, `${path} must not target local Fabro`);
}

test("object-proof parent workflow calls every sequential child workflow", () => {
  const graph = read(parentWorkflow);
  for (const child of childWorkflows) {
    assert.match(graph, new RegExp(`stack\\.child_workflow="./${child.replaceAll(".", "\\.")}"`));
  }

  for (const edge of [
    "workflow_preflight_child -> program_spec_child",
    "program_spec_child -> barcode_stage_child",
    "barcode_stage_child -> barcode_learning_child",
    "barcode_learning_child -> preset_vision_stage_child",
    "preset_vision_stage_child -> preset_vision_learning_child",
    "preset_vision_learning_child -> same_object_stage_child",
    "same_object_stage_child -> same_object_learning_child",
    "same_object_learning_child -> publish_postmortem_child",
    "publish_postmortem_child -> exit",
  ]) {
    assert.match(graph, new RegExp(`${edge} \\[condition="outcome=succeeded"\\]`), `missing success edge ${edge}`);
  }
});

test("object-proof workflow targets Railway Fabro and hosted Daytona network", () => {
  const config = read(railwayConfig);
  assert.match(config, /graph = "waketask-object-proof-program\.fabro"/);
  assert.match(config, /https:\/\/fabro-maestro-production\.up\.railway\.app\/api\/v1/);
  assert.match(config, /\[run\.sandbox\.daytona\](?:(?!\n\[)[\s\S])*\bnetwork\s*=\s*"allow_all"/);
  assert.match(config, /base_branch = "feature\/waketask-mission-engine-20260517"/);
  assert.match(config, /run_branch = "feature\/waketask-object-proof-program-20260519"/);
  assert.match(config, /CODEX_MCP_CREDENTIALS_JSON_BASE64 = "\{\{ env\.CODEX_MCP_CREDENTIALS_JSON_BASE64 \}\}"/);
  assertNoLocalFabro(railwayConfig);
  assertNoLocalFabro(parentWorkflow);
});

test("object-proof preflight validates contracts, Railway, contexts, and checkout", () => {
  const preflight = read("workflows/iphone-app-factory/object-proof-program-preflight-stage.fabro");
  assert.match(preflight, /test-object-proof-program-workflow-contract\.mjs/);
  assert.match(preflight, /object-proof-program-preflight\.mjs/);
  assert.match(preflight, /checkout-existing-app\.mjs/);
  assert.match(preflight, /https:\/\/fabro-maestro-production\.up\.railway\.app\/api\/v1/);
  assertNoLocalFabro("workflows/iphone-app-factory/object-proof-program-preflight-stage.fabro");
});

test("object-proof implementation children set stage variables and gates", () => {
  const workflows = {
    barcode: "workflows/iphone-app-factory/object-proof-barcode-stage.fabro",
    preset_vision: "workflows/iphone-app-factory/object-proof-preset-vision-stage.fabro",
    same_object: "workflows/iphone-app-factory/object-proof-same-object-stage.fabro",
  };

  for (const [stage, path] of Object.entries(workflows)) {
    const graph = read(path);
    assert.match(graph, new RegExp(`STAGE_ID=${stage}`));
    assert.match(graph, /run-codex-prompt\.mjs/);
    assert.match(graph, /object-proof-stage-implementation\.md/);
    assert.match(graph, /object-proof-stage-gate\.mjs/);
    assert.match(graph, new RegExp(`\\.workflow/object-proof-program/stages/${stage}`));
    for (const capability of stageCapabilities[stage]) {
      assert.match(graph, new RegExp(capability), `${path} missing capability ${capability}`);
    }
  }
});

test("object-proof learning children and final child have deterministic gates", () => {
  for (const stage of ["barcode", "preset-vision", "same-object"]) {
    const graph = read(`workflows/iphone-app-factory/object-proof-${stage}-learning-stage.fabro`);
    assert.match(graph, /object-proof-stage-learning\.md/);
    assert.match(graph, /object-proof-learning-gate\.mjs/);
    assert.match(graph, new RegExp(`iphone-object-proof\\.${stage}\\.learning\\.call`));
  }

  const final = read("workflows/iphone-app-factory/object-proof-publish-postmortem-stage.fabro");
  assert.match(final, /publish-existing-app-branch\.mjs/);
  assert.match(final, /object-proof-program-final-postmortem\.md/);
  assert.match(final, /object-proof-final-gate\.mjs/);
});

test("object-proof prompts, gates, docs, and design artifacts exist", () => {
  for (const prompt of requiredPrompts) {
    const text = read(`prompts/iphone-app-factory/${prompt}`);
    assert.match(text, /No Secrets|Do not print secrets/i);
  }
  for (const script of requiredScripts) {
    read(`scripts/iphone-app-factory/${script}`);
  }
  read("docs/superpowers/specs/2026-05-19-object-proof-feature-program-design.md");
  read("docs/superpowers/plans/2026-05-19-object-proof-feature-program.md");
  read(runbook);
});

test("object-proof files do not contain secret-looking values", () => {
  const paths = [
    parentWorkflow,
    railwayConfig,
    runbook,
    ...childWorkflows.map((child) => `workflows/iphone-app-factory/${child}`),
    ...requiredPrompts.map((prompt) => `prompts/iphone-app-factory/${prompt}`),
    ...requiredScripts.map((script) => `scripts/iphone-app-factory/${script}`),
  ];
  const secretPattern = /\bsk[-_][A-Za-z0-9][A-Za-z0-9_-]{10,}|xox[baprs]-[A-Za-z0-9-]{8,}|xapp-[A-Za-z0-9-]{8,}|Bearer\s+[A-Za-z0-9._~+/=-]{12,}|(?:password|token)\s*[:=]\s*["'][A-Za-z0-9_./+=:@-]{8,}/i;
  for (const path of paths) {
    assert.doesNotMatch(read(path), secretPattern, `${path} contains a secret-looking value`);
  }
});
