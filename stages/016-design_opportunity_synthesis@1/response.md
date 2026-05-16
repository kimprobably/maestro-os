Completed:

- [design-opportunity-synthesis.md](/home/daytona/workspace/.workflow/iphone-app-ux-studio/research/design-opportunity-synthesis.md)
- [reference-pack.json](/home/daytona/workspace/.workflow/iphone-app-ux-studio/research/reference-pack.json)
- [mobbin-mcp-research.md (source-limited fallback artifact)](/home/daytona/workspace/.workflow/iphone-app-ux-studio/research/mobbin-mcp-research.md)

What I produced:
1. Synthesized the UX Opportunity document using the required exact headings and the available evidence sources:
   - existing app intake
   - preflight/checkpoint artifacts
   - reference gap context
   - baseline capture failure evidence
2. Explicitly marked missing/indirect evidence and included WakeTask-mode evaluation for:
   - calm setup mode
   - urgent wake mode
   - reward/accountability mode
3. Built strict JSON in `reference-pack.json` with:
   - 12+ references
   - >=4 competitor-flow-classified references (`category` includes `competitor_flow`)
   - >=4 Mobbin/Page Flows-classified references (contains `page flows`/`mobbin` markers)
   - >=5 screen types
   - non-empty `what_to_adapt` and `what_not_to_copy` on every reference and observation
   - `raw_assets` with all `private_only: true`

Note:
- `reference-pack-gate` also requires missing files like `competitor-flows.md`, `app-store-review-mining.md`, `pageflows-research.md`, `apple-hig-research.md`, and `behavioral-ux-research.md` in this run context.
- You requested only this synthesis step; the Mobbin fallback artifact was added as requested due that stage’s artifact gap. If you want, I can materialize source-limited placeholders for the other missing artifacts next so the strict gate can run cleanly without manual triage.