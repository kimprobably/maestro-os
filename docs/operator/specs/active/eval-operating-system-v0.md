# Eval Operating System v0

## Purpose

The factory treats evals like tests. Every AI behavior has executable evidence, every workflow run records eval outcomes, and every eval can itself be evaluated.

This doctrine applies to AI calls, Fabro stages, child workflows, product workflows, evaluators, gates, waivers, reports, and artifacts. If a behavior can change user-facing output, operational state, or downstream automation, it needs eval coverage or an accepted-risk waiver.

## Source Of Truth

The source of truth is the repo-pinned eval registry plus normalized Fabro/Railway artifacts. Promptfoo is a runner and viewer, not the central record.

Operational rules:

1. The eval registry defines eval identity, owner, scope, lifecycle state, blocking status, waiver links, artifact schema, and expected gate behavior.
2. Fabro and Railway artifacts record what actually ran: inputs, outputs, runner status, fallback status, gate status, waiver status, timestamps, versions, and artifact paths.
3. Promptfoo results may be imported into artifacts, but passing or failing in Promptfoo is not authoritative until normalized into the registry/artifact record.
4. Reports must link back to repo-pinned registry entries and immutable run artifacts.

## Eval Pyramid

1. Call evals cover individual model/prompt invocations.
2. Stage evals cover small Fabro stages and child workflows.
3. Workflow/product evals cover complete user-facing functions.
4. Meta-evals cover evaluator quality, coverage, regressions, stale data, fallback masking, and waiver discipline.

Operational rules:

1. New AI behavior starts at the lowest useful layer and rolls up to higher layers before release.
2. A workflow/product eval does not replace missing call or stage evals when the lower layer can fail silently.
3. Meta-evals must sample both passing and failing eval history, not only current green runs.
4. Coverage reports must show gaps by pyramid layer.

## Blocking Rule

No new AI call, Fabro stage, child workflow, or product workflow may be marked complete unless the eval registry has a blocking eval or an explicit accepted-risk waiver.

Operational rules:

1. Blocking evals must run in the completion path or be linked to a fresh run artifact from the same implementation slice.
2. Accepted-risk waivers must name the uncovered behavior, risk, owner, expiry/review date, and compensating control.
3. Draft or calibrating evals may inform work, but they do not satisfy the completion gate.
4. A blocked gate remains blocked until the failing eval is fixed, quarantined with justification, or covered by an accepted-risk waiver.

## Fallback Rule

Fallback success never erases runner failure. Reports must separately record runner status, fallback status, gate status, and waiver status.

Operational rules:

1. Runner status records whether the intended eval runner executed and what it returned.
2. Fallback status records whether alternate evaluation, manual review, cached evidence, or degraded checks were used.
3. Gate status records the final release decision after runner, fallback, and waiver handling.
4. Waiver status records whether the final decision depended on accepted risk.
5. Dashboards and summaries must count fallback usage separately from clean passes.
6. A failed, skipped, or unavailable primary blocking runner cannot become a clean pass through fallback alone. The gate must be marked `fallback_only`, `waived`, or `accepted-risk` unless a registered equivalent blocking eval ran successfully.

## Eval Lifecycle

States are draft, calibrating, blocking, ratcheted, quarantined, deprecated. Registry entries also carry a separate `blocking: true|false` gate property. Completion gates are controlled by `blocking: true`; `state: blocking` means the eval is mature enough to be used as a blocker.

Operational rules:

1. Draft evals are being designed and must not gate completion.
2. Calibrating evals run regularly against known examples but are not yet trusted as blockers.
3. Blocking evals gate completion and release decisions only when the registry entry also has `blocking: true`.
4. Ratcheted evals have a minimum historical score or failure budget that may only tighten unless an accepted-risk waiver says otherwise.
5. Quarantined evals are temporarily excluded from blocking due to evaluator defect, stale data, flaky infrastructure, or invalid fixture assumptions; quarantine must include owner and review date.
6. Deprecated evals no longer apply and must identify the replacement eval or the reason coverage is no longer required.

## Counterexample Rule

Every blocking eval must have at least one known-bad case or meta-eval proving it fails bad output.

Operational rules:

1. Known-bad cases must be stored or referenced as durable fixtures, not remembered informally.
2. A blocking eval without a counterexample is only calibrating until the gap is closed or waived.
3. Counterexamples should include realistic bad outputs: hallucinated evidence, unsafe action, ungrounded claim, format drift, stale data, fallback masking, or over-permissive evaluator scoring.
4. Meta-evals may satisfy the rule when direct known-bad fixtures are impractical, but the meta-eval must demonstrate evaluator sensitivity to bad output.

## Quincy Rule

Quincy must report call coverage, stage coverage, workflow coverage, meta-eval coverage, failed evals, fallback usage, waivers, and artifact paths before marking Fabro workflow work complete.

Operational rules:

1. Quincy completion reports must include coverage percentages or explicit covered/missing counts for each eval pyramid layer.
2. Failed evals must include registry id, failing run artifact, current gate impact, and next owner.
3. Fallback usage must identify the failed or skipped primary runner and the fallback evidence used.
4. Waivers must include waiver id, owner, expiry/review date, and linked risk statement.
5. Artifact paths must be specific enough for a human or agent to inspect the evidence without rerunning the workflow.
