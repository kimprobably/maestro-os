Architecture candidate B written to `.workflow/enhancement-discovery/architecture-candidates/extensible-source-pipeline.md`.

**What was produced:**
- **12 files/modules** defined (4 new adapters, registry, 4 pipeline modules, 4 test files)
- **Adapter interface contract** with `fetch()` + `enrich()` + readiness semantics
- **4 new API endpoints** (`/api/sources/status`, `/api/discover`, `/api/apps/:id/enrich`, `/api/evidence/:app-id`) with explicit failure semantics
- **Evidence artifacts** — NDJSON discovery log + JSON provenance manifest in `.data/evidence/`
- **6 test-driven gates** (contract compliance, live-mode fail-fast, fallback disclosure, evidence creation, ranking gate, registry readiness)
- **6 eval-driven gates** mapped to the spec rubric (acceptance ≥ 0.85, non-cheating 1.0, test-driven 1.0, eval-driven ≥ 0.80, data source 1.0, simplification ≥ 0.75)
- **Pairwise tradeoff table** vs. smallest-surface architecture (file count delta, reuse across workflows, test isolation, non-cheating guarantee, extensibility, demo speed)
- **5 simplification pass criteria** with line-count and file-count guards

Stage complete.