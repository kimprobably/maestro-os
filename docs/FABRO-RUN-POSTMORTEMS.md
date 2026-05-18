# Fabro Run Postmortems

Every substantial Fabro run should close with a short postmortem and concrete
improvement ideas. The point is not blame. The point is to make the next run
less surprising.

## When Required

Write a postmortem when any of these are true:

- the run took more than 30 minutes
- the run crossed multiple workflow stages
- the run generated or modified a production artifact
- the run failed, forked, restarted, or required manual recovery
- the run exposed a new gate, prompt, CI, sandbox, or operator failure mode
- the run cost enough tokens/money that repeating the mistake would matter

## Storage

Use this structure:

```text
docs/fabro-postmortems/<YYYY-MM-DD>-<run-id-or-slug>.md
docs/FABRO-RUN-IMPROVEMENT-BACKLOG.md
```

The Hermes run ledger remains the event/state source of truth. The postmortem
is the human-readable synthesis. The backlog is the queue of improvements that
should change prompts, gates, workflow graphs, scripts, deployment config, or
operator skills.

## Template

```markdown
# <Run Name> Postmortem

Date: <YYYY-MM-DD>
Fabro server: <Railway/local>
Run IDs: <primary, forks/restarts>
Workflow: <workflow file/slug>
Branch/commit: <branch, latest sha>
Final status: <succeeded/failed/manual recovery>

## Goal

What the run was supposed to accomplish.

## Outcome

What actually happened, including whether the final artifact is usable and how
that was verified.

## Timeline

- <time> <event>
- <time> <event>

## What Worked

- <specific behavior/evidence>

## What Failed Or Was Brittle

- <specific behavior/evidence>

## Fabro Versus Babysitter Work

- Fabro completed:
- Babysitter intervened:
- Manual recovery, if any:

## Verification Evidence

- Local gates:
- Hosted CI:
- Artifacts:
- Ledger entries:

## Learnings

- <lesson>

## Improvement Ideas Added

- <backlog id>: <one-line idea>

## Open Risks

- <risk>
```

## Backlog Feedback Loop

For each learning, add or update a row in
`docs/FABRO-RUN-IMPROVEMENT-BACKLOG.md`.

Each idea needs:

- source run id or postmortem link
- problem statement
- proposed change
- target surface: prompt, gate, script, workflow, CI, deployment, skill, ledger
- priority
- status
- next action

Do not leave learnings only in chat. If the learning is worth mentioning, either
write it to the postmortem or explicitly mark it as not actionable.
