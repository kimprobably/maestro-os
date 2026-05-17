# Joni Feed Watchlist Design

## Goal

Build a simple private feed-watching system for Joni that simulates scrolling a founder/operator LinkedIn feed every day, captures public post performance through HarvestAPI, and turns only the strongest signals into daily content ideas.

## Architecture

Use SQLite as the private source registry and engagement store. The repo holds scripts, workflow definitions, docs, tests, and summarized reports; raw CSVs, raw audience lists, and SQLite databases stay out of git.

The daily workflow is deterministic until the final review step:

1. Select a cohort from the SQLite watchlist.
2. Capture recent profile posts with HarvestAPI.
3. Normalize and dedupe posts.
4. Store engagement snapshots.
5. Score candidate posts.
6. Ask Joni to interpret only the scored candidates.
7. Append compact ledger notes.

## Source Selection

The daily cohort combines:

- top follower tier from the imported source list;
- known active sources from imported or observed activity;
- a deterministic rotating sample so smaller accounts can surface.

The v0 default is 300 sources per day: 165 top, 90 active, 45 rotation.

## Scoring

The deterministic score combines weighted engagement, comment weight, velocity by post age, audience-adjusted engagement rate, and outperformance versus the imported baseline post metrics.

AI does not decide what performed. AI only interprets the scored evidence and drafts candidate Maestro posts.

## Boundaries

Joni may monitor, score, draft, and summarize. Joni may not publish, comment, send DMs, send connection requests, scrape private/authenticated surfaces outside approved tools, or expose the source list.
