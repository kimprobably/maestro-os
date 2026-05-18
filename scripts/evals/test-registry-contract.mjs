import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";

import { loadRegistry, parseRegistryYaml, validateRegistry } from "./eval-lib.mjs";

const REGISTRY_PATH = "evals/registry.yaml";

test("registry exists and validates", () => {
  assert.equal(existsSync(REGISTRY_PATH), true);

  const registry = loadRegistry(REGISTRY_PATH);

  assert.deepEqual(validateRegistry(registry), []);
});

test("registry covers existing promptfoo eval configs", () => {
  const registry = loadRegistry(REGISTRY_PATH);
  const subjectPaths = new Set(registry.evals.flatMap((entry) => entry.subject_paths));

  assert.equal(subjectPaths.has("evals/consumer-app-radar-quality.yaml"), true);
  assert.equal(subjectPaths.has("evals/workflow-quality/enhancement-discovery.yaml"), true);
  assert.equal(subjectPaths.has("evals/iphone-app-factory/prompt-quality.yaml"), true);
  assert.equal(subjectPaths.has("evals/hermes-skill-governance/skill-promotion.yaml"), true);
});

test("blocking evals have counterexamples or a meta eval", () => {
  const registry = loadRegistry(REGISTRY_PATH);
  const invalidBlocking = registry.evals
    .filter((entry) => entry.blocking)
    .filter((entry) => !entry.meta_eval_id && entry.counterexamples.length === 0)
    .map((entry) => entry.id);

  assert.deepEqual(invalidBlocking, []);
});

test("registry parser keeps colon-containing list values as scalars", () => {
  const registry = parseRegistryYaml(`version: 1
evals:
  - id: colon.example
    level: meta
    state: blocking
    runner: deterministic
    blocking: true
    owner: quincy
    subject_paths:
      - https://example.com/evals/source.yaml
    artifact_patterns:
      - s3://bucket/output.json
    counterexamples:
      - runner_status=failed:fallback_status=passed
`);

  assert.equal(registry.evals[0].subject_paths[0], "https://example.com/evals/source.yaml");
  assert.equal(registry.evals[0].artifact_patterns[0], "s3://bucket/output.json");
  assert.equal(registry.evals[0].counterexamples[0], "runner_status=failed:fallback_status=passed");
});

test("registry validation rejects empty identity and lookup strings", () => {
  const errors = validateRegistry({
    version: 1,
    evals: [
      {
        id: "",
        level: "call",
        state: "blocking",
        runner: "deterministic",
        blocking: true,
        owner: "",
        subject_paths: [""],
        artifact_patterns: [""],
        counterexamples: ["bad output"],
      },
    ],
  });

  assert.ok(errors.some((error) => error.includes("id must be a non-empty string")));
  assert.ok(errors.some((error) => error.includes("owner must be a non-empty string")));
  assert.ok(errors.some((error) => error.includes("subject_paths[0] must be a non-empty string")));
  assert.ok(errors.some((error) => error.includes("artifact_patterns[0] must be a non-empty string")));
});

test("registry validation rejects empty enum fields", () => {
  const errors = validateRegistry({
    version: 1,
    evals: [
      {
        id: "bad.enums",
        level: "",
        state: "",
        runner: "",
        blocking: true,
        owner: "quincy",
        subject_paths: ["evals/example.yaml"],
        artifact_patterns: ["reports/evals/example.json"],
        counterexamples: ["bad output"],
      },
    ],
  });

  assert.ok(errors.some((error) => error.includes("has invalid level")));
  assert.ok(errors.some((error) => error.includes("has invalid state")));
  assert.ok(errors.some((error) => error.includes("has invalid runner")));
});
