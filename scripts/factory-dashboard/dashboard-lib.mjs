import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { homedir } from "node:os";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";

const ACTIVE_RUN_STATUSES = new Set(["queued", "pending", "running", "submitted", "in_progress"]);
const COMPLETED_RUN_STATUSES = new Set(["complete", "completed", "passed", "success", "succeeded"]);
const FAILED_RUN_STATUSES = new Set(["cancelled", "canceled", "error", "failed", "timeout", "timed_out"]);
const DEFAULT_STALE_RUN_MINUTES = 60;

function normalizePath(path) {
  return path.split("\\").join("/");
}

function asIsoString(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function minutesBetween(start, end) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return null;
  return (endDate.getTime() - startDate.getTime()) / 60000;
}

function countBy(items, getKey) {
  const counts = {};
  for (const item of items) {
    const key = getKey(item) || "unknown";
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

function latestTimestamp(event) {
  return asIsoString(event.recorded_at || event.updated_at || event.created_at || event.timestamp);
}

function ledgerText(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed || trimmed === "[object Object]") return null;
    return trimmed;
  }
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return null;
}

function ledgerRunId(event, index) {
  return ledgerText(event.run_id) || ledgerText(event.fabro_run_id) || ledgerText(event.runId) || ledgerText(event.id) || `unknown-${index + 1}`;
}

function ledgerStatus(event) {
  return (ledgerText(event.current_status) || ledgerText(event.status) || ledgerText(event.event_kind) || "unknown").toLowerCase();
}

function isBlockingFailure(entry) {
  if (!entry?.blocking) return false;
  const result = entry.result;
  if (!result) return true;
  if (result.gate_status === "waived" || result.waiver_status === "accepted") return false;
  return result.gate_status === "failed" || result.gate_status === "fallback_only" || result.passed !== true;
}

function detailList(items, maxItems = 8) {
  const values = items.filter(Boolean);
  if (values.length <= maxItems) return values.join(", ");
  return `${values.slice(0, maxItems).join(", ")} and ${values.length - maxItems} more`;
}

function escapeCell(value) {
  return String(value ?? "").replaceAll("|", "\\|").replaceAll("\n", " ");
}

export function displayLocalPath(path, options = {}) {
  if (!path) return null;
  const absolutePath = resolve(path);
  const hermesHome = options.hermesHome || process.env.HERMES_HOME;
  if (hermesHome) {
    const absoluteHermesHome = resolve(hermesHome);
    if (absolutePath === absoluteHermesHome) return "$HERMES_HOME";
    if (absolutePath.startsWith(`${absoluteHermesHome}/`)) {
      return `$HERMES_HOME/${normalizePath(relative(absoluteHermesHome, absolutePath))}`;
    }
  }

  const home = options.home || homedir();
  if (home) {
    const absoluteHome = resolve(home);
    if (absolutePath === absoluteHome) return "$HOME";
    if (absolutePath.startsWith(`${absoluteHome}/`)) {
      return `$HOME/${normalizePath(relative(absoluteHome, absolutePath))}`;
    }
  }

  return normalizePath(path);
}

export function parseJsonlEvents(text, source = "run-ledger.jsonl") {
  const events = [];
  const issues = [];
  const lines = String(text || "").split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (!line) continue;

    try {
      const parsed = JSON.parse(line);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        issues.push({
          type: "invalid_jsonl_event",
          source,
          line: index + 1,
          message: "ledger event must be a JSON object",
        });
        continue;
      }
      events.push(parsed);
    } catch (error) {
      issues.push({
        type: "malformed_jsonl",
        source,
        line: index + 1,
        message: error.message,
      });
    }
  }

  return { events, issues };
}

export function readJsonlEvents(path) {
  if (!path) return { events: [], issues: [] };
  if (!existsSync(path)) {
    return {
      events: [],
      issues: [
        {
          type: "missing_jsonl",
          source: path,
          message: "run ledger file not found",
        },
      ],
    };
  }
  return parseJsonlEvents(readFileSync(path, "utf8"), path);
}

export function defaultRunLedgerSources(options = {}) {
  const hermesHome = options.hermesHome || process.env.HERMES_HOME || join(homedir(), ".hermes");
  const profile = options.profile || "maestro-operator";
  return [
    join(hermesHome, "profiles", profile, "state", "fabro-run-ledger.jsonl"),
    join(hermesHome, "profiles", profile, "state", "fabro-run-ledger.sqlite"),
    join(hermesHome, "state", "fabro-run-ledger.jsonl"),
    join(hermesHome, "state", "fabro-run-ledger.sqlite"),
  ];
}

export function discoverRunLedgerSource(options = {}) {
  return defaultRunLedgerSources(options).find((path) => existsSync(path)) || null;
}

export function readSqliteLedgerEvents(path) {
  if (!path) return { events: [], issues: [] };
  if (!existsSync(path)) {
    return {
      events: [],
      issues: [
        {
          type: "missing_sqlite",
          source: path,
          message: "run ledger SQLite file not found",
        },
      ],
    };
  }

  const query = `
SELECT
  run_id,
  workflow_file,
  'ledger_projection' AS event_kind,
  current_status,
  current_node,
  next_node_id,
  failure_class,
  latest_git_sha,
  run_branch,
  sandbox_name,
  sandbox_id,
  next_action,
  updated_at AS recorded_at
FROM fabro_runs
ORDER BY updated_at DESC;
`;
  const result = spawnSync("sqlite3", ["-json", path, query], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  if (result.status !== 0) {
    return {
      events: [],
      issues: [
        {
          type: "sqlite_read_failed",
          source: path,
          message: result.stderr || result.stdout || "sqlite3 failed",
        },
      ],
    };
  }

  try {
    return {
      events: JSON.parse(result.stdout || "[]"),
      issues: [],
    };
  } catch (error) {
    return {
      events: [],
      issues: [
        {
          type: "malformed_sqlite_json",
          source: path,
          message: error.message,
        },
      ],
    };
  }
}

export function readRunLedgerSource(path) {
  if (!path) return { events: [], issues: [] };
  if (path.endsWith(".sqlite") || path.endsWith(".db")) return readSqliteLedgerEvents(path);
  return readJsonlEvents(path);
}

export function readDefaultRunLedgerEvents(options = {}) {
  const source = discoverRunLedgerSource(options);
  if (!source) return { source: null, events: [], issues: [] };
  const parsed = readRunLedgerSource(source);
  return { source, ...parsed };
}

export function readJsonFile(path, fallback = null) {
  if (!path || !existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, "utf8"));
}

export function writeTextFile(path, text) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text);
}

export function categorizeArtifact(path) {
  const lower = normalizePath(path).toLowerCase();
  if (lower.includes("/evals/") || lower.includes("eval-") || lower.endsWith("/eval-index.json")) return "eval";
  if (lower.includes("/quality/") || lower.includes("quality") || lower.includes("qlty")) return "quality";
  if (lower.includes("/reviews/") || lower.includes("review")) return "review";
  if (lower.includes("handoff")) return "handoff";
  if (lower.includes("postmortem")) return "postmortem";
  return "other";
}

export function discoverReportArtifacts(reportsRoot = "reports", options = {}) {
  const repoRoot = resolve(options.repoRoot || process.cwd());
  const absoluteReportsRoot = isAbsolute(reportsRoot) ? reportsRoot : resolve(repoRoot, reportsRoot);
  const exclude = new Set((options.excludePaths || ["reports/factory-dashboard.md", "reports/factory-health.json"]).map(normalizePath));
  const artifacts = [];

  function visit(dir) {
    if (!existsSync(dir)) return;

    for (const entry of readdirSync(dir)) {
      if (entry.startsWith(".")) continue;
      const path = join(dir, entry);
      const stats = statSync(path);

      if (stats.isDirectory()) {
        visit(path);
        continue;
      }

      if (!stats.isFile()) continue;
      const relativePath = normalizePath(relative(repoRoot, path));
      if (exclude.has(relativePath)) continue;

      artifacts.push({
        path: relativePath,
        category: categorizeArtifact(relativePath),
        bytes: stats.size,
        modified_at: stats.mtime.toISOString(),
      });
    }
  }

  visit(absoluteReportsRoot);
  return artifacts.sort((left, right) => left.path.localeCompare(right.path));
}

function summarizeEvalIndex(evalIndex) {
  const summary = evalIndex?.summary || {};
  const evals = evalIndex?.evals || [];
  const blockingFailures = evals.filter(isBlockingFailure);
  const missingBlocking = (evalIndex?.missing || [])
    .filter((item) => item.blocking)
    .map((item) => item.eval_id)
    .filter(Boolean);
  const fallbackOnly = evals
    .filter((entry) => entry.blocking && entry.result?.gate_status === "fallback_only")
    .map((entry) => entry.id);
  const failed = evals
    .filter((entry) => entry.blocking && entry.result?.gate_status === "failed")
    .map((entry) => entry.id);
  const waived = evals
    .filter((entry) => entry.blocking && (entry.result?.gate_status === "waived" || entry.result?.waiver_status === "accepted"))
    .map((entry) => entry.id);

  return {
    source_present: Boolean(evalIndex),
    source_created_at: evalIndex?.created_at || null,
    total_registered: summary.total_registered ?? evals.length,
    blocking_registered: summary.blocking_registered ?? evals.filter((entry) => entry.blocking).length,
    present_results: summary.present_results ?? evals.filter((entry) => entry.result).length,
    passed: summary.passed ?? evals.filter((entry) => entry.result?.gate_status === "passed").length,
    failed: summary.failed ?? failed.length,
    fallback_only: summary.fallback_only ?? fallbackOnly.length,
    waived: summary.waived ?? waived.length,
    missing_blocking: summary.missing_blocking ?? missingBlocking.length,
    missing_blocking_ids: missingBlocking,
    failed_ids: failed,
    fallback_only_ids: fallbackOnly,
    waived_ids: waived,
    blocking_failure_ids: blockingFailures.map((entry) => entry.id),
    index_issues: evalIndex?.issues || [],
  };
}

function summarizeArtifacts(artifacts) {
  const sorted = [...artifacts].sort((left, right) => String(right.modified_at).localeCompare(String(left.modified_at)));
  return {
    total: artifacts.length,
    bytes_total: artifacts.reduce((total, artifact) => total + (artifact.bytes || 0), 0),
    by_category: countBy(artifacts, (artifact) => artifact.category || categorizeArtifact(artifact.path)),
    recent: sorted.slice(0, 8),
  };
}

function summarizeLedgerRuns(events, now, staleRunMinutes) {
  const byRun = new Map();

  events.forEach((event, index) => {
    const runId = ledgerRunId(event, index);
    const timestamp = latestTimestamp(event);
    const candidate = {
      ...event,
      run_id: runId,
      workflow: ledgerText(event.workflow) || ledgerText(event.workflow_file),
      status: ledgerStatus(event),
      recorded_at: timestamp,
    };
    const current = byRun.get(runId);
    if (!current || String(candidate.recorded_at || "").localeCompare(String(current.recorded_at || "")) >= 0) {
      byRun.set(runId, candidate);
    }
  });

  const runs = [...byRun.values()];
  const failedRuns = runs.filter((run) => FAILED_RUN_STATUSES.has(run.status) || run.failure_class);
  const completedRuns = runs.filter((run) => COMPLETED_RUN_STATUSES.has(run.status));
  const activeRuns = runs.filter((run) => ACTIVE_RUN_STATUSES.has(run.status));
  const staleRuns = activeRuns.filter((run) => {
    const age = minutesBetween(run.recorded_at, now);
    return age !== null && age > staleRunMinutes;
  });

  return {
    total: runs.length,
    completed: completedRuns.length,
    failed: failedRuns.length,
    active: activeRuns.length,
    stale_active: staleRuns.length,
    unknown: runs.filter((run) => !COMPLETED_RUN_STATUSES.has(run.status) && !FAILED_RUN_STATUSES.has(run.status) && !ACTIVE_RUN_STATUSES.has(run.status)).length,
    by_status: countBy(runs, (run) => run.status),
    failed_runs: failedRuns,
    stale_runs: staleRuns,
    recent: runs.sort((left, right) => String(right.recorded_at || "").localeCompare(String(left.recorded_at || ""))).slice(0, 8),
  };
}

function buildAttentionItems({ quality, artifacts, runs, ledgerIssues, runLedgerConnected }) {
  const items = [];

  if (!quality.source_present) {
    items.push({
      severity: "high",
      title: "Eval index missing",
      detail: "Run npm run eval:index so factory quality can be rolled up.",
      action: "Assign Quincy to regenerate the eval index and report why it was missing.",
    });
  }

  if (quality.missing_blocking > 0) {
    items.push({
      severity: "high",
      title: `Missing blocking eval evidence (${quality.missing_blocking})`,
      detail: detailList(quality.missing_blocking_ids),
      action: "Assign Quincy to connect normalized result emission for these evals and rerun npm run eval:index.",
    });
  }

  if (quality.failed_ids.length > 0) {
    items.push({
      severity: "high",
      title: `Failed blocking evals (${quality.failed_ids.length})`,
      detail: detailList(quality.failed_ids),
      action: "Assign Quincy to inspect the failing eval artifacts, patch the smallest responsible surface, and rerun the gate.",
    });
  }

  if (quality.fallback_only_ids.length > 0) {
    items.push({
      severity: "medium",
      title: `Fallback-only evals need review (${quality.fallback_only_ids.length})`,
      detail: detailList(quality.fallback_only_ids),
      action: "Either restore primary runner evidence or create an accepted-risk waiver with compensating control.",
    });
  }

  if (quality.index_issues.length > 0) {
    items.push({
      severity: "medium",
      title: `Eval index issues (${quality.index_issues.length})`,
      detail: detailList(quality.index_issues.map((issue) => issue.type || issue.message || "index issue")),
      action: "Fix registry/result mismatches before treating the quality rollup as trustworthy.",
    });
  }

  if (runs.failed_runs.length > 0) {
    items.push({
      severity: "high",
      title: `Failed Fabro runs (${runs.failed_runs.length})`,
      detail: detailList(
        runs.failed_runs.map((run) => {
          const suffix = run.failure_class ? ` (${run.failure_class})` : "";
          return `${run.run_id}${suffix}`;
        }),
      ),
      action: "Assign Quincy to classify each failed run and convert recurring causes into evals, rules, or backlog items.",
    });
  }

  if (runs.stale_runs.length > 0) {
    items.push({
      severity: "medium",
      title: `Possibly stuck Fabro runs (${runs.stale_runs.length})`,
      detail: detailList(runs.stale_runs.map((run) => run.run_id)),
      action: "Assign Quincy to inspect run projection and event cursors, then resume, fork, or escalate.",
    });
  }

  if (runs.unknown > 0) {
    items.push({
      severity: "medium",
      title: `Unknown Fabro run status (${runs.unknown})`,
      detail: `${runs.unknown} tracked run projections do not have a known terminal or active status.`,
      action: "Assign Quincy to refresh the run projection and classify unknown runs as completed, failed, active, or intentionally ignored.",
    });
  }

  if (!runLedgerConnected) {
    items.push({
      severity: "medium",
      title: "Run ledger not connected",
      detail: "Pass --run-ledger with the Hermes Fabro run ledger JSONL path to include run production and failure data.",
      action: "Wire the Hermes Fabro run ledger into npm run factory:dashboard so daily health includes production state.",
    });
  }

  if (ledgerIssues.length > 0) {
    items.push({
      severity: "medium",
      title: `Run ledger parse issues (${ledgerIssues.length})`,
      detail: detailList(ledgerIssues.map((issue) => (issue.line ? `${issue.source}:${issue.line}` : issue.source))),
      action: "Repair malformed ledger records or point the dashboard at the correct ledger path.",
    });
  }

  if (artifacts.total === 0) {
    items.push({
      severity: "medium",
      title: "No factory artifacts discovered",
      detail: "The reports directory did not contain generated factory output.",
      action: "Run the factory workflow or point the dashboard at the report root that contains generated artifacts.",
    });
  }

  return items;
}

function percent(numerator, denominator) {
  if (!denominator) return 100;
  return Math.round((numerator / denominator) * 100);
}

function buildOwnerActions(attentionItems) {
  return attentionItems.slice(0, 3).map((item) => ({
    severity: item.severity,
    title: item.title,
    why_it_matters: item.detail || "Review required.",
    action: item.action || "Assign Quincy to inspect and report the next concrete action.",
  }));
}

function buildOwnerRollup({ status, quality, artifacts, runs, attentionItems }) {
  const evalEvidenceCoverage = percent(quality.present_results, quality.blocking_registered);
  const hasLearningInputs = runs.source_connected && quality.source_present;
  const learningStatus = hasLearningInputs
    ? attentionItems.length > 0
      ? "attention"
      : "working"
    : "instrumentation_needed";

  return {
    status,
    headline: status === "working" ? "Factory is operating within current gates." : "Factory needs owner attention.",
    key_metrics: {
      factory_status: status,
      report_artifacts: artifacts.total,
      fabro_runs_tracked: runs.total,
      completed_runs: runs.completed,
      failed_runs: runs.failed,
      eval_evidence_coverage_pct: evalEvidenceCoverage,
      missing_blocking_evals: quality.missing_blocking,
      top_attention_items: Math.min(attentionItems.length, 3),
    },
    owner_actions: buildOwnerActions(attentionItems),
    learning_loop: {
      status: learningStatus,
      rule: "Every repeated failure should become an eval, counterexample, workflow rule, agent rule, or backlog item.",
      open_improvement_signals: attentionItems.filter((item) => item.severity === "high").length,
    },
  };
}

function buildAgentAccess() {
  return {
    daily_owner: "quincy",
    render_command: "npm run factory:dashboard",
    read_path: "reports/factory-health.json",
    human_path: "reports/factory-dashboard.md",
    required_outputs: ["reports/factory-dashboard.md", "reports/factory-health.json"],
    report_policy: "Report owner_rollup.owner_actions, metric deltas, and escalation needs only. Do not dump logs or secrets.",
    escalation_fields: [
      "owner_rollup.owner_actions",
      "quality.missing_blocking_ids",
      "production.runs.failed_runs",
      "production.runs.stale_runs",
    ],
  };
}

export function buildFactoryDashboard(options = {}) {
  const now = options.now || new Date().toISOString();
  const ledgerEvents = options.ledgerEvents || [];
  const quality = summarizeEvalIndex(options.evalIndex || null);
  const artifacts = summarizeArtifacts(options.artifacts || []);
  const runs = summarizeLedgerRuns(ledgerEvents, now, options.staleRunMinutes || DEFAULT_STALE_RUN_MINUTES);
  const ledgerIssues = options.ledgerIssues || [];
  const runLedgerConnected = Boolean(options.sources?.run_ledger) || ledgerEvents.length > 0 || ledgerIssues.length > 0;
  runs.source_connected = runLedgerConnected;
  const attentionItems = buildAttentionItems({ quality, artifacts, runs, ledgerIssues, runLedgerConnected });
  const status = attentionItems.length > 0 ? "attention_required" : "working";
  const ownerRollup = buildOwnerRollup({ status, quality, artifacts, runs, attentionItems });

  return {
    schema_version: 1,
    generated_at: now,
    status,
    working: attentionItems.length === 0,
    owner_rollup: ownerRollup,
    production: {
      artifacts,
      runs,
    },
    quality,
    attention_items: attentionItems,
    agent_access: buildAgentAccess(),
    sources: {
      eval_index: options.sources?.eval_index || null,
      reports_root: options.sources?.reports_root || null,
      run_ledger: options.sources?.run_ledger || null,
    },
  };
}

function renderArtifactRows(artifacts) {
  const categories = artifacts.by_category;
  const rows = Object.keys(categories)
    .sort()
    .map((category) => `| ${escapeCell(category)} | ${categories[category]} |`);
  if (rows.length === 0) return "| none | 0 |";
  return rows.join("\n");
}

function renderAttentionItems(items) {
  if (items.length === 0) return "No immediate attention items.";
  return items
    .map((item, index) => `${index + 1}. **${item.title}** (${item.severity}) - ${item.detail || "Review required."}\n   Action: ${item.action || "Inspect and report the next concrete action."}`)
    .join("\n");
}

function renderOwnerActions(actions) {
  if (actions.length === 0) return "No owner action required.";
  return actions
    .map((item, index) => `${index + 1}. **${item.title}** (${item.severity}) - ${item.action}`)
    .join("\n");
}

function renderRecentArtifacts(artifacts) {
  if (artifacts.recent.length === 0) return "No report artifacts discovered.";
  return artifacts.recent
    .map((artifact) => `- ${artifact.path} (${artifact.category}, ${artifact.bytes} bytes)`)
    .join("\n");
}

function renderRecentRuns(runs) {
  if (runs.recent.length === 0) return "No run ledger events were included.";
  return runs.recent
    .map((run) => {
      const workflow = run.workflow ? `, ${run.workflow}` : "";
      const failure = run.failure_class ? `, ${run.failure_class}` : "";
      return `- ${run.run_id}: ${run.status}${workflow}${failure}`;
    })
    .join("\n");
}

export function renderFactoryDashboard(dashboard) {
  const statusLabel = dashboard.status === "working" ? "WORKING" : "ATTENTION REQUIRED";
  const quality = dashboard.quality;
  const artifacts = dashboard.production.artifacts;
  const runs = dashboard.production.runs;
  const owner = dashboard.owner_rollup;
  const evalGateHealthy = quality.source_present && quality.blocking_failure_ids.length === 0 && quality.index_issues.length === 0;
  const evalGateNotes = evalGateHealthy
    ? "No blocking eval failures in the current index."
    : quality.index_issues.length > 0
      ? `${quality.index_issues.length} eval index issues must be resolved before trusting the rollup.`
      : `${quality.blocking_failure_ids.length} blocking evals need evidence or fixes.`;
  const runStreamStatus = runs.source_connected
    ? runs.failed === 0 && runs.stale_active === 0 && runs.unknown === 0
      ? "working"
      : "attention"
    : "not connected";
  const runStreamNotes = runs.source_connected
    ? `${runs.total} tracked runs, ${runs.completed} completed, ${runs.failed} failed, ${runs.active} active, ${runs.unknown} unknown.`
    : "No run ledger path supplied, so production run state is not included.";

  return `# Factory Dashboard

Generated: ${dashboard.generated_at}
Overall: **${statusLabel}**

## Owner Rollup

${owner.headline}

| Metric | Value |
| --- | ---: |
| Factory Status | ${owner.key_metrics.factory_status} |
| Report Artifacts | ${owner.key_metrics.report_artifacts} |
| Fabro Runs Tracked | ${owner.key_metrics.fabro_runs_tracked} |
| Completed Runs | ${owner.key_metrics.completed_runs} |
| Failed Runs | ${owner.key_metrics.failed_runs} |
| Eval Evidence Coverage | ${owner.key_metrics.eval_evidence_coverage_pct}% |
| Missing Blocking Evals | ${owner.key_metrics.missing_blocking_evals} |

### Owner Actions

${renderOwnerActions(owner.owner_actions)}

## Is The Factory Working?

| Signal | Status | Notes |
| --- | --- | --- |
| Eval gate | ${evalGateHealthy ? "working" : "attention"} | ${evalGateNotes} |
| Fabro run stream | ${runStreamStatus} | ${runStreamNotes} |
| Artifact stream | ${artifacts.total > 0 ? "working" : "attention"} | ${artifacts.total} generated report artifacts. |

## How Much Has It Produced?

| Metric | Count |
| --- | ---: |
| Report Artifacts | ${artifacts.total} |
| Fabro Runs Tracked | ${runs.total} |
| Completed Runs | ${runs.completed} |
| Failed Runs | ${runs.failed} |
| Active Runs | ${runs.active} |

### Artifact Categories

| Category | Count |
| --- | ---: |
${renderArtifactRows(artifacts)}

## Quality Of Output

| Metric | Count |
| --- | ---: |
| Registered Evals | ${quality.total_registered} |
| Blocking Evals | ${quality.blocking_registered} |
| Present Results | ${quality.present_results} |
| Passed | ${quality.passed} |
| Failed | ${quality.failed} |
| Fallback Only | ${quality.fallback_only} |
| Waived | ${quality.waived} |
| Missing Blocking | ${quality.missing_blocking} |

Eval index generated: ${quality.source_created_at || "not available"}

## Pay Attention

${renderAttentionItems(dashboard.attention_items)}

## Recent Factory Artifacts

${renderRecentArtifacts(artifacts)}

## Recent Fabro Runs

${renderRecentRuns(runs)}

## Inputs

| Input | Path |
| --- | --- |
| Eval Index | ${escapeCell(dashboard.sources.eval_index || "not configured")} |
| Reports Root | ${escapeCell(dashboard.sources.reports_root || "not configured")} |
| Run Ledger | ${escapeCell(dashboard.sources.run_ledger || "not configured")} |
`;
}
