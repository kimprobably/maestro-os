import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile, mkdir, cp } from "node:fs/promises";
import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const repoRoot = path.resolve(import.meta.dirname, "../..");
const script = path.join(repoRoot, "scripts/hermes/bootstrap-agent.mjs");

async function copyHarness() {
  const tmp = await mkdtemp(path.join(os.tmpdir(), "maestro-agent-bootstrap-"));
  await mkdir(path.join(tmp, "hermes/agents"), { recursive: true });
  await mkdir(path.join(tmp, "hermes/profiles"), { recursive: true });
  await mkdir(path.join(tmp, "hermes/scripts"), { recursive: true });
  await mkdir(path.join(tmp, "scripts/hermes"), { recursive: true });
  await cp(path.join(repoRoot, "hermes/agents/registry.json"), path.join(tmp, "hermes/agents/registry.json"));
  await cp(path.join(repoRoot, "hermes/agents/name-pool.md"), path.join(tmp, "hermes/agents/name-pool.md"));
  await cp(path.join(repoRoot, "hermes/scripts/install-worker-profiles.sh"), path.join(tmp, "hermes/scripts/install-worker-profiles.sh"));
  await cp(path.join(repoRoot, "scripts/hermes/render-honcho-config.mjs"), path.join(tmp, "scripts/hermes/render-honcho-config.mjs"));
  return tmp;
}

function run(root, command, extraArgs = []) {
  return spawnSync(process.execPath, [
    script,
    command,
    "--root",
    root,
    "--name",
    "Nina",
    "--role",
    "Research specialist",
    "--owns",
    "market research,source review",
    "--current-focus",
    "Build durable research judgment for Maestro.",
    "--slack-bot",
    "true",
    ...extraArgs,
  ], {
    cwd: root,
    encoding: "utf8",
  });
}

test("agent bootstrap materializes profile, registry, name pool, Slack manifest, and verification report", async () => {
  const root = await copyHarness();

  const validate = run(root, "validate");
  assert.equal(validate.status, 0, validate.stderr);
  assert.match(validate.stdout, /agent_request_valid/);

  const materialize = run(root, "materialize");
  assert.equal(materialize.status, 0, materialize.stderr);

  const registry = JSON.parse(await readFile(path.join(root, "hermes/agents/registry.json"), "utf8"));
  const nina = registry.agents.find((agent) => agent.name === "Nina");
  assert.ok(nina);
  assert.equal(nina.profile, "nina");
  assert.equal(nina.memory_peer, "nina");
  assert.match(nina.handoff, /hermes -p nina/);

  const soul = await readFile(path.join(root, "hermes/profiles/nina/SOUL.md"), "utf8");
  assert.match(soul, /# Nina/);
  assert.match(soul, /Research specialist/);
  assert.match(soul, /market research/);

  const namePool = await readFile(path.join(root, "hermes/agents/name-pool.md"), "utf8");
  assert.match(namePool, /Nina - Research specialist/);

  const installer = await readFile(path.join(root, "hermes/scripts/install-worker-profiles.sh"), "utf8");
  assert.match(installer, /install_worker nina/);

  const manifest = JSON.parse(
    await readFile(path.join(root, "hermes/agents/slack/nina-manifest.json"), "utf8"),
  );
  assert.equal(manifest.display_information.name, "Nina");
  assert.ok(manifest.oauth_config.scopes.bot.includes("app_mentions:read"));
  assert.equal(JSON.stringify(manifest).includes("xox"), false);

  const verify = run(root, "verify");
  assert.equal(verify.status, 0, verify.stderr || verify.stdout);
  const report = JSON.parse(await readFile(path.join(root, ".workflow/hermes-agent-bootstrap/verify.json"), "utf8"));
  assert.equal(report.ok, true);
  assert.equal(report.checks.profile, true);
  assert.equal(report.checks.registry, true);
  assert.equal(report.checks.slack_manifest, true);
});

test("agent bootstrap refuses names outside the saved pool unless explicitly allowed", async () => {
  const root = await copyHarness();
  const result = spawnSync(process.execPath, [
    script,
    "validate",
    "--root",
    root,
    "--name",
    "Notamusician",
    "--role",
    "Test role",
    "--owns",
    "test",
    "--current-focus",
    "test",
  ], {
    cwd: root,
    encoding: "utf8",
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /not in name pool/);
});

test("agent bootstrap generates Slack pack for existing profile without rewriting tuned SOUL", async () => {
  const root = await copyHarness();
  const soulPath = path.join(root, "hermes/profiles/joni/SOUL.md");
  const tunedSoul = "# Joni\n\nTuned LinkedIn operator profile marker.\n";
  await mkdir(path.dirname(soulPath), { recursive: true });
  await writeFile(soulPath, tunedSoul);

  const result = spawnSync(process.execPath, [
    script,
    "slack-pack",
    "--root",
    root,
    "--name",
    "Joni",
    "--role",
    "LinkedIn content and performance specialist",
    "--owns",
    "authorized LinkedIn content capture,Maestro LinkedIn post calendar,draft creation,performance monitoring,weekly insight reports",
    "--current-focus",
    "Build a reliable LinkedIn operating loop without publishing without approval.",
    "--slack-bot",
    "true",
  ], {
    cwd: root,
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr);
  assert.equal(await readFile(soulPath, "utf8"), tunedSoul);

  const manifest = JSON.parse(
    await readFile(path.join(root, "hermes/agents/slack/joni-manifest.json"), "utf8"),
  );
  assert.equal(manifest.display_information.name, "Joni");
  assert.ok(manifest.oauth_config.scopes.bot.includes("app_mentions:read"));
  assert.equal(JSON.stringify(manifest).includes("xox"), false);

  const setup = await readFile(path.join(root, "docs/operator/agent-slack/joni-setup.md"), "utf8");
  assert.match(setup, /HERMES_GATEWAY_PROFILE=joni/);
  assert.match(setup, /separate Railway service/);

  const registry = JSON.parse(await readFile(path.join(root, "hermes/agents/registry.json"), "utf8"));
  const joni = registry.agents.find((agent) => agent.profile === "joni");
  assert.equal(joni.interface, "Slack gateway candidate");
  assert.match(joni.handoff, /hermes -p joni/);
});

test("agent bootstrap workflow contract includes deterministic stages and Slack gate", async () => {
  const workflow = await readFile(path.join(repoRoot, "workflows/hermes/create-agent.fabro"), "utf8");
  const toml = await readFile(path.join(repoRoot, "workflows/hermes/create-agent.toml"), "utf8");
  const doc = await readFile(path.join(repoRoot, "docs/FABRO-AGENT-BOOTSTRAP-WORKFLOW.md"), "utf8");

  for (const stage of [
    "validate_agent_request",
    "write_agent_plan",
    "materialize_agent_artifacts",
    "verify_agent_artifacts",
    "slack_bot_install_approval",
    "write_handoff",
  ]) {
    assert.match(workflow, new RegExp(stage));
  }
  assert.ok(workflow.includes("scripts/hermes/bootstrap-agent.mjs materialize"));
  assert.match(toml, /graph = "create-agent\.fabro"/);
  assert.match(doc, /deterministic/);
  assert.match(doc, /Slack bot/);
});
