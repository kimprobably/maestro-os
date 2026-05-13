Synthesize:
- `.maestro/spec-lift/product-review.md`
- `.maestro/spec-lift/engineering-review.md`
- `.maestro/spec-lift/quality-review.md`
- `{{ inputs.spec_path|default("specs/scaffold/completed-spec.md") }}`

Write `.maestro/spec-lift/review-consensus.md`.

Rules:
- If any review is REJECTED, the consensus is REJECTED.
- List required fixes as concrete edits to the spec.
- If all reviews are APPROVED and `maestro verify spec-quality` should pass, consensus is APPROVED.
- The first line of `.maestro/spec-lift/review-consensus.md` must be exactly `VERDICT: APPROVED` or `VERDICT: REJECTED`.

Respond only with JSON:

```json
{
  "verdict": "APPROVED",
  "required_spec_edits": [],
  "ready_for_application_build": true
}
```
