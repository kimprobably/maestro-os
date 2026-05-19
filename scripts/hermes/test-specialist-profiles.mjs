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
  assert.match(installer, /install_worker joni/);
  assert.match(installer, /copy_worker_skills/);
  assert.match(installer, /copy_profile_skills/);
  assert.match(installer, /sync_base_auth/);
  assert.match(installer, /install -m 0600 "\$base_auth" "\$target_auth"/);
  assert.match(entrypoint, /install-worker-profiles\.sh/);
  assert.match(entrypoint, /render-honcho-config\.mjs/);
  assert.match(entrypoint, /mobbin\["enabled"\] = bool\(enabled_env\)/);
  assert.equal(existsSync(soulPath), true);

  const soul = await readFile(soulPath, "utf8");
  assert.match(soul, /Fabro/);
  assert.match(soul, /run ledger/);
  assert.match(soul, /workflow/);
  assert.match(soul, /Honcho/);
});

test("joni has a LinkedIn operator skill with safe capture and no-publish boundaries", async () => {
  const skill = await readFile(
    path.join(repoRoot, "hermes/profiles/joni/skills/linkedin-operator/SKILL.md"),
    "utf8",
  );

  assert.match(skill, /authorized content capture/);
  assert.match(skill, /HarvestAPI/);
  assert.match(skill, /joni-linkedin-daily\.fabro/);
  assert.match(skill, /5 draft-ready posts per week/);
  assert.match(skill, /not publish/i);
  assert.match(skill, /scraping private\/authenticated LinkedIn surfaces/);
  assert.match(skill, /JONI-LINKEDIN-LEDGER\.md/);
  assert.match(skill, /weekly performance/);
  assert.match(skill, /SQLite watchlist first/);
  assert.match(skill, /not treat an empty `docs\/operator\/linkedin\/joni-sources\.json` as a blocker/);
  assert.match(skill, /selected-sources\.all\.json/);

  const ledger = await readFile(
    path.join(repoRoot, "docs/operator/linkedin/JONI-LINKEDIN-LEDGER.md"),
    "utf8",
  );
  assert.match(ledger, /Target: 5 draft-ready posts per week/);
  assert.match(ledger, /HARVEST_API_KEY/);
  assert.match(ledger, /Daily ingestion is deterministic/);
  assert.match(ledger, /Publishing, commenting, DMs, connection requests/);

  const watchlistDoc = await readFile(
    path.join(repoRoot, "docs/operator/linkedin/JONI-FEED-WATCHLIST.md"),
    "utf8",
  );
  assert.match(watchlistDoc, /selected-sources\.all\.json/);
  assert.match(watchlistDoc, /being empty is not a watchlist gap/);
});

test("joni has a repo-managed voice editor skill with regression checks", async () => {
  const operatorSkill = await readFile(
    path.join(repoRoot, "hermes/profiles/joni/skills/linkedin-operator/SKILL.md"),
    "utf8",
  );
  const editorSkill = await readFile(
    path.join(
      repoRoot,
      "hermes/profiles/joni/skills/maestro-linkedin-voice-editor/SKILL.md",
    ),
    "utf8",
  );

  assert.match(operatorSkill, /maestro-linkedin-voice-editor/);
  assert.match(operatorSkill, /joni-linkedin-voice-eval\.mjs/);

  assert.match(editorSkill, /brief lock/i);
  assert.match(editorSkill, /eval-only/i);
  assert.match(editorSkill, /targeted edit plan/i);
  assert.match(editorSkill, /constrained rewrite/i);
  assert.match(editorSkill, /regression eval/i);
  assert.match(editorSkill, /joni-linkedin-voice-eval\.mjs/);
  assert.match(editorSkill, /runtime-created skills are scratch/i);
  assert.match(editorSkill, /do not publish/i);
  assert.match(editorSkill, /target reader/i);
  assert.match(editorSkill, /pain point/i);
  assert.match(editorSkill, /human edits/i);
});

test("Railway gateway can run Joni as a dedicated specialist Slack profile", async () => {
  const entrypoint = await readFile(
    path.join(repoRoot, "hermes/deploy/railway-gateway/entrypoint.sh"),
    "utf8",
  );

  assert.match(entrypoint, /HERMES_GATEWAY_PROFILE/);
  assert.match(entrypoint, /profile_name="\$\{HERMES_GATEWAY_PROFILE:-maestro-operator\}"/);
  assert.match(entrypoint, /profile_soul_src="\/app\/hermes\/profiles\/\$profile_name\/SOUL\.md"/);
  assert.match(entrypoint, /HARVEST_API_KEY/);
  assert.match(entrypoint, /linkedin-operator/);
  assert.match(entrypoint, /maestro-linkedin-voice-editor/);
  assert.match(entrypoint, /exec hermes -p "\$profile_name" gateway run/);
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
