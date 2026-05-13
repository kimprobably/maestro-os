# Handle Validation Failure

You are handling a validation failure in the workflow.

## Context

- **Error Context**: `${error_context}`
- **Stage Name**: `${stage_name}`

## Task

Create a clear, actionable failure message for Slack. The message should:

1. Identify what failed
2. Explain why (based on the error context)
3. Be user-friendly (not a raw error dump)
4. Be concise (1-3 sentences)

## Output

Return JSON with this structure:

```json
{
  "text": "failure message for slack"
}
```

## Example

```json
{
  "text": "⚠️ Workflow failed at message validation: required field 'text' was missing. Please check the message preparation stage."
}
```
