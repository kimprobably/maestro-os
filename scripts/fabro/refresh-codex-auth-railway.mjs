#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

function argValue(name, fallback = "") {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`Missing value for ${name}`);
  return value;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function readJsonBase64(path) {
  if (!existsSync(path)) return null;
  const raw = readFileSync(path, "utf8");
  try {
    JSON.parse(raw);
  } catch {
    throw new Error(`invalid JSON in ${path}`);
  }
  return Buffer.from(raw, "utf8").toString("base64");
}

function setRailwayVariable({ key, value, service, environment, skipDeploys }) {
  const args = [
    "variable",
    "set",
    key,
    "--stdin",
    "--service",
    service,
    "--environment",
    environment,
  ];
  if (skipDeploys) args.push("--skip-deploys");
  const result = spawnSync("railway", args, {
    input: value,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  });
  if (result.status !== 0) {
    throw new Error(`railway variable set failed for ${key} with status ${result.status ?? "unknown"}`);
  }
}

function redeployService({ service }) {
  const result = spawnSync("railway", ["service", "redeploy", "--service", service, "--yes"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0) {
    throw new Error(`railway service redeploy failed for ${service} with status ${result.status ?? "unknown"}`);
  }
}

function main() {
  const codexHome = resolve(argValue("--codex-home", process.env.CODEX_HOME || join(homedir(), ".codex")));
  const service = argValue("--service", process.env.FABRO_RAILWAY_SERVICE || "fabro-maestro");
  const environment = argValue("--environment", process.env.FABRO_RAILWAY_ENVIRONMENT || "production");
  const dryRun = hasFlag("--dry-run");
  const redeploy = hasFlag("--redeploy");
  const variables = [
    { key: "CODEX_AUTH_JSON_BASE64", path: join(codexHome, "auth.json") },
    { key: "CODEX_MCP_CREDENTIALS_JSON_BASE64", path: join(codexHome, ".credentials.json") },
  ]
    .map((item) => ({ ...item, value: readJsonBase64(item.path) }))
    .filter((item) => item.value);

  if (!variables.some((item) => item.key === "CODEX_AUTH_JSON_BASE64")) {
    console.error("missing valid Codex auth.json; run codex login first");
    process.exit(2);
  }

  if (!dryRun) {
    for (const variable of variables) {
      setRailwayVariable({
        key: variable.key,
        value: variable.value,
        service,
        environment,
        skipDeploys: true,
      });
    }
    if (redeploy) redeployService({ service });
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        service,
        environment,
        dry_run: dryRun,
        redeploy,
        variables: variables.map((item) => ({
          key: item.key,
          source: item.path,
          chars: item.value.length,
        })),
      },
      null,
      2,
    ),
  );
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
