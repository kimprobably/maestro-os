# Planning Context Registry

This folder is the quick central home for working plans, specs, and briefs that Miles should be able to retrieve.

These files are not committed decisions or ADRs. They are planning context: useful for remembering what we are thinking about, what is active, and what has been parked.

## Layout

- `plans/active`: current implementation or operating plans.
- `plans/parked`: useful plans intentionally deferred.
- `plans/archive`: completed or obsolete plans kept for reference.
- `specs/active`: current product, workflow, or integration specs.
- `specs/parked`: specs that should stay visible but are not being implemented now.
- `specs/archive`: completed or obsolete specs kept for reference.
- `briefs`: short context briefs that do not need lifecycle buckets.

Each Markdown file can include YAML frontmatter with:

```yaml
---
id: plan:example
status: active
domain: hermes
authority: planning-context
summary: One sentence summary.
links:
  slack_threads:
    - C123:171000.1
---
```
