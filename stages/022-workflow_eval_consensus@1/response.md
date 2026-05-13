`.workflow/enhancement-discovery/selected-workflow-design.md` has been written (209 lines). It covers:

- **Fanout & retry**: 2-way (architecture/workflow) and 3-way (spec) fanout with `wait_all` join policy, retry targets with self-loops, max 2 retries, fallback generator for branch failures.
- **Promptfoo quality gate**: `promptfoo-workflow-quality.mjs` attempts Promptfoo eval, falls back to deterministic checks (contract evals present, dataset lineage, baseline delta, validation passed).
- **Compat child validation**: `validate-enhancement-discovery.mjs` checks 17 parent markers + 8 child markers; `fabro-validate-compat.mjs` validates DOT syntax.
- **Child workflow execution plan**: 8-phase plan (preflight → plan → implement → verify → simplify → quality → review → handoff), with explicit stage types, retry targets, and non-cheating failure semantics.
- **Simplification**: ≤10 new files, ≤200 line orchestrator, ≤30 line interface, ≤100 line evidence store, gate-preservation rule enforced by `review_deepseek`.

VERDICT: APPROVED