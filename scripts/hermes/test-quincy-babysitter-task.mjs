import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

const script = "scripts/hermes/quincy-babysitter-task.mjs";

function run(args, env = {}) {
  return spawnSync(process.execPath, [script, ...args], {
    env: { ...process.env, ...env },
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

test("quincy babysitter task dry-run creates idempotent Kanban command", () => {
  const result = run([
    "--run-id",
    "01KRYZDZ1WJHFP0ZEH9EY09QW1",
    "--source-channel",
    "C0AHCRH4EP4",
    "--source-thread",
    "1779130250.583759",
    "--report-channel",
    "C_FABRO_RUNS",
    "--dry-run",
  ]);
  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.idempotency_key, "fabro-run:01KRYZDZ1WJHFP0ZEH9EY09QW1");
  assert.deepEqual(payload.command.slice(0, 4), [
    "hermes",
    "kanban",
    "create",
    "Babysit Fabro run 01KRYZDZ1WJHFP0ZEH9EY09QW1",
  ]);
  assert.match(payload.body, /Assigned owner: Quincy/);
  assert.match(payload.body, /Report channel: C_FABRO_RUNS/);
  assert.match(payload.body, /Original Slack thread: C0AHCRH4EP4:1779130250.583759/);
  assert.match(payload.body, /Write Fabro run ledger updates/);
  assert.match(payload.body, /Do not post as Quincy in the original Slack thread/);
});

test("quincy babysitter task defaults to real Fabro or home channel env", () => {
  const result = run(
    [
      "--run-id",
      "01KRYZDZ1WJHFP0ZEH9EY09QW1",
      "--source-channel",
      "C0AHCRH4EP4",
      "--source-thread",
      "1779130250.583759",
      "--dry-run",
    ],
    {
      SLACK_FABRO_RUNS_CHANNEL: "",
      FABRO_SLACK_CHANNEL_ID: "C_REAL_RUNS",
      SLACK_HOME_CHANNEL: "C_HOME",
    },
  );
  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout);
  assert.match(payload.body, /Report channel: C_REAL_RUNS/);
  assert.doesNotMatch(payload.body, /C_FABRO_RUNS/);
});

test("quincy babysitter task rejects unsafe or missing run ids", () => {
  const unsafe = run(["--run-id", "../bad", "--dry-run"]);
  assert.equal(unsafe.status, 2);
  assert.match(unsafe.stderr, /run id must contain only/);

  const missing = run(["--run-id", "--dry-run"]);
  assert.equal(missing.status, 2);
  assert.match(missing.stderr, /usage:/);
});
