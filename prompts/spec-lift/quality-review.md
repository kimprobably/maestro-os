Review `{{ inputs.spec_path|default("specs/scaffold/completed-spec.md") }}` for testability and quality gates.

Write `.maestro/spec-lift/quality-review.md` with:
- APPROVED or REJECTED
- Missing deterministic checks
- Missing Qlty/native language gates
- Missing browser, visual, or artifact evidence for UI work
- Missing fidelity review against acceptance criteria
- Missing postmortem or repair-loop inputs
- Missing Spec Kitty state updates

Reject if "done" cannot be proven from commands and evidence.
