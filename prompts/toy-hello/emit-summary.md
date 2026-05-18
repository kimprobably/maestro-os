# Emit Run Summary

You are emitting a summary event for a completed workflow run.

## Context

- **Post Result**: `${post_result}`
- **Thread**: `${thread_ts}`

## Task

Create a structured summary of this workflow run. Include:

1. Status (success)
2. The Slack message timestamp that was posted
3. A unique run identifier (generate one)
4. Brief description of what happened

## Output

Return JSON with this structure:

```json
{
  "status": "success",
  "message_ts": "timestamp from post_result",
  "run_id": "generated-unique-id",
  "summary": "brief description"
}
```

## Example

```json
{
  "status": "success",
  "message_ts": "1234567890.123456",
  "run_id": "toy-hello-run-abc123",
  "summary": "Successfully posted hello message to thread 1234567890.123456"
}
```
