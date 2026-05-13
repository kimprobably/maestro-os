Review the implementation in `{{ inputs.app_dir|default("apps/generated-app") }}` against `.workflow/definition_of_done.md`.

Write `.workflow/verify_fidelity.md` with:
- First line exactly `VERDICT: APPROVED` if every acceptance criterion passed, otherwise `VERDICT: REJECTED`
- Every acceptance criterion ID
- Pass/fail
- Evidence file paths or code paths
- Missing artifact details
- Required fix for each failure

If any criterion fails, append a concise section to `.workflow/verify_errors.log` headed:

`=== VERIFY FAILURE: verify_fidelity ===`

Respond with exactly one JSON object:

```json
{"context_updates":{"all_acs_pass":"true"}}
```

or:

```json
{"context_updates":{"all_acs_pass":"false"}}
```
