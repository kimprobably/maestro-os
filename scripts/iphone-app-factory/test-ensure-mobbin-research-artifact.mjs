#!/usr/bin/env node
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const script = "scripts/iphone-app-factory/ensure-mobbin-research-artifact.mjs";

function run(args, cwd = process.cwd()) {
  return spawnSync("node", [script, ...args], {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

test("writes a source-limited Mobbin fallback artifact when markdown is missing", () => {
  const dir = mkdtempSync(join(tmpdir(), "mobbin-artifact-"));
  const artifact = join(dir, ".workflow/iphone-app-ux-studio/research/mobbin-mcp-research.md");
  const report = join(dir, ".workflow/iphone-app-ux-studio/codex/mobbin-mcp-research.json");
  const lastMessage = join(dir, ".workflow/iphone-app-ux-studio/codex/mobbin-mcp-research.last-message.md");
  mkdirSync(join(dir, ".workflow/iphone-app-ux-studio/codex"), { recursive: true });
  writeFileSync(report, JSON.stringify({ codex_mobbin_mcp: { configured: true } }));
  writeFileSync(lastMessage, "Mobbin completed without secrets.");

  const result = run(["--artifact", artifact, "--report", report, "--last-message", lastMessage], process.cwd());

  assert.equal(result.status, 0, result.stderr);
  const text = readFileSync(artifact, "utf8");
  for (const heading of [
    "# Mobbin MCP Research",
    "## Source Policy",
    "## Source List",
    "## Access Path Used",
    "## Pattern References",
    "## Screen Type Coverage",
    "## Raw Asset Privacy",
    "## what_to_adapt",
    "## what_not_to_copy",
    "## Fallback Notes",
  ]) {
    assert.ok(text.includes(heading), `missing ${heading}`);
  }
  assert.match(text, /private_only:\s*true/);
});

test("fails when an existing artifact is missing required headings", () => {
  const dir = mkdtempSync(join(tmpdir(), "mobbin-artifact-bad-"));
  const artifact = join(dir, "mobbin-mcp-research.md");
  writeFileSync(artifact, "# Mobbin MCP Research\n");

  const result = run(["--artifact", artifact], process.cwd());

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /missing_headings/);
});
