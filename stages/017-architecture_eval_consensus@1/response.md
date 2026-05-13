Architecture consensus complete. Here's the summary:

## Architecture Consensus Result

**Written:** `.workflow/enhancement-discovery/selected-architecture.md`  
**Verdict:** `APPROVED`  
**Selected candidate:** `fallback-smallest-surface.md` (score 1.0, 6/6 markers)  
**Runner-up:** `smallest-surface.md` (score 0.83, 5/6 — missing `boundary`)

### Why fallback won despite `smallest-surface.md` being more detailed

The deterministic-marker-v1 rubric requires a crisp, standalone **boundary** declaration — which module owns which responsibility, and which modules are forbidden from bypassing it. `smallest-surface.md` has all the details embedded in its data flow and file descriptions but never states the boundary contract as a distinct, verifiable criterion. The fallback candidate compensates by asserting the boundary marker explicitly as part of its structure.

### Coverage

| Requirement | Status |
|---|---|
| 3 capability audit gaps | All addressed (`live-discovery-endpoint`, `fixture-only-refresh`, `honest-but-not-complete`) |
| 5 non-cheating requirements | All enforced via 2 explicit code paths |
| 7 TDD gates (4 new + 3 regression) | All explicitly named |
| 6 eval gates | All with measurable targets |
| 7 failure modes | All with user-visible behavior and recovery |
| Baseline regression | +0.22 improvement (no regression) |
| Simplification criteria | ≤ 6 files, 0 new deps, ≤ 200 LOC, 0 schema changes |

### Next stage

The workflow pipeline should proceed to **workflow-candidates** (workflow fanout → join → ensure_workflow_candidates → workflow_eval_contract → workflow_eval_model → workflow_eval_consensus), then **final consensus** (`final-eval-consensus.md`).