#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`Missing value for ${name}`);
  return value;
}

const workflow = process.argv.slice(2).find((arg) => !arg.startsWith("--"))
  || "workflows/consumer-radar/live-enrichment.fabro";
const outPath = resolve(argValue("--out", ".workflow/fabro-validate-compat.json"));
const scratchDir = dirname(outPath);
const validationConfigPath = resolve(scratchDir, "fabro-validate-empty.toml");
const projectConfigPath = resolve(".fabro/project.toml");
const hiddenProjectConfigPath = resolve(
  scratchDir,
  `project.toml.disabled-for-fabro-validate-${process.pid}`,
);

function runValidate() {
  const result = spawnSync("fabro", ["validate", workflow, "--no-upgrade-check"], {
    encoding: "utf8",
    env: {
      ...process.env,
      FABRO_CONFIG: validationConfigPath,
      FABRO_NO_UPGRADE_CHECK: "1",
    },
  });
  return {
    ok: result.status === 0,
    status: result.status,
    stdout: (result.stdout || "").trim(),
    stderr: (result.stderr || "").trim(),
  };
}

function withProjectConfigHidden(callback) {
  if (!existsSync(projectConfigPath)) return callback(false);
  if (existsSync(hiddenProjectConfigPath)) {
    throw new Error(`Refusing to overwrite temporary config: ${hiddenProjectConfigPath}`);
  }
  renameSync(projectConfigPath, hiddenProjectConfigPath);
  try {
    return callback(true);
  } finally {
    renameSync(hiddenProjectConfigPath, projectConfigPath);
  }
}

mkdirSync(scratchDir, { recursive: true });
writeFileSync(validationConfigPath, "");

const validation = withProjectConfigHidden((projectConfigHidden) => ({
  projectConfigHidden,
  result: runValidate(),
}));

const report = {
  ok: validation.result.ok,
  workflow,
  project_config_hidden: validation.projectConfigHidden,
  validation: validation.result,
};

writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exit(1);
