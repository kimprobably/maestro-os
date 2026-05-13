# Architecture Candidate A: Smallest Surface

Design the smallest architecture that satisfies the selected enhancement spec without hiding missing behavior.

Read:

- Spec candidates in `.workflow/enhancement-discovery/spec-candidates/`
- Spec eval report in `.workflow/enhancement-discovery/evals/spec-contract.json`
- Capability audit in `.workflow/enhancement-discovery/capability-audit.json`

Write `.workflow/enhancement-discovery/architecture-candidates/smallest-surface.md`.

Required rubric coverage:

- Files and modules to change
- Interfaces and data flow
- Test-driven development gates
- Eval-driven development gates
- Non-cheating source/data checks
- Failure modes and retry paths
- Pairwise comparison against a more extensible architecture
- Simplification pass criteria

Prefer minimal surface area, but do not remove acceptance coverage.
