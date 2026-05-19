import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Security: BL-003 - Only allow specific models to prevent cost escalation
const ALLOWED_MODELS = ['openai/gpt-3.5-turbo', 'openai/gpt-4o-mini']

// Security: INJ-004 - Only allow user/assistant roles from clients
const ALLOWED_ROLES = ['user', 'assistant']

// Security: BL-005 - Input bounds
const MAX_MESSAGES = 50
const MAX_MESSAGE_LENGTH = 10000

// Server-controlled system prompt (clients cannot override this)
const SYSTEM_PROMPT = 'You are a helpful assistant. Be concise and accurate.'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Verify user authentication
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser()

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Parse request body
    const { messages, model = 'openai/gpt-3.5-turbo', temperature = 0.7 } = await req.json()

    // Security: BL-003 - Validate model against allowlist
    if (!ALLOWED_MODELS.includes(model)) {
      return new Response(
        JSON.stringify({ error: 'Invalid model' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Validate messages array exists
    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Security: BL-005 - Validate messages count
    if (messages.length === 0 || messages.length > MAX_MESSAGES) {
      return new Response(
        JSON.stringify({ error: `Messages must contain between 1 and ${MAX_MESSAGES} items` }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Security: BL-005 + INJ-004 - Validate individual messages
    for (const msg of messages) {
      if (!msg.role || !msg.content) {
        return new Response(
          JSON.stringify({ error: 'Each message must have role and content' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
      if (!ALLOWED_ROLES.includes(msg.role)) {
        return new Response(
          JSON.stringify({ error: 'Invalid message role' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
      if (typeof msg.content !== 'string' || msg.content.length > MAX_MESSAGE_LENGTH) {
        return new Response(
          JSON.stringify({ error: `Message content must be ${MAX_MESSAGE_LENGTH} characters or less` }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
    }

    // Security: BL-009 - Validate temperature range
    if (typeof temperature !== 'number' || temperature < 0.0 || temperature > 2.0) {
      return new Response(
        JSON.stringify({ error: 'Temperature must be between 0.0 and 2.0' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Get OpenRouter API key from environment
    const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY')
    if (!openRouterApiKey) {
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Security: INJ-004 - Prepend server-controlled system prompt
    const sanitizedMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages
    ]

    // Call OpenRouter API with streaming
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': Deno.env.get('APP_URL') ?? 'https://your-app.com',
        'X-Title': 'Supabase Chat App',
      },
      body: JSON.stringify({
        model,
        messages: sanitizedMessages,
        temperature,
        stream: true,
      }),
    })

    // Security: INJ-006 - Sanitize OpenRouter error responses
    if (!response.ok) {
      const errorBody = await response.text()
      console.error('OpenRouter API error:', response.status, errorBody)

      const statusMap: Record<number, string> = {
        429: 'Rate limit exceeded. Please try again later.',
        503: 'AI service temporarily unavailable',
      }
      const clientMessage = statusMap[response.status] || 'AI request failed'
      const clientStatus = response.status >= 500 ? 502 : response.status

      return new Response(
        JSON.stringify({ error: clientMessage }),
        {
          status: clientStatus,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Create a TransformStream to handle SSE formatting
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader()
        if (!reader) {
          controller.close()
          return
        }

        try {
          while (true) {
            const { done, value } = await reader.read()

            if (done) {
              controller.close()
              break
            }

            // Decode the chunk and forward it
            const chunk = decoder.decode(value)
            controller.enqueue(encoder.encode(chunk))
          }
        } catch (error) {
          console.error('Stream error:', error)
          controller.error(error)
        }
      },
    })

    // Return streaming response
    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error) {
    // Security: INJ-001 - Never expose internal error details to client
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
