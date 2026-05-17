import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const repoRoot = path.resolve(import.meta.dirname, "../..");

const requiredFabroDocs = [
  "FABRO-AGENT-BOOTSTRAP-WORKFLOW.md",
  "FABRO-MCP-SETUP.md",
  "FABRO-RUN-IMPROVEMENT-BACKLOG.md",
  "FABRO-RUN-LEDGER.md",
  "FABRO-RUN-POSTMORTEMS.md",
];

test("Railway gateway context includes all Fabro docs Quincy needs", async () => {
  const tmp = await mkdtemp(path.join(os.tmpdir(), "maestro-railway-context-"));
  const result = spawnSync(
    path.join(repoRoot, "hermes/scripts/prepare-railway-gateway-context.sh"),
    [tmp],
    {
      cwd: repoRoot,
      encoding: "utf8",
    },
  );
  assert.equal(result.status, 0, result.stderr);

  const dockerfile = await readFile(path.join(tmp, "Dockerfile"), "utf8");
  for (const doc of requiredFabroDocs) {
    const contextDoc = await readFile(path.join(tmp, "docs", doc), "utf8");
    assert.ok(contextDoc.length > 0, `${doc} should be copied into the Railway context`);
  }
  assert.match(dockerfile, /COPY docs\/FABRO\*\.md \/app\/docs\//);
  assert.match(dockerfile, /COPY workflows\/hermes \/app\/workflows\/hermes/);

  const workflow = await readFile(path.join(tmp, "workflows/hermes/create-agent.fabro"), "utf8");
  const runConfig = await readFile(path.join(tmp, "workflows/hermes/create-agent.toml"), "utf8");
  assert.match(workflow, /digraph CreateHermesAgent/);
  assert.match(runConfig, /graph = "create-agent\.fabro"/);
});
