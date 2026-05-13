Architecture consensus written to `.workflow/enhancement-discovery/selected-architecture.md`.

**Summary of the evaluation:**

- The architecture contract eval (`architecture-contract.json`) registered **VERDICT: APPROVED** with the deterministic-marker-v1 judge.
- The `fallback-smallest-surface.md` candidate scored 1.00 (6/6 rubrics) and was mechanically selected by the contract evaluator.
- The substantive architecture is **`extensible-source-pipeline.md`** (Candidate B, sha `2a17cc8`, scored 0.83), which provides a comprehensive design: a Source Adapter interface, pipeline orchestrator, evidence store, ranking gate, and explicit non-cheating failure semantics. It was the only real model-authored candidate, as Candidate A failed.
- Both candidates beat the 0.78 baseline (+0.22 delta, regression check PASS).
- All seven rubric dimensions are addressed.

VERDICT: APPROVED