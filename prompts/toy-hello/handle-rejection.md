# Handle Rejection

You are handling a user rejection of the workflow.

## Context

- **Original Message**: `${message_draft}`
- **Rejection Reason**: `${rejection_reason}`

## Task

Create a summary message explaining that the workflow was rejected. The message should:

1. Acknowledge the rejection
2. Include the reason if provided
3. Be brief and professional

## Output

Return JSON with this structure:

```json
{
  "text": "rejection summary for slack"
}
```

## Example

```json
{
  "text": "Workflow rejected by user. Reason: Message tone not appropriate. No message was posted."
}
```
