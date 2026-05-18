# Prepare Hello Message

You are preparing a simple hello message for Slack as part of a toy workflow demonstration.

## Context

- **Thread**: `${thread_ts}`
- **Channel**: `${channel_id:-general}`

## Task

Create a friendly, concise hello message that demonstrates basic workflow patterns. The message should:

1. Be 1-2 sentences
2. Acknowledge this is a test/demonstration
3. Include the thread context if relevant

## Output

Return JSON with this structure:

```json
{
  "text": "your message here",
  "thread_ts": "${thread_ts}"
}
```

## Example

```json
{
  "text": "Hello! This is a test message from the Maestro toy-hello workflow.",
  "thread_ts": "1234567890.123456"
}
```
