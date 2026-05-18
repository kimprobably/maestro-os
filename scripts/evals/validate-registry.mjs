#!/usr/bin/env node
import { loadRegistry, validateRegistry } from "./eval-lib.mjs";

const registryPath = process.argv[2] ?? "evals/registry.yaml";

try {
  const registry = loadRegistry(registryPath);
  const errors = validateRegistry(registry);
  if (errors.length > 0) {
    console.error(JSON.stringify({ ok: false, errors }, null, 2));
    process.exit(1);
  }

  console.log(JSON.stringify({ ok: true, eval_count: registry.evals.length }));
} catch (error) {
  console.error(JSON.stringify({ ok: false, errors: [error.message] }, null, 2));
  process.exit(1);
}
