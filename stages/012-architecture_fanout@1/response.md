Verified. The architecture candidate has been written to `.workflow/enhancement-discovery/architecture-candidates/extensible-source-pipeline.md`.

It covers all required rubric items:

| Rubric Requirement | Section | Evidence |
|---|---|---|
| Files and modules | §2 | 15 files (7 new, 3 modified, 4 existing kept) with boundary diagram |
| Source adapter boundaries | §3 | `AdapterResult` schema, contract interface, registry pattern, 4 adapters |
| API and persistence boundaries | §4 | 5 endpoints with contracts, `.data/evidence/` store layout, `preflightCheck()` gate |
| Observability and evidence artifacts | §3, §4 | Provenance tagging, evidence files per app+timestamp, source-status in summary |
| Test-driven development gates | §5 | 10 deterministic tests mapped to all 5 non-cheating requirements |
| Eval-driven development gates | §6 | 6-criterion rubric (0.20–0.15 weights), baseline 0.78, max regression 0.05 |
| Pairwise tradeoffs vs smallest-surface | §7 | 7-dimension comparison table, conditions where each wins |
| Simplification pass criteria | §8 | 6 rules, rollback on test failure, target ≤5 new files (from 7) |