import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

const repoRoot = path.resolve(import.meta.dirname, "../..");
const script = path.join(repoRoot, "scripts/hermes/sync-superpowers-skills.mjs");

function writeSkill(root, name, body = "") {
  const dir = path.join(root, "skills", name);
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    path.join(dir, "SKILL.md"),
    [
      "---",
      `name: ${name}`,
      `description: ${name} test skill`,
      "---",
      "",
      body || `# ${name}`,
      "",
    ].join("\n"),
  );
}

function run(args) {
  return spawnSync(process.execPath, [script, ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

test("sync-superpowers-skills vendors required skills into Hermes skill dirs", () => {
  const source = mkdtempSync(path.join(tmpdir(), "superpowers-src-"));
  const target = mkdtempSync(path.join(tmpdir(), "maestro-os-"));
  for (const name of [
    "using-superpowers",
    "brainstorming",
    "writing-plans",
    "using-git-worktrees",
    "test-driven-development",
    "subagent-driven-development",
    "executing-plans",
    "requesting-code-review",
    "receiving-code-review",
    "finishing-a-development-branch",
    "systematic-debugging",
    "verification-before-completion",
    "dispatching-parallel-agents",
    "writing-skills",
  ]) {
    writeSkill(source, name);
  }
  writeFileSync(path.join(source, "LICENSE"), "MIT test license\n");
  for (const base of [
    "hermes/skills",
    "hermes/distribution/maestro-operator/skills",
  ]) {
    const maestroSkill = path.join(target, base, "fabro-babysitter");
    mkdirSync(maestroSkill, { recursive: true });
    writeFileSync(
      path.join(maestroSkill, "SKILL.md"),
      "# Fabro Babysitter\n\nExisting Maestro skill marker.\n",
    );
  }

  const result = run(["--source", source, "--repo-root", target]);
  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.ok, true);
  assert.ok(payload.synced.length >= 14);

  for (const base of [
    "hermes/skills",
    "hermes/distribution/maestro-operator/skills",
  ]) {
    for (const name of [
      "using-superpowers",
      "brainstorming",
      "test-driven-development",
      "finishing-a-development-branch",
    ]) {
      assert.equal(
        existsSync(path.join(target, base, name, "SKILL.md")),
        true,
        `${base}/${name}`,
      );
    }
    assert.match(
      readFileSync(
        path.join(target, base, "fabro-babysitter", "SKILL.md"),
        "utf8",
      ),
      /Existing Maestro skill marker/,
    );
  }
  assert.match(
    readFileSync(
      path.join(target, "hermes/skills/SUPERPOWERS_SOURCE.md"),
      "utf8",
    ),
    /https:\/\/github\.com\/obra\/superpowers/,
  );
  assert.match(
    readFileSync(path.join(target, "hermes/skills/SUPERPOWERS_LICENSE"), "utf8"),
    /MIT test license/,
  );
  assert.match(
    readFileSync(
      path.join(
        target,
        "hermes/distribution/maestro-operator/skills/SUPERPOWERS_SOURCE.md",
      ),
      "utf8",
    ),
    /https:\/\/github\.com\/obra\/superpowers/,
  );
  assert.match(
    readFileSync(
      path.join(
        target,
        "hermes/distribution/maestro-operator/skills/SUPERPOWERS_LICENSE",
      ),
      "utf8",
    ),
    /MIT test license/,
  );
});

test("repo profile installer copies distribution skills into worker profiles", () => {
  const installer = readFileSync(
    path.join(repoRoot, "hermes/scripts/install-worker-profiles.sh"),
    "utf8",
  );
  assert.match(
    installer,
    /worker_skills_src="\$repo_root\/hermes\/distribution\/maestro-operator\/skills"/,
  );
  assert.match(installer, /copy_worker_skills "\$profile_dir"/);
});

test("bootstrap docs describe Superpowers distribution propagation", () => {
  const bootstrapRules = readFileSync(
    path.join(repoRoot, "hermes/agents/bootstrap-rules.md"),
    "utf8",
  );
  assert.match(bootstrapRules, /Superpowers skills from `https:\/\/github\.com\/obra\/superpowers`/);
  assert.match(bootstrapRules, /worker install copies the distribution skill set/);
  assert.match(bootstrapRules, /using-superpowers/);

  const readme = readFileSync(path.join(repoRoot, "hermes/README.md"), "utf8");
  assert.match(readme, /## Superpowers/);
  assert.match(readme, /https:\/\/github\.com\/obra\/superpowers/);
  assert.match(readme, /node scripts\/hermes\/sync-superpowers-skills\.mjs/);
});

test("Hermes agent SOUL files require Superpowers for software work", () => {
  const requiredWorkflowSkills = [
    "using-superpowers",
    "brainstorming",
    "writing-plans",
    "using-git-worktrees",
    "test-driven-development",
    "systematic-debugging",
    "verification-before-completion",
    "finishing-a-development-branch",
  ];
  for (const file of [
    "hermes/profiles/maestro-operator/SOUL.md",
    "hermes/distribution/maestro-operator/SOUL.md",
    "hermes/profiles/quincy/SOUL.md",
    "hermes/profiles/smith/SOUL.md",
    "hermes/profiles/johann/SOUL.md",
    "hermes/profiles/quill/SOUL.md",
    "hermes/profiles/joni/SOUL.md",
  ]) {
    const text = readFileSync(path.join(repoRoot, file), "utf8");
    assert.match(text, /Superpowers/);
    for (const skill of requiredWorkflowSkills) {
      assert.match(text, new RegExp(skill), `${file} should mention ${skill}`);
    }
  }
  assert.match(
    readFileSync(path.join(repoRoot, "hermes/profiles/quincy/SOUL.md"), "utf8"),
    /fabro-babysitter[\s\S]*systematic-debugging[\s\S]*verification-before-completion/,
  );
  assert.match(
    readFileSync(path.join(repoRoot, "hermes/profiles/smith/SOUL.md"), "utf8"),
    /test-driven-development[\s\S]*requesting-code-review[\s\S]*finishing-a-development-branch/,
  );
});
