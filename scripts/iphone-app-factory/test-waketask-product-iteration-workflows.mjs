#!/usr/bin/env node
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const parentWorkflow = "workflows/iphone-app-factory/waketask-product-iteration.fabro";
const runConfig = "workflows/iphone-app-factory/waketask-product-iteration.railway.toml";
const childWorkflows = [
  "workflows/iphone-app-factory/waketask-workflow-preflight-stage.fabro",
  "workflows/iphone-app-factory/waketask-product-spec-stage.fabro",
  "workflows/iphone-app-factory/iterate-existing-app-ux.fabro",
  "workflows/iphone-app-factory/waketask-validation-postmortem-stage.fabro",
];

function readRequiredFile(path) {
  assert.ok(existsSync(path), `Expected ${path} to exist`);
  return readFileSync(path, "utf8");
}

test("WakeTask product iteration parent workflow exists and calls child workflows", () => {
  const graph = readRequiredFile(parentWorkflow);
  for (const child of childWorkflows) {
    const childRef = `./${child.replace("workflows/iphone-app-factory/", "")}`;
    assert.match(graph, new RegExp(`stack\\.child_workflow="${childRef.replaceAll(".", "\\.")}"`));
  }
  assert.match(graph, /type="stack\.manager_loop"/);
  assert.match(graph, /workflow_definition_preflight/);
  assert.match(graph, /product_spec_child/);
  assert.match(graph, /ux_iteration_child/);
  assert.match(graph, /validation_postmortem_child/);
});

test("WakeTask child workflows define durable stage contracts", () => {
  const requiredContractTokens = [
    "contract.artifact",
    "contract.gate",
    "contract.next_action",
    "contract.failure_classification",
  ];

  for (const workflow of childWorkflows.filter((path) => !path.endsWith("iterate-existing-app-ux.fabro"))) {
    const graph = readRequiredFile(workflow);
    for (const token of requiredContractTokens) {
      assert.ok(graph.includes(token), `Expected ${workflow} to include ${token}`);
    }
    assert.match(graph, /\.workflow\/waketask-product-iteration\//);
    assert.match(graph, /no secrets/i);
  }
});

test("WakeTask parent run config targets Railway Fabro and the parent graph", () => {
  const config = readRequiredFile(runConfig);
  assert.match(config, /graph = "waketask-product-iteration\.fabro"/);
  assert.match(config, /fabro_server = "https:\/\/fabro-maestro-production\.up\.railway\.app\/api\/v1"/);
  assert.match(config, /FABRO_SERVER = "https:\/\/fabro-maestro-production\.up\.railway\.app\/api\/v1"/);
  assert.match(config, /\[run\.sandbox\.daytona\](?:(?!\n\[)[\s\S])*\bnetwork\s*=\s*"allow_all"/);
  assert.doesNotMatch(config, /localhost|127\.0\.0\.1/);
});
