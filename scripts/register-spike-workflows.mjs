import { existsSync, mkdirSync, readdirSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const workflowsRoot = join(repoRoot, "workflows");
const outputPath = resolve(
  repoRoot,
  process.argv[2] || ".workflow/spike-workflow-registry.json",
);
const scratchDir = dirname(outputPath);
const validationConfigPath = join(scratchDir, "fabro-validate-empty.toml");
const projectConfigPath = join(repoRoot, ".fabro", "project.toml");
const disabledProjectConfigPath = join(scratchDir, "project.toml.disabled-for-registry-smoke");

function listFabroFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return listFabroFiles(path);
    if (entry.isFile() && entry.name.endsWith(".fabro")) return [path];
    return [];
  });
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    env: {
      ...process.env,
      FABRO_CONFIG: validationConfigPath,
      FABRO_NO_UPGRADE_CHECK: "1",
    },
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });
  return {
    ok: result.status === 0,
    status: result.status,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim(),
  };
}

function withProjectConfigHidden(callback) {
  const shouldHideProjectConfig = existsSync(projectConfigPath);
  if (!shouldHideProjectConfig) return callback();
  if (existsSync(disabledProjectConfigPath)) {
    throw new Error(`Refusing to overwrite existing temporary config: ${disabledProjectConfigPath}`);
  }

  renameSync(projectConfigPath, disabledProjectConfigPath);
  try {
    return callback();
  } finally {
    renameSync(disabledProjectConfigPath, projectConfigPath);
  }
}

if (!existsSync(workflowsRoot)) {
  throw new Error(`Missing workflows directory: ${workflowsRoot}`);
}

mkdirSync(scratchDir, { recursive: true });
writeFileSync(validationConfigPath, "");

const workflows = listFabroFiles(workflowsRoot).sort();
const results = withProjectConfigHidden(() => workflows.map((path) => {
  const workflow = relative(repoRoot, path);
  const validation = run("fabro", ["validate", workflow]);
  const quality = validation.ok
    ? run("./bin/maestro", ["verify", "workflow-quality", workflow])
    : {
        ok: false,
        status: null,
        stdout: "",
        stderr: "skipped after validation failure",
      };
  const registration = quality.ok
    ? run("./bin/maestro", ["workflow", "register", workflow])
    : {
        ok: false,
        status: null,
        stdout: "",
        stderr: "skipped after quality failure",
      };

  return {
    workflow,
    validation,
    quality,
    registration,
    ok: validation.ok && quality.ok && registration.ok,
  };
}));

const failed = results.filter((result) => !result.ok);
const report = {
  ok: failed.length === 0,
  workflow_count: results.length,
  failed_count: failed.length,
  workflows: results.map((result) => ({
    workflow: result.workflow,
    ok: result.ok,
    validation: result.validation.ok,
    quality: result.quality.ok,
    registration: result.registration.ok,
  })),
};

writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));

if (failed.length > 0) {
  for (const result of failed) {
    console.error(`FAILED ${result.workflow}`);
    for (const [name, stage] of Object.entries({
      validation: result.validation,
      quality: result.quality,
      registration: result.registration,
    })) {
      if (!stage.ok) {
        console.error(
          `${name}: ${stage.stderr || stage.stdout || `status=${stage.status}`}`,
        );
      }
    }
  }
  process.exit(1);
}
