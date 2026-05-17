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

test("WakeTask child command gates do not emit stdout blobs into parent context", () => {
  const commandWorkflowPaths = [
    "workflows/iphone-app-factory/waketask-workflow-preflight-stage.fabro",
    "workflows/iphone-app-factory/waketask-product-spec-stage.fabro",
    "workflows/iphone-app-factory/waketask-validation-postmortem-stage.fabro",
  ];
  const graph = readRequiredFile("workflows/iphone-app-factory/waketask-workflow-preflight-stage.fabro");
  const redirectIndex = graph.indexOf("> .workflow/waketask-product-iteration/workflow-preflight.log 2>&1");
  const summaryEmitIndex = graph.indexOf("&& node -e");
  assert.match(graph, /workflow-preflight\.log/);
  assert.match(graph, /> \.workflow\/waketask-product-iteration\/workflow-preflight\.log 2>&1/);
  assert.ok(redirectIndex > 0, "Expected validator output to be redirected to a log artifact");
  assert.ok(summaryEmitIndex > redirectIndex, "Expected artifact-writing summary code after verbose logs");

  for (const workflowPath of commandWorkflowPaths) {
    const workflow = readRequiredFile(workflowPath);
    assert.doesNotMatch(workflow, /console\.log\(/, `Expected ${workflowPath} command gates to avoid stdout`);
  }
});

test("WakeTask child workflows only exit after validation succeeds", () => {
  const workflowEdges = [
    {
      path: "workflows/iphone-app-factory/waketask-workflow-preflight-stage.fabro",
      success: /validate_workflow_contract -> emit_contract \[condition="outcome=succeeded"\]/,
      retry: /validate_workflow_contract -> validate_workflow_contract \[label="Fix Workflow Contract"\]/,
      exit: /emit_contract -> exit \[condition="outcome=succeeded"\]/,
    },
    {
      path: "workflows/iphone-app-factory/waketask-product-spec-stage.fabro",
      success: /validate_product_spec -> exit \[condition="outcome=succeeded"\]/,
      retry: /validate_product_spec -> write_product_spec \[label="Fix Product Spec"\]/,
      exit: /write_product_spec -> validate_product_spec \[condition="outcome=succeeded"\]/,
    },
    {
      path: "workflows/iphone-app-factory/waketask-validation-postmortem-stage.fabro",
      success: /validate_postmortem_contract -> exit \[condition="outcome=succeeded"\]/,
      retry: /validate_postmortem_contract -> write_validation_postmortem \[label="Complete Postmortem"\]/,
      exit: /write_validation_postmortem -> validate_postmortem_contract \[condition="outcome=succeeded"\]/,
    },
  ];

  for (const { path, success, retry, exit } of workflowEdges) {
    const graph = readRequiredFile(path);
    assert.match(graph, success);
    assert.match(graph, retry);
    assert.match(graph, exit);
  }
});
