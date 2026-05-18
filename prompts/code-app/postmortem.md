Analyze the failed build/review loop.

Read any available:
- `.workflow/review_consensus.md`
- `.workflow/verify_fidelity.md`
- `.workflow/verify_errors.log`
- `.workflow/implementation_log.md`
- `.workflow/test-evidence/latest/manifest.json`
- Review files

Write `.workflow/postmortem_latest.md` with:
- Root causes
- What works and must be preserved
- Concrete fixes by file path
- Acceptance criteria still failing
- Verification commands to rerun
- Whether the next loop should replan or only repair implementation

Do not recommend a full rewrite unless the existing output is structurally unusable and you explain why.
