# Design Corpus

The design corpus is a private UX Studio research store. It records competitor
and Mobbin source metadata, private asset metadata, derived observations, and
reference packs used during app generation.

## Privacy Policy

- Competitor and Mobbin screenshots are private research artifacts.
- Mobbin references should prefer MCP IDs, URLs, titles, tags, and derived notes.
- Raw Mobbin screenshots are not stored unless the plan and source policy
  explicitly allow raw asset retention.
- App repo artifacts include our own generated screenshots, not competitor
  screenshot libraries.
- Object storage is private by default. `storage_key` values should point to
  private buckets, private object prefixes, or local private storage.
- Every observation must include `what_to_adapt` and `what_not_to_copy` so the
  corpus captures reusable patterns without cloning protected product work.

## SQLite Storage

Default database path:

```text
hermes/design-corpus/design-corpus.sqlite
```

Initialize it with:

```bash
node scripts/iphone-app-factory/design-corpus.mjs init --db hermes/design-corpus/design-corpus.sqlite
```

`DESIGN_CORPUS_DATABASE_URL` is reserved for future Postgres/Neon support. If
it is set today, the CLI fails clearly instead of silently ignoring it.
