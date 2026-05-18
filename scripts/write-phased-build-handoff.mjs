import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const [specPathArg = ".workflow/phased/spec.md", appDirArg = "apps/generated-phased-app"] = process.argv.slice(2);

const specPath = resolve(repoRoot, specPathArg);
const appDir = resolve(repoRoot, appDirArg);
const outPath = resolve(repoRoot, ".workflow/phased/handoff.json");

const handoff = {
  status: "approved",
  spec_path: specPathArg,
  app_dir: appDirArg,
  phase_plan: ".workflow/phased/phase-plan.json",
  final_review: ".workflow/phased/final-review.md",
  evidence_dir: ".workflow/phased/evidence",
  spec_sha256: existsSync(specPath)
    ? createHash("sha256").update(readFileSync(specPath)).digest("hex")
    : null,
  app_dir_exists: existsSync(appDir),
  updated_at: new Date().toISOString()
};

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `${JSON.stringify(handoff, null, 2)}\n`);
console.log(JSON.stringify(handoff, null, 2));
