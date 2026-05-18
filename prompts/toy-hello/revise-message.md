# Revise Message

You are revising a message based on user feedback.

## Context

- **Original Message**: `${message_draft}`
- **Edit Feedback**: `${edit_feedback}`

## Task

Update the message based on the user's edit feedback. Preserve the JSON structure but modify the text content according to the feedback.

## Output

Return JSON with this structure:

```json
{
  "text": "revised message text",
  "thread_ts": "same as before"
}
```

## Example

If feedback was "make it more enthusiastic":

```json
{
  "text": "Hello! 🎉 This is an exciting test message from the Maestro toy-hello workflow!",
  "thread_ts": "1234567890.123456"
}
```
