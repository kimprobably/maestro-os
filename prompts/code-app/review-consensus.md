Synthesize:
- `.workflow/correctness-review.md`
- `.workflow/test-review.md`
- `.workflow/security-review.md`
- `.workflow/verify_fidelity.md`

Write `.workflow/review_consensus.md`.

Rules:
- Any REJECTED review means the consensus is rejected.
- APPROVED_WITH_NOTES is acceptable only when the notes are non-blocking.
- Every blocking finding must become either a code fix, a spec/ADR update, or a documented non-action with rationale.
- The first line of `.workflow/review_consensus.md` must be exactly `VERDICT: APPROVED` or `VERDICT: REJECTED`.

If approved, respond:

```json
{"preferred_next_label":"approved"}
```

If rejected, respond:

```json
{"preferred_next_label":"rejected"}
```
