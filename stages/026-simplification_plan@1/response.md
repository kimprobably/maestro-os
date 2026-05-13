The simplification plan has been written to `.workflow/enhancement-discovery/simplification-plan.md` (151 lines). Here's a summary of the five simplification actions:

| # | Action | Nodes removed | Impact |
|---|--------|--------------|--------|
| 1 | Remove `plan_eval` (self-referential contract eval on internal plans) | `plan_eval` | −1 node, −1 retry loop |
| 2 | Remove `live_source_preflight`, fold APIFY_TOKEN check into `live_data_gate` | `live_source_preflight` | −1 node, unified token+data gate |
| 3 | Collapse plan fanout (`plan_live_sources` + `plan_product_surface` → single `plan_implementation`) | `implementation_plan_fanout`, `plan_live_sources`, `plan_product_surface`, `plan_join` | −4 nodes, −1 prompt |
| 4 | Remove `prepare_review_reports` (redundant mkdir, races with review nodes) | `prepare_review_reports` | −1 node |
| 5 | Simplify `review_deepseek` fallback chain (2-model → single model) | — | −0 nodes, cleaner config |

**Result**: 22 nodes → ~16 nodes, 35 edges → ~25 edges, zero goal gates weakened, all acceptance thresholds preserved. The plan also identifies the missing `assert-live-enrichment.mjs` script as a pre-simplification fix.