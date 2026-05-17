#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import path from "node:path";

function argValue(name, fallback = "") {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return fallback;
  return process.argv[idx + 1] || fallback;
}

function repoRoot() {
  return path.resolve(import.meta.dirname, "../..");
}

async function loadRegistry(root) {
  const registryPath = path.join(root, "hermes/agents/registry.json");
  return JSON.parse(await readFile(registryPath, "utf8"));
}

async function loadNamePool(root) {
  return readFile(path.join(root, "hermes/agents/name-pool.md"), "utf8");
}

function printAgent(agent) {
  console.log(`${agent.name} (${agent.profile})`);
  console.log(`  status: ${agent.status}`);
  console.log(`  interface: ${agent.interface}`);
  console.log(`  role: ${agent.role}`);
  console.log(`  memory_peer: ${agent.memory_peer}`);
  console.log(`  current_focus: ${agent.current_focus}`);
  console.log(`  handoff: ${agent.handoff}`);
  console.log(`  owns: ${agent.owns.join(", ")}`);
}

function printList(registry) {
  console.log(`Maestro agent registry v${registry.version} (${registry.updated})`);
  console.log("");
  for (const agent of registry.agents) {
    console.log(`${agent.name.padEnd(8)} ${agent.profile.padEnd(17)} ${agent.status.padEnd(8)} ${agent.role}`);
  }
}

const command = process.argv[2] || "list";
const root = path.resolve(argValue("--root", process.cwd() === "/app" ? "/app" : repoRoot()));

if (command === "list") {
  printList(await loadRegistry(root));
} else if (command === "json") {
  console.log(JSON.stringify(await loadRegistry(root), null, 2));
} else if (command === "show") {
  const query = (process.argv[3] || "").toLowerCase();
  if (!query || query.startsWith("--")) {
    console.error("usage: agent-registry.mjs show <name-or-profile>");
    process.exit(2);
  }
  const registry = await loadRegistry(root);
  const agent = registry.agents.find((candidate) => {
    return candidate.name.toLowerCase() === query || candidate.profile.toLowerCase() === query;
  });
  if (!agent) {
    console.error(`unknown agent: ${query}`);
    process.exit(1);
  }
  printAgent(agent);
} else if (command === "names") {
  process.stdout.write(await loadNamePool(root));
} else {
  console.error(`unknown command: ${command}`);
  console.error("commands: list, show <name-or-profile>, names, json");
  process.exit(2);
}
