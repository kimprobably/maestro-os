#!/usr/bin/env node
import assert from "node:assert/strict";
import test from "node:test";
import { classifyFailure } from "./classify-run-failure.mjs";

test("classifies Daytona DNS failures as transient infrastructure", () => {
  const result = classifyFailure(
    "artifact collection failed: error sending request for url (https://proxy.app.daytona.io/toolbox/x): dns error: failed to lookup address information",
  );
  assert.equal(result.failure_class, "transient_infra");
  assert.ok(result.signatures.includes("dns_or_resolution"));
  assert.ok(result.signatures.includes("daytona_proxy_or_api"));
});

test("classifies prompt file write after infra noise as control plane", () => {
  const result = classifyFailure(
    "artifact_collection_failed: failed to resolve address for github.com; Handler error: Failed to write prompt file",
  );
  assert.equal(result.failure_class, "control_plane");
  assert.ok(result.signatures.includes("prompt_file_write"));
});

test("classifies worker exit before terminal event as control plane", () => {
  const result = classifyFailure("Worker exited before emitting a terminal run event: exit status: 1");
  assert.equal(result.failure_class, "control_plane");
});

test("classifies rejected review as quality gate", () => {
  const result = classifyFailure("Implementation review: blocking: missing Appium artifact\nVERDICT: REJECTED");
  assert.equal(result.failure_class, "quality_gate");
});
