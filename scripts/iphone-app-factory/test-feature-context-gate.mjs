#!/usr/bin/env node
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const gate = "scripts/iphone-app-factory/feature-context-gate.mjs";

function writeValidContext(root, markdownExtra = "") {
  mkdirSync(join(root, "context"), { recursive: true });
  writeFileSync(
    join(root, "context-intake.md"),
    `# Feature Context Intake
## Product Goal
Make WakeTask a category-leading task-based alarm.
${markdownExtra}
## Target User
Heavy sleepers.
## Required Capabilities
- mission_task_picker
- dismiss_blocking_mission_engine
## Acceptance Criteria
- Users can select a mission.
- Dismiss is blocked until the mission succeeds.
- The alarm is loud.
## Non-Goals
- App Store submission.
## Source List
- User-provided brief.
## Reusable Artifacts
- Reference screenshots.
## No Secrets
No credentials are included.
`,
  );
  writeFileSync(
    join(root, "context", "context-pack.json"),
    `${JSON.stringify(
      {
        app_name: "WakeTask",
        feature_goal: "Task-based alarm iteration",
        target_audience: "Heavy sleepers",
        required_capabilities: ["mission_task_picker", "dismiss_blocking_mission_engine"],
        acceptance_criteria: [
          "Users can select a mission.",
          "Dismiss is blocked until the mission succeeds.",
          "The alarm is loud.",
        ],
        non_goals: ["App Store submission"],
        research_sources: ["User-provided brief"],
      },
      null,
      2,
    )}\n`,
  );
}

function runGate(root) {
  return spawnSync("node", [gate], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      FEATURE_WORKFLOW_ROOT: root,
      FEATURE_REQUIRED_CAPABILITIES: "mission_task_picker,dismiss_blocking_mission_engine",
    },
    encoding: "utf8",
  });
}

test("feature context gate allows normal task-based product language", () => {
  const root = mkdtempSync(join(tmpdir(), "feature-context-gate-"));
  writeValidContext(root);

  const result = runGate(root);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const report = JSON.parse(readFileSync(join(root, "context", "context-gate.json"), "utf8"));
  assert.equal(report.ok, true);
});

test("feature context gate rejects real key-shaped secret material", () => {
  const root = mkdtempSync(join(tmpdir(), "feature-context-gate-"));
  writeValidContext(root, "Do not include this placeholder key: sk_test_1234567890abcdef\n");

  const result = runGate(root);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /secret-looking material/);
});
