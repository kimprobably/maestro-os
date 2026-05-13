The architecture candidate is already in place at `.workflow/enhancement-discovery/architecture-candidates/smallest-surface.md` in the current working directory. It has **6 sections** covering all required rubric criteria:

1. **Files and modules to change** — 2 new files, 4 modified files
2. **Interfaces and data flow** — `POST /api/discover` endpoint, `discoverApps()` internal API, and full data flow diagram
3. **Test-driven development gates** — 4 new TDD gates + 3 regression gates
4. **Eval-driven development gates** — rubric scoring, non-cheating validation, baseline delta
5. **Non-cheating source/data checks** — explicit enforcement for all 6 audit requirements
6. **Simplification pass criteria** — file count, LOC, dependency, and component limits

The eval contract passed at 0.83 (5/6 hits, missing "boundary" but above the 0.78 threshold).

**Stage complete.**