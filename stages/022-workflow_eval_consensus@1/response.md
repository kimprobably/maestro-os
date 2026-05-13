The **selected-workflow-design.md** has been written. Here's the summary:

## Workflow Design Consensus: APPROVED

The workflow design stage completed using the established eval-driven pattern:
- **Fanout**: 2 model branches both failed → fallback activated
- **Ensure**: 2 fallback candidates generated with `fallback_provenance: true`
- **Contract eval**: `fallback-direct-enhancement.md` scored **6/6 (1.0)**, +0.22 above the 0.78 baseline with 0 regression

The final document captures:
1. **Full stage topology** — all 24 stages from `bootstrap` through `publish_handoff` with artifact handoff chain
2. **Retry/fanout/gates** — 7 retry paths with max attempts and fallback policies, deterministic contract gates at each eval boundary
3. **Promptfoo eval gate** — positioned at `final_eval_consensus → promptfoo_workflow_quality → publish_handoff` using `anthropic/claude-haiku-4-5` with `contains-all` + `llm-rubric` assertions (threshold 0.75)
4. **Child workflow execution plan** — materialize → validate → execute (`fabro validate` when `execute_generated_workflow=false`) producing `workflows/consumer-radar/live-enrichment.fabro` with 6 required gates
5. **Simplification** — 6 rules inherited from architecture consensus, target 7→≤5 files, rollback-on-regression guard

**Remaining stages** (8 pending) will materialize the child workflow and run the full integration pipeline including Promptfoo quality gate and final handoff.

**VERDICT: APPROVED**