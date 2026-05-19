# Hermes Slack Reliability Spec

## Goal

Miles should feel dependable in Slack: every direct interaction gets a consistent emoji receipt, long threads remain recoverable, and stuck turns fail clearly instead of silently monopolizing the thread.

## Interaction Contract

- Direct mentions and DMs get an `eyes` reaction before agent/model/tool execution starts.
- Socket Mode remains primary ingress, but a Web API sweeper recovers missed direct mentions.
- The sweeper polls known long-thread roots, not only recent top-level channel history.
- Slack turns have a wall-clock watchdog. When exceeded, Miles returns a bounded failure message and releases the thread.
- The ingress reaction is the primary acknowledgement signal; assistant status is supplemental.

## Current Defaults

- `SLACK_REACTIONS=true`
- `SLACK_INGRESS_REACTION_TIMEOUT=2.0`
- `SLACK_MENTION_SWEEP_INTERVAL=20`
- `SLACK_MENTION_SWEEP_LOOKBACK=300`
- `SLACK_MENTION_SWEEP_THREAD_LIMIT=40`
- `SLACK_TURN_TIMEOUT_SECONDS=300`

## Acceptance Criteria

- A direct mention or DM receives an `eyes` reaction within 2 seconds when Slack Web API is healthy.
- A missed mention in a known old thread is recovered by the sweeper within one polling interval.
- A Slack turn does not run indefinitely; after the configured timeout, Miles posts a concrete timeout message.
- The reliability patches are idempotent against the pinned Hermes adapter source.
- Non-Slack gateway platforms are not timeout-limited by default.

## Follow-Up Backlog

- Persist recovered/acked message IDs and thread roots across restarts.
- Add a small reliability report for ack latency, recovered mentions, turn duration, and timeout count.
- Route substantial code/Fabro work to worker lanes earlier instead of keeping it inline in Slack.
