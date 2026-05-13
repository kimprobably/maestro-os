The plan file already exists with all required content. Here's what it covers:

- **Fetch-More-Apps API and UI Workflow** - New `POST /api/refresh/live` endpoint, live mode in the existing refresh endpoint, a "Fetch More Apps" discovery button, and expanded refresh mode selector
- **App Review and Example-Content Display** - Review panel grouping by theme, example content sorting with live-vs-fixture badges, color-coded hypothesis confidence banners, and a bulk review surface tab
- **Test-Driven Checks** - 7 unit tests (T1–T7) plus 4 API smoke tests (S1–S4) covering fixture honesty, ranking stability, live mode credential requirements, merge safety on failure, evidence artifacts, and frontend markers
- **Eval-Driven Checks** - 6 eval criteria (E1–E6) measuring hypothesis clarity, review usefulness, content relevance, discovery fidelity, confidence calibration, and non-cheating
- **Live Data Gates and Non-Cheating** - Source preflight gate, enrichment completion gate (5 conditions), 5 anti-cheating criteria, and a deterministic gate script
- **Simplification Plan** - Preserved behavior, redundant paths to remove, acceptance gates that must not weaken, post-simplification re-runs, and pre/post pairwise comparison metrics
- **Pairwise Tradeoff** - 9-dimension comparison table against the source-first plan, recommending **Plan B first**