---
id: plan:hermes-planning-registry-v0
status: active
domain: hermes
authority: planning-context
summary: Add a small file-backed registry for plans, specs, and briefs, indexed into the operator ledger for retrieval by Miles.
---
# Hermes Planning Registry v0

Build the simple version first: Markdown files remain the source content, and the operator ledger stores searchable metadata, summaries, status, and links.

This is not the long-term company brain product. It is a lightweight operating aid so Miles can answer questions like "what are we thinking about for Hermes reliability?" or "what plans are parked?" without treating drafts as committed decisions.

Current scope:

- Keep plans/specs/briefs under `docs/operator`.
- Index frontmatter and short summaries into the operator ledger.
- Preserve a trust boundary that entries are planning context, not ADRs.
- Park the broader company-brain architecture until Miles has real usage patterns from Slack, Fabro, specs, and workflows.
