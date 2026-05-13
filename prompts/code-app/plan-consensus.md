Synthesize `.workflow/plan_a.md` and `.workflow/plan_b.md` into `.workflow/plan_final.md`.

If `.workflow/postmortem_latest.md` exists, read it first and adjust the plan to fix those failure modes without restarting working code.

The final plan must include:
- Work queue ordered by dependency
- Explicit write set per worker
- Spec Kitty updates that must happen during the build
- ADR work, if needed
- Qlty plus native gates
- Browser and artifact evidence
- Fidelity review mapped to acceptance criteria
- Reviewer fanout
- Conditions that route to postmortem instead of release

Respond with JSON:

```json
{
  "plan_path": ".workflow/plan_final.md",
  "workers": [],
  "quality_gates": [],
  "reviewers": []
}
```
