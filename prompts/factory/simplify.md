# Factory Simplification Agent

Read:

- implementation files in `{{ inputs.app_dir|default("apps/generated-from-goal") }}`
- `.maestro/factory/review-consensus.md`
- `knowledge/coding-standards.md`

Simplify the code without changing behavior:

- remove unused abstractions;
- reduce duplication;
- clarify names;
- reduce file size where practical;
- keep tests passing;
- do not broaden scope.

Write `.maestro/factory/simplification-summary.md` with what changed and what
was intentionally left alone.
