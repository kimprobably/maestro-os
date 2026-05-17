# Joni Feed Watchlist

Purpose: private operating store for simulating a daily LinkedIn feed scan from approved founder/operator sources.

## Storage

The v0 store is SQLite:

`/data/.hermes/profiles/joni/state/linkedin-feed/joni-linkedin-feed.sqlite`

Do not commit raw connection CSVs, raw audience lists, emails, private exports, or the SQLite database.

## Import

Import an approved LinkedIn connection/source CSV into the private registry:

```bash
node scripts/hermes/joni-feed-watchlist.mjs import-csv \
  --db /data/.hermes/profiles/joni/state/linkedin-feed/joni-linkedin-feed.sqlite \
  --csv /path/to/approved-connections.csv
```

The importer stores only source metadata needed for feed monitoring: LinkedIn URL, name, title, company, type/classification, follower and connection counts, and previous visible post metrics if present.

## Daily Loop

`workflows/hermes/joni-linkedin-daily.fabro` runs this sequence:

1. Ensure the SQLite registry exists.
2. Select a daily source cohort from the registry:
   - top follower tier
   - known active sources
   - rotating sample from the rest
3. Capture recent profile posts through HarvestAPI.
4. Store post and engagement snapshots in SQLite.
5. Score candidate posts deterministically.
6. Ask Joni to interpret only the scored candidates.
7. Append compact ledger notes.

## Scoring

The deterministic score currently combines:

- weighted engagement: likes + comments x4 + shares x3
- velocity based on post age
- engagement rate relative to audience size
- outperformance versus the source's imported baseline post
- comment weight, because comments usually indicate stronger market signal

The score is a triage tool. It does not publish, comment, DM, or mutate LinkedIn accounts.

## Daily Output

Daily artifacts are written under `.workflow/joni-linkedin/daily/`:

- `selected-sources.json`
- `posts.jsonl`
- `summary.md`
- `feed-candidates.md`
- `feed-candidates.json`
- `ai-review.md`
