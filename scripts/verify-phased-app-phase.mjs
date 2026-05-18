import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const [phaseId, appDirArg = "apps/generated-phased-app"] = process.argv.slice(2);

if (!phaseId) {
  throw new Error("Usage: node scripts/verify-phased-app-phase.mjs <phase-id> [app-dir]");
}

const appDir = resolve(repoRoot, appDirArg);
const phasedRoot = resolve(repoRoot, ".workflow/phased");
const verificationPath = join(phasedRoot, `phase-verification-${phaseId}.md`);
const evidencePath = join(phasedRoot, "evidence", `${phaseId}.md`);
const reportPath = join(phasedRoot, `native-${phaseId}.json`);

function listFiles(dir, names, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", "target", ".git", ".venv", "dist", "build"].includes(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) listFiles(path, names, out);
    if (entry.isFile() && names.has(entry.name)) out.push(path);
  }
  return out;
}

function run(cwd, command, args) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
    env: process.env
  });
  return {
    command: [command, ...args].join(" "),
    cwd: relative(repoRoot, cwd) || ".",
    ok: result.status === 0,
    status: result.status,
    stdout: result.stdout.trim().slice(-8000),
    stderr: result.stderr.trim().slice(-8000)
  };
}

function runNativeChecks(manifest) {
  const dir = dirname(manifest);
  const name = manifest.split("/").pop();
  if (name === "package.json") {
    const packageJson = JSON.parse(readFileSync(manifest, "utf8"));
    const results = [];
    if (!existsSync(join(dir, "node_modules"))) {
      results.push(run(dir, existsSync(join(dir, "package-lock.json")) ? "npm" : "npm", [existsSync(join(dir, "package-lock.json")) ? "ci" : "install"]));
      if (!results.at(-1)?.ok) return results;
    }
    for (const script of ["lint", "typecheck", "test", "build"]) {
      if (packageJson.scripts?.[script]) {
        results.push(run(dir, "npm", ["run", script]));
        if (!results.at(-1)?.ok) break;
      }
    }
    return results;
  }
  if (name === "Cargo.toml") {
    return [
      run(dir, "cargo", ["fmt", "--check"]),
      run(dir, "cargo", ["clippy", "--workspace", "--all-targets", "--all-features", "--", "-D", "warnings"]),
      run(dir, "cargo", ["test", "--workspace"])
    ];
  }
  if (name === "pyproject.toml") {
    return [run(dir, "python3", ["-m", "compileall", "."])];
  }
  if (name === "go.mod") {
    return [run(dir, "go", ["test", "./..."])];
  }
  return [];
}

const issues = [];
if (!existsSync(appDir)) issues.push(`missing app directory: ${relative(repoRoot, appDir)}`);
if (!existsSync(verificationPath)) issues.push(`missing verification report: ${relative(repoRoot, verificationPath)}`);
if (!existsSync(evidencePath)) issues.push(`missing phase evidence: ${relative(repoRoot, evidencePath)}`);

let verdict = "";
if (existsSync(verificationPath)) {
  const verification = readFileSync(verificationPath, "utf8");
  verdict = verification.match(/VERDICT:\s*(APPROVED|REJECTED)/i)?.[1]?.toUpperCase() ?? "";
  if (verdict !== "APPROVED") issues.push(`phase ${phaseId} is not approved`);
}

const manifests = listFiles(appDir, new Set(["package.json", "Cargo.toml", "pyproject.toml", "go.mod"]));
if (manifests.length === 0) {
  issues.push("no project manifest found under app_dir");
}

const nativeResults = manifests.flatMap((manifest) => runNativeChecks(manifest));
for (const result of nativeResults) {
  if (!result.ok) issues.push(`native check failed: ${result.command} in ${result.cwd}`);
}

mkdirSync(dirname(reportPath), { recursive: true });
const report = {
  ok: issues.length === 0,
  phase: phaseId,
  app_dir: relative(repoRoot, appDir),
  verdict,
  manifests: manifests.map((path) => relative(repoRoot, path)),
  native_results: nativeResults,
  issues
};
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));

if (!report.ok) process.exit(1);
