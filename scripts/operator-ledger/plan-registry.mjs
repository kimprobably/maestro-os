#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join, relative, resolve, sep } from "node:path";
import { homedir } from "node:os";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";

const STANDARD_DIRS = [
  "docs/operator/plans/active",
  "docs/operator/plans/parked",
  "docs/operator/plans/archive",
  "docs/operator/specs/active",
  "docs/operator/specs/parked",
  "docs/operator/specs/archive",
  "docs/operator/briefs",
];

const TRUST_BOUNDARY =
  "Planning context registry entries are not committed decisions or ADRs. Treat them as current thinking, working notes, and retrievable context.";

const README = `# Planning Context Registry

This folder is the quick central home for working plans, specs, and briefs that Miles should be able to retrieve.

These files are not committed decisions or ADRs. They are planning context: useful for remembering what we are thinking about, what is active, and what has been parked.

## Layout

- \`plans/active\`: current implementation or operating plans.
- \`plans/parked\`: useful plans intentionally deferred.
- \`plans/archive\`: completed or obsolete plans kept for reference.
- \`specs/active\`: current product, workflow, or integration specs.
- \`specs/parked\`: specs that should stay visible but are not being implemented now.
- \`specs/archive\`: completed or obsolete specs kept for reference.
- \`briefs\`: short context briefs that do not need lifecycle buckets.

Each Markdown file can include YAML frontmatter with:

\`\`\`yaml
---
id: plan:example
status: active
domain: hermes
authority: planning-context
summary: One sentence summary.
links:
  slack_threads:
    - C123:171000.1
---
\`\`\`
`;

function argValue(name, fallback = null) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`Missing value for ${name}`);
  return value;
}

function defaultHome() {
  return process.env.HERMES_HOME || join(homedir(), ".hermes");
}

function rootPath() {
  return resolve(argValue("--root", process.cwd()));
}

function profileName() {
  return argValue("--profile", "maestro-operator");
}

function homePath() {
  return resolve(argValue("--home", defaultHome()));
}

function ledgerScriptPath() {
  return resolve(import.meta.dirname, "operator-ledger.mjs");
}

function dbPath(home = homePath(), profile = profileName()) {
  return resolve(home, "profiles", profile, "state", "operator-ledger.sqlite");
}

function schemaPath(root = rootPath()) {
  const rootSchema = resolve(root, "hermes/operator-ledger/schema.sql");
  if (existsSync(rootSchema)) return rootSchema;
  return resolve(import.meta.dirname, "../../hermes/operator-ledger/schema.sql");
}

function slugFromPath(filePath) {
  return filePath
    .replace(/\.md$/i, "")
    .split(/[\\/]/)
    .pop()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function ensureDirs(root) {
  for (const dir of STANDARD_DIRS) mkdirSync(resolve(root, dir), { recursive: true });

  const readmePath = resolve(root, "docs/operator/README.md");
  if (!existsSync(readmePath)) {
    mkdirSync(dirname(readmePath), { recursive: true });
    writeFileSync(readmePath, README);
  }

  return { ok: true, root, dirs: STANDARD_DIRS };
}

function walkMarkdown(dir) {
  if (!existsSync(dir)) return [];
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkMarkdown(path));
    else if (entry.isFile() && entry.name.endsWith(".md") && entry.name !== "README.md") files.push(path);
  }
  return files;
}

function parseScalar(raw) {
  const trimmed = raw.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  return trimmed;
}

function parseFrontmatter(markdown) {
  if (!markdown.startsWith("---\n")) return { data: {}, body: markdown };
  const end = markdown.indexOf("\n---", 4);
  if (end === -1) return { data: {}, body: markdown };

  const yaml = markdown.slice(4, end).split("\n");
  const body = markdown.slice(end + 4).replace(/^\n/, "");
  const data = {};
  let currentObject = null;
  let currentList = null;

  for (const rawLine of yaml) {
    if (!rawLine.trim() || rawLine.trim().startsWith("#")) continue;

    const top = rawLine.match(/^([A-Za-z0-9_-]+):(?:\s*(.*))?$/);
    if (top) {
      const [, key, rest = ""] = top;
      currentObject = key;
      currentList = null;
      if (rest.trim()) {
        data[key] = parseScalar(rest);
        currentObject = null;
      } else {
        data[key] = {};
      }
      continue;
    }

    const nestedListStart = rawLine.match(/^  ([A-Za-z0-9_-]+):\s*$/);
    if (nestedListStart && currentObject) {
      const key = nestedListStart[1];
      data[currentObject][key] = [];
      currentList = key;
      continue;
    }

    const nestedListItem = rawLine.match(/^    -\s+(.+)$/);
    if (nestedListItem && currentObject && currentList) {
      data[currentObject][currentList].push(parseScalar(nestedListItem[1]));
    }
  }

  return { data, body };
}

function titleFromBody(body, fallback) {
  const heading = body.match(/^#\s+(.+)$/m);
  return heading ? heading[1].trim() : fallback;
}

function summaryFromBody(body) {
  return body
    .replace(/^# .+$/gm, "")
    .split(/\n{2,}/)
    .map((part) => part.trim().replace(/\s+/g, " "))
    .find(Boolean);
}

function inferType(root, filePath, id) {
  if (id && id.includes(":")) return id.split(":", 1)[0];
  const rel = relative(root, filePath).split(sep).join("/");
  if (rel.startsWith("docs/operator/specs/")) return "spec";
  if (rel.startsWith("docs/operator/briefs/")) return "brief";
  return "plan";
}

function inferStatus(root, filePath, explicitStatus) {
  if (explicitStatus) return String(explicitStatus);
  const rel = relative(root, filePath).split(sep).join("/");
  if (rel.includes("/active/")) return "active";
  if (rel.includes("/parked/")) return "parked";
  if (rel.includes("/archive/")) return "archived";
  return "active";
}

function normalizePlanDoc(root, filePath) {
  const markdown = readFileSync(filePath, "utf8");
  const { data, body } = parseFrontmatter(markdown);
  const fileSha256 = createHash("sha256").update(markdown).digest("hex");
  const type = inferType(root, filePath, data.id);
  const key = data.id && data.id.includes(":") ? data.id.split(":").slice(1).join(":") : slugFromPath(filePath);
  const relPath = relative(root, filePath).split(sep).join("/");
  const title = titleFromBody(body, key);
  const status = inferStatus(root, filePath, data.status);
  const summary = String(data.summary || summaryFromBody(body) || title).slice(0, 500);
  const stats = statSync(filePath);
  const metadata = {
    id: `${type}:${key}`,
    path: relPath,
    status,
    domain: data.domain || "general",
    authority: data.authority || "planning-context",
    title,
    summary,
    links: data.links || {},
    trust_boundary: TRUST_BOUNDARY,
    file_mtime_ms: Math.trunc(stats.mtimeMs),
    file_sha256: fileSha256,
  };

  return {
    id: `${type}:${key}`,
    type,
    key,
    title,
    status,
    summary,
    metadata,
    path: relPath,
    externalId: `${relPath}:${fileSha256}`,
  };
}

function runLedger(root, args) {
  const result = spawnSync(process.execPath, [ledgerScriptPath(), ...args], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `operator ledger failed: ${args.join(" ")}`);
  }
  return result.stdout ? JSON.parse(result.stdout) : {};
}

function indexDocs(root, home, profile) {
  ensureDirs(root);
  runLedger(root, ["init", "--home", home, "--profile", profile, "--schema", schemaPath(root)]);

  const docs = [
    ...walkMarkdown(resolve(root, "docs/operator/plans")),
    ...walkMarkdown(resolve(root, "docs/operator/specs")),
    ...walkMarkdown(resolve(root, "docs/operator/briefs")),
  ].map((file) => normalizePlanDoc(root, file));

  for (const doc of docs) {
    runLedger(root, [
      "append-event",
      "--home",
      home,
      "--profile",
      profile,
      "--schema",
      schemaPath(root),
      "--subject-type",
      doc.type,
      "--subject-key",
      doc.key,
      "--subject-title",
      doc.title,
      "--subject-metadata-json",
      JSON.stringify(doc.metadata),
      "--event-type",
      `${doc.type}.indexed`,
      "--source",
      "plan-registry",
      "--external-id",
      doc.externalId,
      "--summary",
      doc.summary,
      "--payload-json",
      JSON.stringify({ path: doc.path, status: doc.status, authority: doc.metadata.authority }),
    ]);
    runLedger(root, [
      "upsert-checkpoint",
      "--home",
      home,
      "--profile",
      profile,
      "--schema",
      schemaPath(root),
      "--subject-type",
      doc.type,
      "--subject-key",
      doc.key,
      "--summary",
      doc.summary,
      "--state-json",
      JSON.stringify(doc.metadata),
    ]);
  }

  return { ok: true, indexed: docs.length, root, home, profile, items: docs.map(publicDoc) };
}

function sqliteJson(db, sql) {
  const result = spawnSync("sqlite3", [db], {
    input: `.mode json\n${sql}`,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || "sqlite3 failed");
  const output = result.stdout.trim();
  return output ? JSON.parse(output) : [];
}

function sqlQuote(value) {
  if (value === null || value === undefined) return "NULL";
  return `'${String(value).replaceAll("'", "''")}'`;
}

function readContext(root, home, profile) {
  runLedger(root, ["init", "--home", home, "--profile", profile, "--schema", schemaPath(root)]);
  const rows = sqliteJson(
    dbPath(home, profile),
    `
SELECT subject_type, subject_key, title, metadata_json, updated_at
FROM ledger_subjects
WHERE subject_type IN ('plan', 'spec', 'brief')
ORDER BY updated_at DESC, id DESC;
`,
  );
  const domain = argValue("--domain");
  const statuses = (argValue("--status") || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const items = rows
    .map((row) => {
      let metadata = {};
      try {
        metadata = row.metadata_json ? JSON.parse(row.metadata_json) : {};
      } catch {
        metadata = {};
      }
      return {
        id: metadata.id || `${row.subject_type}:${row.subject_key}`,
        type: row.subject_type,
        key: row.subject_key,
        title: row.title || metadata.title || row.subject_key,
        path: metadata.path,
        status: metadata.status || "active",
        domain: metadata.domain || "general",
        authority: metadata.authority || "planning-context",
        summary: metadata.summary,
        updated_at: row.updated_at,
      };
    })
    .filter((item) => !domain || item.domain === domain)
    .filter((item) => !statuses.length || statuses.includes(item.status));

  return { ok: true, root, home, profile, domain: domain || null, items, trust_boundary: TRUST_BOUNDARY };
}

function publicDoc(doc) {
  return {
    id: doc.id,
    type: doc.type,
    key: doc.key,
    path: doc.path,
    status: doc.status,
    authority: doc.metadata.authority,
    domain: doc.metadata.domain,
    summary: doc.summary,
  };
}

function usage(exitCode = 1) {
  console.log(`Usage:
  node scripts/operator-ledger/plan-registry.mjs ensure-dirs [--root <repo-root>]
  node scripts/operator-ledger/plan-registry.mjs index [--root <repo-root>] [--home <HERMES_HOME>] [--profile maestro-operator]
  node scripts/operator-ledger/plan-registry.mjs context [--root <repo-root>] [--home <HERMES_HOME>] [--profile maestro-operator] [--domain <domain>] [--status active,parked]
`);
  process.exit(exitCode);
}

function main() {
  const command = process.argv[2];
  if (!command || command === "--help" || command === "-h") usage(command ? 0 : 1);

  const root = rootPath();
  const home = homePath();
  const profile = profileName();

  if (command === "ensure-dirs") {
    console.log(JSON.stringify(ensureDirs(root), null, 2));
  } else if (command === "index") {
    console.log(JSON.stringify(indexDocs(root, home, profile), null, 2));
  } else if (command === "context") {
    console.log(JSON.stringify(readContext(root, home, profile), null, 2));
  } else {
    throw new Error(`Unknown command: ${command}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
