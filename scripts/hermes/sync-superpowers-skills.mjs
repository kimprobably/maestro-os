#!/usr/bin/env node
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";

const sourceUrl = "https://github.com/obra/superpowers";

const requiredSkills = [
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
];

function argValue(name, fallback = "") {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`Missing value for ${name}`);
  }
  return value;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function ensureSource(sourceArg) {
  if (sourceArg) return path.resolve(sourceArg);
  const checkout = path.join(tmpdir(), `superpowers-${Date.now()}`);
  const result = spawnSync(
    "git",
    ["clone", "--depth", "1", `${sourceUrl}.git`, checkout],
    {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  if (result.status !== 0) {
    throw new Error(
      result.stderr || result.stdout || "git clone obra/superpowers failed",
    );
  }
  return checkout;
}

function listSkillDirs(sourceSkillsDir) {
  return readdirSync(sourceSkillsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => existsSync(path.join(sourceSkillsDir, name, "SKILL.md")))
    .sort();
}

function copySkill(sourceRoot, repoRoot, skillName) {
  const sourceDir = path.join(sourceRoot, "skills", skillName);
  if (!existsSync(path.join(sourceDir, "SKILL.md"))) {
    throw new Error(`missing required Superpowers skill: ${skillName}`);
  }
  const destinations = [
    path.join(repoRoot, "hermes", "skills", skillName),
    path.join(
      repoRoot,
      "hermes",
      "distribution",
      "maestro-operator",
      "skills",
      skillName,
    ),
  ];
  for (const destination of destinations) {
    rmSync(destination, { recursive: true, force: true });
    mkdirSync(path.dirname(destination), { recursive: true });
    cpSync(sourceDir, destination, { recursive: true });
  }
}

function sourceRevision(sourceRoot) {
  const result = spawnSync("git", ["-C", sourceRoot, "rev-parse", "HEAD"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
  return result.status === 0 ? result.stdout.trim() : "";
}

function writeMetadata(sourceRoot, repoRoot, synced) {
  const revision = sourceRevision(sourceRoot);
  const sourceNote = [
    "# Superpowers Source",
    "",
    `These skills are vendored from ${sourceUrl}.`,
    "",
    ...(revision ? [`Source revision: \`${revision}\`.`, ""] : []),
    "Use `node scripts/hermes/sync-superpowers-skills.mjs` to refresh them.",
    "",
    `Synced skills: ${synced.join(", ")}`,
    "",
  ].join("\n");
  const licensePath = path.join(sourceRoot, "LICENSE");
  const licenseText = existsSync(licensePath)
    ? readFileSync(licensePath, "utf8")
    : "";

  for (const base of [
    path.join(repoRoot, "hermes", "skills"),
    path.join(repoRoot, "hermes", "distribution", "maestro-operator", "skills"),
  ]) {
    mkdirSync(base, { recursive: true });
    writeFileSync(path.join(base, "SUPERPOWERS_SOURCE.md"), sourceNote);
    if (licenseText) {
      writeFileSync(path.join(base, "SUPERPOWERS_LICENSE"), licenseText);
    }
  }
}

function main() {
  const repoRoot = path.resolve(argValue("--repo-root", "."));
  const sourceRoot = ensureSource(argValue("--source", ""));
  const dryRun = hasFlag("--dry-run");
  const sourceSkillsDir = path.join(sourceRoot, "skills");
  if (!existsSync(sourceSkillsDir)) {
    throw new Error(`missing skills directory in ${sourceRoot}`);
  }

  const available = listSkillDirs(sourceSkillsDir);
  for (const skillName of requiredSkills) {
    if (!available.includes(skillName)) {
      throw new Error(`missing required Superpowers skill: ${skillName}`);
    }
  }

  if (!dryRun) {
    for (const skillName of requiredSkills) {
      copySkill(sourceRoot, repoRoot, skillName);
    }
    writeMetadata(sourceRoot, repoRoot, requiredSkills);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        source: sourceRoot,
        repo_root: repoRoot,
        dry_run: dryRun,
        synced: requiredSkills,
        required: requiredSkills,
      },
      null,
      2,
    ),
  );
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
