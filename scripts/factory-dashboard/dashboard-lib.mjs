import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
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

function ledgerRunId(event, index) {
  return event.run_id || event.fabro_run_id || event.runId || event.id || `unknown-${index + 1}`;
}

function ledgerStatus(event) {
  return String(event.current_status || event.status || event.event_kind || "unknown").toLowerCase();
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
  const exclude = new Set((options.excludePaths || ["reports/factory-dashboard.md"]).map(normalizePath));
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
    });
  }

  if (quality.missing_blocking > 0) {
    items.push({
      severity: "high",
      title: `Missing blocking eval evidence (${quality.missing_blocking})`,
      detail: detailList(quality.missing_blocking_ids),
    });
  }

  if (quality.failed_ids.length > 0) {
    items.push({
      severity: "high",
      title: `Failed blocking evals (${quality.failed_ids.length})`,
      detail: detailList(quality.failed_ids),
    });
  }

  if (quality.fallback_only_ids.length > 0) {
    items.push({
      severity: "medium",
      title: `Fallback-only evals need review (${quality.fallback_only_ids.length})`,
      detail: detailList(quality.fallback_only_ids),
    });
  }

  if (quality.index_issues.length > 0) {
    items.push({
      severity: "medium",
      title: `Eval index issues (${quality.index_issues.length})`,
      detail: detailList(quality.index_issues.map((issue) => issue.type || issue.message || "index issue")),
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
    });
  }

  if (runs.stale_runs.length > 0) {
    items.push({
      severity: "medium",
      title: `Possibly stuck Fabro runs (${runs.stale_runs.length})`,
      detail: detailList(runs.stale_runs.map((run) => run.run_id)),
    });
  }

  if (!runLedgerConnected) {
    items.push({
      severity: "medium",
      title: "Run ledger not connected",
      detail: "Pass --run-ledger with the Hermes Fabro run ledger JSONL path to include run production and failure data.",
    });
  }

  if (ledgerIssues.length > 0) {
    items.push({
      severity: "medium",
      title: `Run ledger parse issues (${ledgerIssues.length})`,
      detail: detailList(ledgerIssues.map((issue) => (issue.line ? `${issue.source}:${issue.line}` : issue.source))),
    });
  }

  if (artifacts.total === 0) {
    items.push({
      severity: "medium",
      title: "No factory artifacts discovered",
      detail: "The reports directory did not contain generated factory output.",
    });
  }

  return items;
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

  return {
    schema_version: 1,
    generated_at: now,
    status: attentionItems.length > 0 ? "attention_required" : "working",
    working: attentionItems.length === 0,
    production: {
      artifacts,
      runs,
    },
    quality,
    attention_items: attentionItems,
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
    .map((item, index) => `${index + 1}. **${item.title}** (${item.severity}) - ${item.detail || "Review required."}`)
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
  const runStreamStatus = runs.source_connected
    ? runs.failed === 0 && runs.stale_active === 0
      ? "working"
      : "attention"
    : "not connected";
  const runStreamNotes = runs.source_connected
    ? `${runs.total} tracked runs, ${runs.completed} completed, ${runs.failed} failed, ${runs.active} active.`
    : "No run ledger path supplied, so production run state is not included.";

  return `# Factory Dashboard

Generated: ${dashboard.generated_at}
Overall: **${statusLabel}**

## Is The Factory Working?

| Signal | Status | Notes |
| --- | --- | --- |
| Eval gate | ${quality.blocking_failure_ids.length === 0 && quality.source_present ? "working" : "attention"} | ${quality.blocking_failure_ids.length === 0 ? "No blocking eval failures in the current index." : `${quality.blocking_failure_ids.length} blocking evals need evidence or fixes.`} |
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
