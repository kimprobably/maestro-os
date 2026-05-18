import assert from "node:assert/strict";
import test from "node:test";

import { normalizeEvalResult } from "./eval-lib.mjs";

const baseResult = {
  eval_id: "outreach.quality",
  level: "workflow",
  runner: "promptfoo",
  created_at: "2026-05-17T00:00:00.000Z",
};

const waiverMetadata = {
  waiver: {
    waiver_id: "waiver-local-1",
    accepted_by: "quincy",
    reason: "Promptfoo runner unavailable during local smoke.",
    risk_statement: "Primary judge did not execute, so quality is accepted with risk.",
    review_by: "2026-05-18T00:00:00.000Z",
    compensating_control: "Deterministic fallback checks passed.",
  },
};

test("runner pass is clean pass", () => {
  const result = normalizeEvalResult({
    ...baseResult,
    runner_status: "passed",
  });

  assert.equal(result.gate_status, "passed");
  assert.equal(result.passed, true);
  assert.equal(result.runner_status, "passed");
  assert.equal(result.fallback_status, "not_used");
  assert.equal(result.waiver_status, "none");
});

test("runner failure plus fallback pass is not clean pass", () => {
  const result = normalizeEvalResult({
    ...baseResult,
    runner_status: "failed",
    fallback_status: "passed",
  });

  assert.equal(result.gate_status, "fallback_only");
  assert.equal(result.passed, false);
  assert.equal(result.runner_status, "failed");
  assert.equal(result.fallback_status, "passed");
  assert.equal(result.waiver_status, "none");
});

test("wrapper result preserves fallback-only status", () => {
  const result = normalizeEvalResult({
    eval_id: "iphone-factory.prompt-quality",
    level: "workflow",
    runner: "promptfoo",
    runner_status: "failed",
    fallback_status: "passed",
    score: 0,
  });
  assert.equal(result.passed, false);
  assert.equal(result.gate_status, "fallback_only");
});

test("accepted waiver is explicit", () => {
  const result = normalizeEvalResult({
    ...baseResult,
    runner_status: "failed",
    fallback_status: "passed",
    waiver_status: "accepted",
    metadata: waiverMetadata,
  });

  assert.equal(result.gate_status, "waived");
  assert.equal(result.passed, true);
  assert.equal(result.runner_status, "failed");
  assert.equal(result.fallback_status, "passed");
  assert.equal(result.waiver_status, "accepted");
});

test("accepted waiver requires structured waiver evidence", () => {
  assert.throws(
    () => normalizeEvalResult({
      ...baseResult,
      runner_status: "failed",
      fallback_status: "passed",
      waiver_status: "accepted",
    }),
    /invalid waiver metadata/,
  );
});

test("required identity fields are mandatory", () => {
  assert.throws(
    () => normalizeEvalResult({
      level: "workflow",
      runner: "promptfoo",
      runner_status: "passed",
    }),
    /missing required field eval_id/,
  );
  assert.throws(
    () => normalizeEvalResult({
      eval_id: "bad.identity",
      level: "invalid",
      runner: "promptfoo",
      runner_status: "passed",
    }),
    /invalid level/,
  );
  assert.throws(
    () => normalizeEvalResult({
      eval_id: "bad.identity",
      level: "workflow",
      runner: "invalid",
      runner_status: "passed",
    }),
    /invalid runner/,
  );
});
