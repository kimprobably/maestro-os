# AI Edge Function

Supabase Edge Function that proxies authenticated requests to OpenRouter for LLM access.

## Features

- ✅ **Authentication**: Automatically verifies Supabase JWT tokens
- ✅ **Streaming**: Real-time SSE streaming from OpenRouter
- ✅ **Multi-model**: Access 500+ models through OpenRouter
- ✅ **CORS**: Handles cross-origin requests
- ✅ **Error handling**: Proper error responses

## Deployment

### 1. Install Supabase CLI

```bash
brew install supabase/tap/supabase
```

Or using npm:
```bash
npm install -g supabase
```

### 2. Login to Supabase

```bash
supabase login
```

### 3. Link Your Project

```bash
supabase link --project-ref your-project-ref
```

Find your project ref in: Supabase Dashboard → Project Settings → General → Reference ID

### 4. Set Secrets

```bash
# Your OpenRouter API key (get from https://openrouter.ai/keys)
supabase secrets set OPENROUTER_API_KEY=sk-or-v1-...

# Your app URL for OpenRouter attribution
supabase secrets set APP_URL=https://your-app.com
```

### 5. Deploy Function

```bash
supabase functions deploy ai
```

### 6. Get Your Function URL

After deployment, your function will be available at:
```
https://your-project-ref.supabase.co/functions/v1/ai
```

## Testing

Test with curl:

```bash
curl -X POST https://your-project-ref.supabase.co/functions/v1/ai \
  -H "Authorization: Bearer YOUR_SUPABASE_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "openai/gpt-4o-mini",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ],
    "temperature": 0.7
  }'
```

## Supported Models

You can use any model from OpenRouter. Popular options:

- `openai/gpt-4o` - Latest GPT-4
- `openai/gpt-4o-mini` - Fast and cheap
- `anthropic/claude-3.7-sonnet` - Claude 3.7
- `google/gemini-2.5-pro` - Google's latest
- `meta-llama/llama-3.3-70b` - Open source
- `deepseek/deepseek-chat` - Chinese model

See full list at: https://openrouter.ai/models

## Request Format

```typescript
{
  "model": "openai/gpt-4o-mini",     // Optional, defaults to gpt-3.5-turbo
  "messages": [                       // Required
    {
      "role": "user" | "assistant" | "system",
      "content": "string"
    }
  ],
  "temperature": 0.7                  // Optional, 0-2
}
```

## Response Format

Server-Sent Events (SSE) stream:

```
data: {"content": "Hello"}
data: {"content": " there"}
data: {"content": "!"}
data: [DONE]
```

## Monitoring

View logs in Supabase Dashboard:
1. Go to Edge Functions
2. Click "ai" function
3. View "Logs" tab

## Troubleshooting

**Error: "Unauthorized"**
- Check that you're sending a valid Supabase JWT token in Authorization header
- Token should start with "Bearer "

**Error: "OpenRouter API key not configured"**
- Set the secret: `supabase secrets set OPENROUTER_API_KEY=...`

**Function not found**
- Make sure you deployed: `supabase functions deploy ai`
- Check URL format: `https://PROJECT_REF.supabase.co/functions/v1/ai`

**Streaming not working**
- Ensure your client supports SSE (Server-Sent Events)
- Check CORS settings if calling from browser

