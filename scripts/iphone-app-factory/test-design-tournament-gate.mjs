#!/usr/bin/env node
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const repoRoot = resolve(import.meta.dirname, "..", "..");
const gate = join(repoRoot, "scripts/iphone-app-factory/design-tournament-gate.mjs");
const defaultConsensusPath = ".workflow/iphone-app-ux-studio/design/tournament-consensus.json";
const defaultGatePath = ".workflow/iphone-app-ux-studio/design/tournament-gate.json";

const requiredScores = [
  "differentiation",
  "native_ios_quality",
  "wake_state_usability",
  "conversion_potential",
  "accessibility",
  "implementation_risk",
  "visual_distinctiveness",
];

const requiredScreens = [
  "onboarding",
  "home",
  "primary_list",
  "create_edit",
  "active_task",
  "completion",
  "history_streaks",
  "profile_settings",
  "paywall_subscription",
];

function withTempDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), "design-tournament-gate-"));
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function writeConsensus(cwd, consensus) {
  const path = join(cwd, defaultConsensusPath);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(consensus, null, 2)}\n`);
}

function runGate(cwd, args = []) {
  return spawnSync(process.execPath, [gate, ...args], {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function direction(label, selected = false) {
  return {
    label,
    selected,
    scores: Object.fromEntries(requiredScores.map((score) => [score, 4])),
    rejection_reason: selected ? null : `${label} is weaker for the selected product strategy.`,
    screen_level_implications: Object.fromEntries(
      requiredScreens.map((screen) => [screen, `${label} ${screen} implication`]),
    ),
  };
}

function validConsensus() {
  return {
    directions: [
      direction("calm_accountability_direction"),
      direction("hard_wake_direction"),
      direction("gamified_streak_direction", true),
      direction("minimal_native_direction"),
    ],
    winner: {
      label: "gamified_streak_direction",
      rationale: "Best balance of distinctiveness and repeated wake-state use.",
      screen_level_implications: {
        onboarding: "Selected onboarding implication",
        home: "Selected home implication",
        "primary list": "Selected primary list implication",
        "create/edit": "Selected create/edit implication",
        "active task": "Selected active task implication",
        completion: "Selected completion implication",
        "history/streaks": "Selected history/streaks implication",
        "profile/settings": "Selected profile/settings implication",
        "paywall/subscription": "Selected paywall/subscription implication",
      },
    },
    consensus: "The product adapts patterns from references but does not clone layouts, assets, copy, or proprietary interaction sequences.",
    no_clone_statement: "No clone: adapt principles only; do not copy another app's brand, screenshots, assets, or distinctive composition.",
  };
}

test("design tournament gate rejects incomplete consensus artifacts", () => {
  withTempDir((dir) => {
    writeConsensus(dir, {
      directions: [
        {
          label: "calm_accountability_direction",
          scores: {
            differentiation: 4,
          },
        },
        direction("hard_wake_direction"),
      ],
      winner: null,
      no_clone_statement: "",
    });

    const result = runGate(dir);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /at least three design directions/i);
    assert.match(result.stderr, /missing score native_ios_quality/i);
    assert.match(result.stderr, /winner/i);
    assert.match(result.stderr, /no-clone statement/i);

    const reportPath = join(dir, defaultGatePath);
    assert.ok(existsSync(reportPath), "gate should write a report even when validation fails");
    const report = JSON.parse(readFileSync(reportPath, "utf8"));
    assert.equal(report.ok, false);
  });
});

test("design tournament gate accepts adversarial consensus with selected winner", () => {
  withTempDir((dir) => {
    writeConsensus(dir, validConsensus());

    const result = runGate(dir);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /"ok":true/);

    const report = JSON.parse(readFileSync(join(dir, defaultGatePath), "utf8"));
    assert.equal(report.ok, true);
    assert.equal(report.winner, "gamified_streak_direction");
    assert.equal(report.direction_count, 4);
    assert.deepEqual(report.required_scores, requiredScores);
  });
});

test("design tournament gate writes to --out when provided", () => {
  withTempDir((dir) => {
    const consensus = validConsensus();
    consensus.winner.label = "calm_accountability_direction";
    consensus.directions = [
      direction("calm_accountability_direction", true),
      direction("hard_wake_direction"),
      direction("minimal_native_direction"),
    ];
    writeConsensus(dir, consensus);

    const outPath = ".workflow/custom/tournament-gate.json";
    const result = runGate(dir, ["--out", outPath]);
    assert.equal(result.status, 0, result.stderr);
    assert.ok(existsSync(join(dir, outPath)));
    assert.equal(existsSync(join(dir, defaultGatePath)), false);
  });
});

test("design tournament gate rejects score values outside one to five", () => {
  withTempDir((dir) => {
    const consensus = validConsensus();
    consensus.directions[0].scores.differentiation = 99;
    writeConsensus(dir, consensus);

    const result = runGate(dir);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /score differentiation must be a number from 1 to 5/i);
  });
});

test("design tournament gate rejects multiple selected directions", () => {
  withTempDir((dir) => {
    const consensus = validConsensus();
    consensus.directions[0].selected = true;
    writeConsensus(dir, consensus);

    const result = runGate(dir);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /exactly one direction must be selected/i);
  });
});

test("design tournament gate rejects selected direction and winner mismatch", () => {
  withTempDir((dir) => {
    const consensus = validConsensus();
    consensus.winner.label = "hard_wake_direction";
    writeConsensus(dir, consensus);

    const result = runGate(dir);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /selected direction gamified_streak_direction must match winner hard_wake_direction/i);
  });
});

test("design tournament gate rejects missing required winner screen implication", () => {
  withTempDir((dir) => {
    const consensus = validConsensus();
    delete consensus.winner.screen_level_implications["active task"];
    delete consensus.directions[2].screen_level_implications.active_task;
    writeConsensus(dir, consensus);

    const result = runGate(dir);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /winner missing screen-level implication active_task/i);
  });
});

test("design tournament gate rejects missing top-level winner object", () => {
  withTempDir((dir) => {
    const consensus = validConsensus();
    delete consensus.winner;
    writeConsensus(dir, consensus);

    const result = runGate(dir);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /top-level winner object is required/i);
  });
});

test("design tournament gate rejects string-only winner", () => {
  withTempDir((dir) => {
    const consensus = validConsensus();
    consensus.winner = "gamified_streak_direction";
    writeConsensus(dir, consensus);

    const result = runGate(dir);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /top-level winner object is required/i);
  });
});

test("design tournament gate rejects winner without rationale", () => {
  withTempDir((dir) => {
    const consensus = validConsensus();
    consensus.winner.rationale = " ";
    writeConsensus(dir, consensus);

    const result = runGate(dir);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /winner rationale is required/i);
  });
});

test("design tournament gate rejects winner object missing canonical screen ids", () => {
  withTempDir((dir) => {
    const consensus = validConsensus();
    delete consensus.winner.screen_level_implications["profile/settings"];
    writeConsensus(dir, consensus);

    const result = runGate(dir);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /winner missing screen-level implication profile_settings/i);
  });
});
