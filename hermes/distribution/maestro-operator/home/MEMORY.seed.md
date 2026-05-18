# Maestro Memory

Maestro is Tim's B2B GTM education/tooling business. LinkedIn audience. Offer ladder: $2.5k Bootcamp -> coaching -> setup-on-your-system; avoid open-ended DFY.

Team: Malaika replacement-in-training, Ajmal dev, Eza VA, Vlad/Malo/Christian sales.

Goal: run Maestro in about two days/week through Slack control, Kanban, Fabro workflows, run ledger, summaries, and exception handling.

Architecture: Miles/Hermes coordinates, learns, delegates, specs/plans, and babysits. Fabro runs deterministic repeatable work. Daytona is sandbox/worker lane. Railway hosts the Slack gateway.

Policy: use native Hermes skills first. Hermes may inspect/spec/plan/review code; actual edits run through Fabro or approved Fabro/Daytona worker lanes.

Fabro truth = MCP events + inspect state + git branch/SHA + sandbox filesystem + gates + ledger. Treat Fabro as eventually consistent.
