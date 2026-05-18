# Joni LinkedIn Ledger

Owner: Joni
Status: bootstrap

Purpose: durable operating ledger for Maestro LinkedIn content capture, draft accountability, and performance monitoring.

## Source Inputs

Approved sources only:

- Tim/Maestro-owned LinkedIn posts and analytics exports.
- Explicit LinkedIn post URLs supplied by Tim or Miles.
- Screenshots or manual exports supplied by Tim, Miles, or an approved workflow.
- Connected MCP/API/tool outputs that have been explicitly approved for LinkedIn use.
- HarvestAPI outputs from `workflows/hermes/joni-linkedin-daily.fabro`.
- Private SQLite feed watchlist described in `docs/operator/linkedin/JONI-FEED-WATCHLIST.md`.

Open source gaps:

- LinkedIn source list is now generated daily from the private SQLite feed watchlist.
- LinkedIn analytics export/API path not yet defined.
- HarvestAPI key not yet configured as `HARVEST_API_KEY`.

## Weekly Draft Queue

Target: 5 draft-ready posts per week.

Current week:

- Monday:
- Tuesday:
- Wednesday:
- Thursday:
- Friday:

## Performance Notes

Record after each reviewed post:

- Post URL/date:
- Theme:
- Format:
- Hook:
- CTA:
- Reach/impressions:
- Engagement:
- Comments/questions:
- Interpretation:
- Repeat/retire/test:

## Operating Rules

- Drafting is allowed.
- Performance monitoring is allowed from approved inputs.
- Publishing, commenting, DMs, connection requests, and account mutations require explicit approval.
- Do not store secrets, cookies, raw private exports, or full audience lists here.
- Daily ingestion is deterministic; AI review only runs after normalized capture artifacts and scored feed candidates exist.
