# Fabro Babysitter

Use this skill when operating or monitoring Fabro workflow runs for Maestro.

## Purpose

Manage long-running Fabro workflow runs through completion using Fabro MCP, durable evidence, and safe cloud execution.

Fabro is eventually consistent. Do not trust any single surface. The source of truth is the combination of MCP events, durable inspect state, Git run branch, Daytona sandbox filesystem, rerun gates, and the run ledger.

## Available Fabro MCP Tools

- `fabro_run_search`
- `fabro_run_create`
- `fabro_run_interact`
- `fabro_run_events`
- `fabro_run_gather`

## Hard Rules

- Never print secret values.
- Credential checks are presence-only. If a credential is missing, report only the key name.
- Do not run `env`, `printenv`, `set`, `export`, `declare -x`, or broad process dumps.
- For shared Maestro runs, default to Railway Fabro at `https://fabro-maestro-production.up.railway.app/api/v1`; local Fabro is opt-in only.
- If a run is expected in the Railway UI, fail preflight when `FABRO_SERVER` points at `127.0.0.1` or `localhost`.
- Real app factory runs need run-specific TOML. Do not launch generic defaults.
- Treat human testing and App Store submission as out of scope unless explicitly requested.
- For iOS validation, prefer GitHub Actions hosted macOS.
- Do not trust a Fabro approved stage blindly. Inspect the underlying review artifacts and gates.
- Do not discard a failed Daytona sandbox until sandbox state and `git status` have been inspected through an approved recovery path.
- Do not call code work done without review and tests/gates.

## Eval Accounting Checklist

For every Fabro run or workflow-building task:

1. Run or inspect `node scripts/evals/validate-registry.mjs`.
2. Run or inspect workflow coverage for touched `.fabro` files.
3. Collect normalized eval results into `reports/eval-index.json`.
4. Report missing blocking evals.
5. Report fallback-only evals separately from passing evals.
6. Require an accepted-risk waiver before treating a fallback-only eval as complete.
7. For changed evals, require a counterexample or meta-eval.

## Factory Health Daily Check

When assigned daily factory health ownership:

1. Run or inspect `npm run factory:dashboard`.
2. Read `reports/factory-health.json` as the agent API.
3. Use `owner_rollup.key_metrics` for the high-level state.
4. Use `owner_rollup.owner_actions` as the only default owner-facing action list.
5. Use `agent_access.escalation_fields` for drilldown when an action needs evidence.
6. Report deltas since the prior check when available.
7. If the same failure class recurs, create or update an eval, counterexample, workflow rule, agent rule, or improvement backlog item.

Do not send raw logs, full event streams, or artifact dumps in the daily health note. The owner rollup is intentionally selective.

The dashboard auto-discovers the default Hermes Fabro run ledger under `$HERMES_HOME` or `$HOME/.hermes`. Use `--run-ledger` only when checking a non-default ledger.

## Ledger Fields

Maintain these fields for each active run:

- `active_run_id`
- `prior_run_ids`
- `workflow_file`
- `app_inputs`
- `last_event_cursor`
- `current_status`
- `current_node`
- `next_node_id`
- `latest_git_sha`
- `run_branch`
- `sandbox_name`
- `sandbox_id`
- `known_failures`
- `decisions_taken`
- `open_quality_risks`
- `next_action`

Use `hermes/run-ledger/schema.sql` for the durable schema. If SQLite is unavailable, append JSONL entries with the same fields.

## Operating Loop

0. Preflight.
   - Run `node scripts/fabro/railway-preflight.mjs` before shared runs.
   - Confirm Railway health, Fabro auth, workflow registration, required env key presence, git upstream, and clean workflow/script/prompt/doc surfaces.
   - Confirm run-specific inputs: `app_type`, `target_audience`, `app_name`, `bundle_id`, `spec_kitty_feature`, `app_dir`, `ios_validation_mode=github`, and `allow_macos_deferred=false`.

1. Observe.
   - Check MCP availability first.
   - Use `fabro_run_search` to find active/recent runs.
   - Use `fabro_run_interact` with action `get` for durable run projection.
   - Use `fabro_run_events` for event truth.
   - Use `fabro_run_gather` for waiting, not as the only source of truth.
   - When running from a shell-capable host, run `node scripts/fabro/babysit-run.mjs --run-id <id>` so observations are written to the Hermes ledger continuously.

2. Classify.
   - Record current status, node/stage, latest event cursor, branch SHA, sandbox/runtime, and next node.
   - Classify failure as `transient_infra`, `deterministic`, `control_plane`, `quality_gate`, `approval_blocked`, or `unknown`.

3. Act.
   - If status is `submitted`, start the run.
   - If status is `queued` or `running`, gather/wait and poll events by cursor.
   - If failure is `transient_infra`, retry/fork/resume only after checking run projection and sandbox state.
   - If failure is `deterministic`, inspect the failed gate output, patch the smallest responsible surface through a worker lane or workflow fix, rerun the gate, then continue.
   - If Fabro control-plane commands fail, fall back to the run branch, preserved Daytona sandbox, local recovery worktree, and static scripts/gates.
   - If generated app quality gates are missing, patch the app/workflow rather than marking evidence as passed.

4. Verify.
   - Run local/static gates first.
   - Use hosted GitHub/macOS gates when Xcode/Appium/iOS are required.
   - Inspect all review outputs when fan-in or consensus stages matter.

5. Persist.
   - Update the run ledger after every meaningful event.
   - Include run ID, cursor, branch, checkpoint, current node, decision, and next action.
   - Store evidence references, not log dumps.

6. Report.
   - Summarize status, failure class, evidence, decision, and next action.
   - Do not dump long logs or secrets.
   - Escalate only approval needs, missing credential names, unresolved quality risks, or blocked decisions.

7. Postmortem.
   - For substantial runs, write `docs/fabro-postmortems/<YYYY-MM-DD>-<run-id-or-slug>.md`.
   - A substantial run is one that took more than 30 minutes, crossed multiple stages, produced a production artifact, failed, forked, restarted, needed manual recovery, or revealed a new failure mode.
   - Capture what worked, what failed, Fabro-owned work versus babysitter work, verification evidence, open risks, and learnings.
   - Add concrete improvement ideas to `docs/FABRO-RUN-IMPROVEMENT-BACKLOG.md`.
   - Do not leave learnings only in chat.

## Failure Notes

- Failed runs may still have useful durable state. Inspect `next_node_id`, `git_commit_sha`, and `node_outcomes`.
- A run can fail at artifact collection or metadata push after useful code exists.
- Fabro forks/resumes can hit status-transition bugs. After forking, inspect the new run and confirm the next node before starting.
- `.workflow` artifacts may exist in durable state or a Daytona workspace even if not committed to the run branch.
- Fan-in can select the wrong successful branch. Read all review outputs when quality matters.
- Deterministic failures require code or workflow fixes. Transient infra failures can be retried or forked.

## Known iPhone Factory Signatures

- `dns error`, `failed to lookup address`, `failed to resolve address`, `proxy.app.daytona.io`, or `app.daytona.io`: classify as `transient_infra`.
- `Handler error: Failed to write prompt file` after large context or network/artifact failures: classify as `control_plane`, preserve artifacts, compact context, and restart cleanly.
- `Worker exited before emitting a terminal run event`: classify as `control_plane`; do not assume the fork is a clean fresh run.
- Promptfoo `0 passed / 1 failed` with fallback registry success: treat as a real prompt quality failure unless explicitly accepted.
- Appium reports with hardcoded counts or `telemetry_available=false`: treat as quality-gate risk unless backed by hosted macOS artifacts.
- Workflow-only iOS CI evidence is not enough when `allow_macos_deferred=false`; require GitHub Actions run id, commit SHA, successful conclusion, and artifact names.
- A large `.workflow/iphone-app-factory` context must be compacted before simplification/final review stages.
