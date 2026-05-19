import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const entrypoint = readFileSync("hermes/deploy/railway-gateway/entrypoint.sh", "utf8");
const basePatch = readFileSync("hermes/deploy/railway-gateway/patch-hermes-base-reliability.py", "utf8");
const exampleConfig = readFileSync("hermes/config/config.example.yaml", "utf8");
const distributionConfig = readFileSync("hermes/distribution/maestro-operator/config.yaml", "utf8");
const operatorSoul = readFileSync("hermes/profiles/maestro-operator/SOUL.md", "utf8");
const distributionSoul = readFileSync("hermes/distribution/maestro-operator/SOUL.md", "utf8");

test("Railway gateway defaults allow longer Slack and delegation turns", () => {
  assert.match(entrypoint, /HERMES_GATEWAY_MAX_TURNS="\$\{HERMES_GATEWAY_MAX_TURNS:-120\}"/);
  assert.match(entrypoint, /HERMES_DELEGATION_MAX_ITERATIONS="\$\{HERMES_DELEGATION_MAX_ITERATIONS:-120\}"/);
  assert.match(entrypoint, /max\(configured_max_turns, 120\)/);
  assert.match(entrypoint, /max\(configured_max_iterations, 120\)/);
  assert.match(exampleConfig, /max_turns: 120/);
  assert.match(exampleConfig, /max_iterations: 120/);
  assert.match(distributionConfig, /max_turns: 120/);
  assert.match(distributionConfig, /max_iterations: 120/);
});

test("Slack timeout message uses user-facing Quincy babysitter language", () => {
  assert.doesNotMatch(basePatch, /worker lane/);
  assert.match(basePatch, /Quincy/);
  assert.match(basePatch, /background babysit/);
});

test("Fabro runs channel is mapped through env and has compact reporting guidance", () => {
  assert.match(entrypoint, /SLACK_FABRO_RUNS_CHANNEL/);
  assert.match(entrypoint, /FABRO_SLACK_CHANNEL_ID/);
  assert.match(entrypoint, /fabro_runs_channel/);
  assert.match(entrypoint, /merge_binding\(fabro_runs_channel, \["fabro-babysitter"\]\)/);
  assert.match(entrypoint, /set_channel_prompt\(/);
  assert.doesNotMatch(entrypoint, /or "C_FABRO_RUNS"/);
  for (const config of [exampleConfig, distributionConfig]) {
    assert.match(config, /C_FABRO_RUNS/);
    assert.match(config, /Kanban babysitter task comments/);
    assert.match(config, /Report compact status changes, blockers, approval needs, and terminal states/);
    assert.match(config, /Do not dump raw logs or secrets/);
    assert.match(config, /Quincy owns off-thread run monitoring/);
  }
});

test("Miles policy explicitly hands long Fabro runs to Quincy background babysitting", () => {
  for (const soul of [operatorSoul, distributionSoul]) {
    assert.match(soul, /scripts\/hermes\/quincy-babysitter-task\.mjs/);
    assert.match(soul, /Miles remains accountable for the original Slack thread/);
    assert.match(soul, /background babysit/);
  }
});
