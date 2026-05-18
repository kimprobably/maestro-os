import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const repoRoot = path.resolve(import.meta.dirname, "../..");

test("agent registry contains Quincy and the saved musician name pool", async () => {
  const registry = JSON.parse(
    await readFile(path.join(repoRoot, "hermes/agents/registry.json"), "utf8"),
  );
  const names = await readFile(path.join(repoRoot, "hermes/agents/name-pool.md"), "utf8");
  const quincy = registry.agents.find((agent) => agent.name === "Quincy");

  assert.ok(quincy);
  assert.equal(quincy.profile, "quincy");
  assert.match(quincy.role, /Fabro/);
  assert.match(quincy.handoff, /hermes -p quincy/);
  assert.match(names, /Nina/);
  assert.match(names, /Quincy/);
  assert.match(names, /Thelonious/);
});

test("agent bootstrap rules capture profile, memory, handoff, Slack, and retirement policy", async () => {
  const rules = await readFile(path.join(repoRoot, "hermes/agents/bootstrap-rules.md"), "utf8");

  assert.match(rules, /first name of a musician/);
  assert.match(rules, /Hermes profile/);
  assert.match(rules, /workflows\/hermes\/create-agent\.fabro/);
  assert.match(rules, /separate Honcho AI peer/);
  assert.match(rules, /timeout 900 hermes -p <profile> chat -q/);
  assert.match(rules, /Default: no separate Slack bot/);
  assert.match(rules, /retire the old profile/);
});

test("agent registry CLI lists and shows agents", () => {
  const list = spawnSync(
    process.execPath,
    [path.join(repoRoot, "scripts/hermes/agent-registry.mjs"), "list", "--root", repoRoot],
    { encoding: "utf8" },
  );
  assert.equal(list.status, 0, list.stderr);
  assert.match(list.stdout, /Miles/);
  assert.match(list.stdout, /Quincy/);

  const show = spawnSync(
    process.execPath,
    [path.join(repoRoot, "scripts/hermes/agent-registry.mjs"), "show", "quincy", "--root", repoRoot],
    { encoding: "utf8" },
  );
  assert.equal(show.status, 0, show.stderr);
  assert.match(show.stdout, /Fabro/);
  assert.match(show.stdout, /hermes -p quincy/);
});
