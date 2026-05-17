import assert from "node:assert/strict";
import { mkdtemp, readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const repoRoot = path.resolve(import.meta.dirname, "../..");

test("quincy profile is installed as a specialist worker", async () => {
  const installer = await readFile(
    path.join(repoRoot, "hermes/scripts/install-worker-profiles.sh"),
    "utf8",
  );
  const entrypoint = await readFile(
    path.join(repoRoot, "hermes/deploy/railway-gateway/entrypoint.sh"),
    "utf8",
  );
  const soulPath = path.join(repoRoot, "hermes/profiles/quincy/SOUL.md");

  assert.match(installer, /install_worker quincy/);
  assert.match(installer, /copy_worker_skills/);
  assert.match(entrypoint, /install-worker-profiles\.sh/);
  assert.match(entrypoint, /render-honcho-config\.mjs/);
  assert.equal(existsSync(soulPath), true);

  const soul = await readFile(soulPath, "utf8");
  assert.match(soul, /Fabro/);
  assert.match(soul, /run ledger/);
  assert.match(soul, /workflow/);
  assert.match(soul, /Honcho/);
});

test("Honcho renderer creates separate AI peers without persisting the API key", async () => {
  const tmp = await mkdtemp(path.join(os.tmpdir(), "maestro-honcho-"));
  const home = path.join(tmp, ".hermes");
  const profiles = ["maestro-operator", "quincy", "smith"];
  for (const profile of profiles) {
    spawnSync("mkdir", ["-p", path.join(home, "profiles", profile)], {
      stdio: "inherit",
    });
  }

  const result = spawnSync(
    process.execPath,
    [
      path.join(repoRoot, "scripts/hermes/render-honcho-config.mjs"),
      "--home",
      home,
      "--base-profile",
      "maestro-operator",
    ],
    {
      cwd: repoRoot,
      env: {
        ...process.env,
        HONCHO_API_KEY: "test-secret-not-written",
        HONCHO_WORKSPACE: "maestro-test",
        HONCHO_ENVIRONMENT: "production",
        HONCHO_RECALL_MODE: "hybrid",
      },
      encoding: "utf8",
    },
  );

  assert.equal(result.status, 0, result.stderr);

  const honchoPath = path.join(home, "honcho.json");
  const text = await readFile(honchoPath, "utf8");
  const config = JSON.parse(text);
  const mode = (await stat(honchoPath)).mode & 0o777;

  assert.equal(mode, 0o600);
  assert.equal(text.includes("test-secret-not-written"), false);
  assert.equal(config.workspace, "maestro-test");
  assert.deepEqual(Object.keys(config.hosts).sort(), [
    "hermes.maestro-operator",
    "hermes.quincy",
    "hermes.smith",
  ]);
  assert.equal(config.hosts["hermes.maestro-operator"].aiPeer, "miles");
  assert.equal(config.hosts["hermes.quincy"].aiPeer, "quincy");
  assert.equal(config.hosts["hermes.quincy"].recallMode, "hybrid");
});

test("Honcho renderer is a no-op when HONCHO_API_KEY is absent", async () => {
  const tmp = await mkdtemp(path.join(os.tmpdir(), "maestro-honcho-empty-"));
  const home = path.join(tmp, ".hermes");

  const result = spawnSync(
    process.execPath,
    [path.join(repoRoot, "scripts/hermes/render-honcho-config.mjs"), "--home", home],
    {
      cwd: repoRoot,
      env: {
        ...process.env,
        HONCHO_API_KEY: "",
      },
      encoding: "utf8",
    },
  );

  assert.equal(result.status, 0, result.stderr);
  assert.equal(existsSync(path.join(home, "honcho.json")), false);
});
